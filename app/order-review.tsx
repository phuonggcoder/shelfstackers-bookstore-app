import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckoutSummary from '../components/CheckoutSummary';
import VoucherInput from '../components/VoucherInput';
import VoucherSelector from '../components/VoucherSelector';
import VoucherValidationPopup from '../components/VoucherValidationPopup';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import AddressService from '../services/addressService';
import { addToCart, getBookById, getCart } from '../services/api';
import { createOrder } from '../services/orderService';
import { PAYMENT_METHODS, PaymentMethod } from '../services/paymentService';
import ShippingService, { ShippingAddress, ShippingFeeRequest } from '../services/shippingService';
import { getAvailableVouchers, MultipleVoucherValidationResponse, validateVoucher } from '../services/voucherService';
import { formatVND, getBookImageUrl } from '../utils/format';
  // Khi quay lại màn hình, luôn lấy địa chỉ mới nhất từ AsyncStorage (nếu có)
//  useFocusEffect(
//     React.useCallback(() => {
//       const checkSelectedAddress = async () => {
//         const stored = await AsyncStorage.getItem('selected_address');
//         if (stored) {
//           try {
//             const parsed = JSON.parse(stored);
//             setAddress(parsed);
//           } catch {}
//         }
//       };
//       checkSelectedAddress();
//     }, [])
//   ); 

export default function OrderReviewScreen() {
  useFocusEffect(
    React.useCallback(() => {
      const checkSelectedAddress = async () => {
        const stored = await AsyncStorage.getItem('selected_address');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setAddress(parsed);
          } catch {}
        }
      };
      checkSelectedAddress();
    }, [])
  );
  const { t } = useTranslation();
  const { token } = useAuth();
  const { fetchCartCount } = useCart();
  const { showErrorToast, showWarningToast } = useUnifiedModal();
  const { bookId, ids, cartItems: cartItemsParam, totalAmount, itemCount } = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]); // For multi-item checkout
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(PAYMENT_METHODS.COD);
  const [shipping] = useState<'free' | 'fast'>('free');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any|null>(null);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const router = useRouter();

  // State chính
  const [selectedOrderVoucher, setSelectedOrderVoucher] = useState<any|null>(null);
  const [selectedShippingVoucher, setSelectedShippingVoucher] = useState<any|null>(null);
  // State tạm cho bottom sheet
  const [tempOrderVoucher, setTempOrderVoucher] = useState<any|null>(null);
  const [tempShippingVoucher, setTempShippingVoucher] = useState<any|null>(null);
  
  // State cho voucher validation popup
  const [voucherValidationPopup, setVoucherValidationPopup] = useState({
    visible: false,
    voucher: null,
    subtotal: 0,
  });
  const [lastValidationTime, setLastValidationTime] = useState(0);

  // State cho voucher system mới
  const [appliedVouchers, setAppliedVouchers] = useState<Array<{
    voucher: any;
    discountAmount: number;
  }>>([]);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [voucherResult, setVoucherResult] = useState<MultipleVoucherValidationResponse | null>(null);

  // Voucher handlers cho system mới
  const handleVoucherApplied = (voucher: any, discountAmount: number) => {
    // Check if voucher type already exists
    const existingVoucherIndex = appliedVouchers.findIndex(
      item => item.voucher.voucher_type === voucher.voucher_type
    );

    if (existingVoucherIndex >= 0) {
      // Replace existing voucher of same type
      const newAppliedVouchers = [...appliedVouchers];
      newAppliedVouchers[existingVoucherIndex] = { voucher, discountAmount };
      setAppliedVouchers(newAppliedVouchers);
    } else {
      // Add new voucher
      setAppliedVouchers(prev => [...prev, { voucher, discountAmount }]);
    }
  };

  const handleVoucherRemoved = () => {
    setAppliedVouchers([]);
    setVoucherResult(null);
  };

  const handleVouchersSelected = (result: MultipleVoucherValidationResponse) => {
    setVoucherResult(result);
    
    // Convert result to applied vouchers format
    // Note: MultipleVoucherValidationResponse doesn't include voucher objects
    // We'll need to fetch voucher details separately or modify the backend
    const newAppliedVouchers = result.results
      .filter(v => v.valid)
      .map(v => ({
        voucher: {
          voucher_id: v.voucher_id,
          voucher_type: v.voucher_type,
          discount_amount: v.discount_amount
        },
        discountAmount: v.discount_amount,
      }));
    
    setAppliedVouchers(newAppliedVouchers);
  };

  const handleEditVouchers = () => {
    setShowVoucherSelector(true);
  };

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!token) return;
      try {
        const addresses = await AddressService.getAddresses(token);
        setAddresses(addresses);
        console.log('OrderReview addresses:', addresses);
        // Nếu không còn địa chỉ nào, xóa selected_address khỏi AsyncStorage và UI
        if (!addresses || addresses.length === 0) {
          await AsyncStorage.removeItem('selected_address');
          setAddress(null);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        setAddresses([]);
        await AsyncStorage.removeItem('selected_address');
        setAddress(null);
      }
    };
    loadAddresses();
  }, [token]);

  // Load book or cart data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('OrderReview loadData - params:', { bookId, ids, cartItemsParam, totalAmount, itemCount });
        
        // First, try to load from AsyncStorage (from cart)
        const fromCart = await AsyncStorage.getItem('checkout_from_cart');
        if (fromCart === 'true') {
          console.log('📦 Loading cart data from AsyncStorage...');
          const storedCartItems = await AsyncStorage.getItem('checkout_cart_items');
          const storedTotalAmount = await AsyncStorage.getItem('checkout_total_amount');
          const storedItemCount = await AsyncStorage.getItem('checkout_item_count');
          
          if (storedCartItems) {
            console.log('✅ Found cart data in AsyncStorage');
            const parsedCartItems = JSON.parse(storedCartItems);
            console.log('Parsed cart items:', parsedCartItems);
            
            const formattedItems = parsedCartItems.map((item: any) => ({
              ...item,
              book: item.book_id,
            }));
            
            setCartItems(formattedItems);
            
            // Clear stored data
            await AsyncStorage.multiRemove([
              'checkout_cart_items', 
              'checkout_total_amount', 
              'checkout_item_count',
              'checkout_from_cart'
            ]);
            console.log('🧹 Cleared AsyncStorage data');
            return;
          }
        }
        
        // Fallback to URL parameters
        console.log('cartItemsParam type:', typeof cartItemsParam);
        console.log('cartItemsParam value:', cartItemsParam);
        
        if (cartItemsParam) {
          // Cart data passed directly from cart page
          try {
            const parsedCartItems = JSON.parse(cartItemsParam as string);
            console.log('OrderReview cart items from params:', parsedCartItems);
            console.log('Parsed items count:', parsedCartItems.length);
            
            // Map cart items to expected format
            const formattedItems = parsedCartItems.map((item: any) => ({
              ...item,
              book: item.book_id, // Map book_id to book for consistency
            }));
            
            console.log('OrderReview formatted items:', formattedItems);
            setCartItems(formattedItems);
          } catch (parseError) {
            console.error('Error parsing cartItemsParam:', parseError);
            console.log('cartItemsParam value:', cartItemsParam);
            setError(t('orderReview.cannotProcessCartData'));
          }
        } else if (ids) {
          // Multi-item checkout from cart - only load selected items
          if (!token) {
            console.error('No token available for cart fetch');
            setError(t('orderReview.noAuthToken'));
            return;
          }
          const cartData = await getCart(token);
          const allCartItems = cartData.items || [];
          
          // Parse selected item IDs
          const selectedIds = Array.isArray(ids) ? ids : ids.split(',').filter(id => id.trim() !== '');
          console.log('OrderReview selected IDs:', selectedIds);
          
          // Filter cart items to only include selected ones
          const selectedItems = allCartItems.filter((item: any) => {
            if (!item.book_id) {
              console.log('Skipping item with null book_id:', item);
              return false;
            }
            const bookId = item.book_id._id || item.book_id;
            const isSelected = selectedIds.includes(bookId);
            console.log('Checking item:', { bookId, isSelected, item });
            return isSelected;
          }).map((item: any) => ({
            ...item,
            book: item.book_id, // Map book_id to book for consistency
            quantity: Number(item.quantity) || 1,
            price: Number(item.book_id?.price) || 0
          }));
          
          console.log('OrderReview selected items:', selectedItems);
          setCartItems(selectedItems);
        } else if (bookId && typeof bookId === 'string') {
          // Single book checkout
          if (bookId.trim() !== '') {
            const bookData = await getBookById(bookId);
            // Ensure price is a valid number
            if (bookData && typeof bookData.price !== 'number') {
              bookData.price = Number(bookData.price) || 0;
            }
            console.log('Book data loaded:', bookData);
            setBook(bookData);
          }
        } else if (Array.isArray(bookId) && bookId.length > 0) {
          // Handle array case
          const firstBookId = bookId[0];
          if (firstBookId && typeof firstBookId === 'string') {
            const bookData = await getBookById(firstBookId);
            // Ensure price is a valid number
            if (bookData && typeof bookData.price !== 'number') {
              bookData.price = Number(bookData.price) || 0;
            }
            console.log('Book data loaded:', bookData);
            setBook(bookData);
          }
        } else {
          // Try to load from AsyncStorage as fallback
          try {
            const storedCartItems = await AsyncStorage.getItem('checkout_cart_items');
            const storedTotalAmount = await AsyncStorage.getItem('checkout_total_amount');
            const storedItemCount = await AsyncStorage.getItem('checkout_item_count');
            
            if (storedCartItems) {
              console.log('Loading cart data from AsyncStorage');
              const parsedCartItems = JSON.parse(storedCartItems);
              const formattedItems = parsedCartItems.map((item: any) => ({
                ...item,
                book: item.book_id,
                quantity: Number(item.quantity) || 1,
                price: Number(item.book_id?.price) || 0
              }));
              console.log('Formatted cart items:', formattedItems);
              setCartItems(formattedItems);
              
              // Clear stored data
              await AsyncStorage.multiRemove(['checkout_cart_items', 'checkout_total_amount', 'checkout_item_count']);
            }
          } catch (storageError) {
            console.error('Error loading from AsyncStorage:', storageError);
            setError(t('orderReview.cannotLoadFromStorage'));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError(t('orderReview.cannotLoadOrderData'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bookId, ids, cartItemsParam, token]);

  // Load vouchers
  useEffect(() => {
    const loadVouchers = async () => {
      if (!token) return;
      try {
        const vouchersData = await getAvailableVouchers();
        setVouchers(vouchersData.vouchers || vouchersData || []);
      } catch (error: any) {
        console.error('Error loading vouchers:', error);
        // Handle admin-only error gracefully
        if (error.msg?.includes('Admins only')) {
          console.log('Voucher API requires admin access, showing empty list');
          setVouchers([]);
        } else {
          // Fallback: set empty array để tránh lỗi
          setVouchers([]);
        }
      }
    };
    loadVouchers();
  }, [token]);

  // Calculate totals with new voucher system
  const subtotal = React.useMemo(() => {
    if (cartItems.length > 0) {
      return cartItems.reduce((sum, item) => {
        if (!item || !item.book) {
          return sum;
        }
        const price = Number(item.book.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const itemTotal = price * quantity;
        console.log(`Item calculation: ${item.book.title} - Price: ${price}, Quantity: ${quantity}, Total: ${itemTotal}`);
        return sum + itemTotal;
      }, 0);
    } else if (book && book.price !== undefined) {
      return Number(book.price) || 0;
    }
    return 0;
  }, [cartItems, book]);

  console.log('Subtotal calculation:', { subtotal, cartItemsLength: cartItems.length, bookPrice: book?.price, hasBook: !!book });

  // Calculate shipping fee (will be updated by API)
  const [shippingFee, setShippingFee] = useState(30000);
  
  // Calculate total with new voucher system
  const total = React.useMemo(() => {
    let finalSubtotal = subtotal;
    let finalShippingFee = shippingFee;
    
    // Apply order vouchers
    appliedVouchers.forEach(({ voucher, discountAmount }) => {
      if (voucher.voucher_type === 'order') {
        finalSubtotal -= discountAmount;
      }
    });
    
    // Apply shipping vouchers
    appliedVouchers.forEach(({ voucher, discountAmount }) => {
      if (voucher.voucher_type === 'shipping') {
        finalShippingFee -= discountAmount;
      }
    });
    
    const calculatedTotal = finalSubtotal + finalShippingFee;
    
    console.log('Total calculation with new voucher system:', {
      originalSubtotal: subtotal,
      finalSubtotal,
      originalShippingFee: shippingFee,
      finalShippingFee,
      appliedVouchers: appliedVouchers.length,
      calculatedTotal
    });
    
    return calculatedTotal;
  }, [subtotal, shippingFee, appliedVouchers]);

  console.log('Total calculation:', { subtotal, shippingFee, total, appliedVouchersCount: appliedVouchers.length });

  // Nhập mã voucher thủ công
  const [manualVoucherCode, setManualVoucherCode] = useState('');
  const [manualVoucherError, setManualVoucherError] = useState('');

  const handleManualVoucherApply = async () => {
    if (!manualVoucherCode) return;
    setManualVoucherError('');
    try {
      const validateRes = await import('../services/voucherService').then(m => m.validateVoucher(token || '', manualVoucherCode, subtotal));
      if (validateRes.valid && validateRes.voucher) {
        setSelectedVoucher(validateRes.voucher);
        setManualVoucherError('');
      } else {
        setManualVoucherError(validateRes.message || 'Mã không hợp lệ hoặc không đủ điều kiện');
      }
    } catch (e: any) {
      setManualVoucherError(e.message || 'Không thể kiểm tra mã');
    }
  };

  const handleEdit = async () => {
    if (!token) return;
    if (cartItems.length > 0) {
      // Coming from cart page, go back to cart
      router.back();
      return;
    }
    if (!book) return;
    try {
      await addToCart(token, book._id, 1);
      router.replace('/cart');
    } catch {
      showErrorToast(t('error'), t('orderReview.cannotAddToCart'));
    }
  };

  const handleAddressSelect = () => {
    // If no addresses, go to address list to add new one
    if (addresses.length === 0) {
      router.push('/address-list?from=order-review');
    } else {
      // If has addresses, go to address list to select/edit
      router.push('/address-list?from=order-review');
    }
  };

  const handleConfirm = async () => {
    if (!token) {
      showErrorToast(t('error'), t('orderReview.pleaseLoginAgain'));
      return;
    }

    if (!address) {
      showErrorToast(t('error'), t('orderReview.pleaseSelectShippingAddress'));
      return;
    }

    if (!selectedPaymentMethod) {
      showErrorToast(t('error'), t('orderReview.pleaseSelectPaymentMethod'));
      return;
    }

    // Check if we have items to order (either cart items or single book)
    if ((!cartItems || cartItems.length === 0) && !book) {
      showErrorToast(t('error'), t('orderReview.noProductsToOrder'));
      return;
    }

    // For cart items, check if they have valid data and stock
    if (cartItems.length > 0) {
      const invalidItems = cartItems.filter(item => !item.book || !item.book._id);
      if (invalidItems.length > 0) {
        showErrorToast(t('error'), t('orderReview.invalidCartItems'));
        return;
      }
      
      // Check stock for each item
      const outOfStockItems = cartItems.filter(item => {
        const availableStock = item.book.stock || 0;
        const requestedQuantity = item.quantity || 1;
        return requestedQuantity > availableStock;
      });
      
      if (outOfStockItems.length > 0) {
        const outOfStockMessage = outOfStockItems.map(item => 
          `${item.book.title}: ${t('orderReview.stockLeft', { count: item.book.stock })}, ${t('orderReview.requested', { count: item.quantity })}`
        ).join('\n');
        showWarningToast(t('orderReview.outOfStock'), `${t('orderReview.someProductsInsufficient')}:\n${outOfStockMessage}`);
        return;
      }
    }
    
    // For single book, check stock
    if (book && (!book.stock || book.stock < 1)) {
      showWarningToast(t('orderReview.outOfStock'), t('orderReview.productOutOfStock'));
      return;
    }

    try {
      console.log('Creating order with:', {
        address_id: address._id,
        payment_method: selectedPaymentMethod,
        voucher_code: selectedVoucher?.voucher_id,
        subtotal: subtotal,
        total: total,
        cart_items_count: cartItems.length,
        has_book: !!book,
        has_cart_items: cartItems.length > 0
      });

      // Validate that subtotal and total are valid numbers
      if (isNaN(subtotal) || subtotal < 0) {
        console.error('Invalid subtotal:', subtotal);
        showErrorToast('Lỗi', 'Giá trị đơn hàng không hợp lệ. Vui lòng thử lại.');
        return;
      }

      if (isNaN(total) || total < 0) {
        console.error('Invalid total:', total);
        showErrorToast('Lỗi', 'Tổng tiền đơn hàng không hợp lệ. Vui lòng thử lại.');
        return;
      }

      // Validate voucher if selected
      if (selectedVoucher) {
        try {
          console.log('Validating voucher:', selectedVoucher.voucher_id, 'with subtotal:', subtotal);
          const voucherValidation = await validateVoucher(token, selectedVoucher.voucher_id, subtotal);
          console.log('Voucher validation result:', voucherValidation);
          
          if (!voucherValidation.valid) {
            showErrorToast('Lỗi voucher', voucherValidation.message || 'Voucher không hợp lệ hoặc đã hết hạn.');
            return;
          }
        } catch (error: any) {
          console.error('Voucher validation error:', error);
          
          // Handle specific voucher errors
          let voucherErrorMsg = 'Không thể validate voucher. Vui lòng thử lại.';
          if (error.message?.includes('toString')) {
            voucherErrorMsg = 'Lỗi hệ thống voucher. Vui lòng thử lại sau.';
          } else if (error.message?.includes('Order value must be at least')) {
            voucherErrorMsg = 'Giá trị đơn hàng không đủ để áp dụng voucher. Vui lòng thêm sản phẩm hoặc chọn voucher khác.';
          }
          
          showErrorToast('Lỗi voucher', voucherErrorMsg);
          return;
        }
      }

      // Prepare voucher codes for shipping API
      const orderVoucher = appliedVouchers.find(v => v.voucher.voucher_type === 'order');
      const shippingVoucher = appliedVouchers.find(v => v.voucher.voucher_type === 'shipping');
      
      // Calculate shipping fee
      let shippingFee = 0;
      try {
        const fromAddress: ShippingAddress = {
          street: 'ShelfStackers Store',
          ward: 'Phường Bách Khoa',
          district: 'Quận Hai Bà Trưng',
          province: 'Hà Nội',
          latitude: 21.0285,
          longitude: 105.8542
        };
        
        const toAddress: ShippingAddress = {
          street: address.street || address.fullAddress || '',
          ward: address.ward?.name || '',
          district: address.district?.name || '',
          province: address.province?.name || '',
          latitude: address.location?.coordinates?.[1] || address.osm?.lat || 0,
          longitude: address.location?.coordinates?.[0] || address.osm?.lng || 0
        };
        
        // Calculate total weight of items with default weight
        let totalWeight = 0;
        const defaultWeight = 0.5; // 500g default weight per item
        
        if (cartItems.length > 0) {
          totalWeight = cartItems.reduce((sum, item) => {
            const itemWeight = item.book.weight || defaultWeight;
            console.log(`📦 Item weight: ${item.book.title} = ${itemWeight}kg (default: ${!item.book.weight})`);
            return sum + itemWeight * item.quantity;
          }, 0);
        } else if (book) {
          totalWeight = book.weight || defaultWeight;
          console.log(`📦 Single book weight: ${book.title} = ${totalWeight}kg (default: ${!book.weight})`);
        }
        
        console.log(`📦 Total weight calculation: ${totalWeight}kg`);
        
        const shippingRequest: ShippingFeeRequest = {
          fromAddress,
          toAddress,
          weight: totalWeight,
          carrier: 'GHN', // Default to GHN
          // Add new parameters for total price calculation
          subtotal: subtotal,
          voucher_code_order: orderVoucher?.voucher.voucher_id,
          voucher_code_shipping: shippingVoucher?.voucher.voucher_id
        };
        
        // Try API first, fallback to local calculation
        try {
          console.log('Calling shipping API with request:', JSON.stringify(shippingRequest, null, 2));
          const shippingResult = await ShippingService.calculateShippingFeeAPI(shippingRequest, token);
          console.log('Shipping API response:', JSON.stringify(shippingResult, null, 2));
          
          if (shippingResult.success && shippingResult.fees && shippingResult.fees.length > 0) {
            // Use total price from API if available, otherwise use shipping fee only
            if (shippingResult.priceBreakdown) {
              shippingFee = shippingResult.priceBreakdown.final_shipping_fee;
              console.log('✅ Using API total price calculation:', {
                subtotal: shippingResult.priceBreakdown.subtotal,
                order_discount: shippingResult.priceBreakdown.order_discount_amount,
                final_amount: shippingResult.priceBreakdown.final_amount,
                shipping_fee: shippingResult.priceBreakdown.shipping_fee,
                shipping_discount: shippingResult.priceBreakdown.shipping_discount_amount,
                final_shipping_fee: shippingResult.priceBreakdown.final_shipping_fee,
                total_price: shippingResult.priceBreakdown.total_price
              });
            } else {
              shippingFee = shippingResult.fees[0].fee; // Use the cheapest option
              console.log('✅ Using API shipping fee:', shippingFee);
            }
          } else {
            console.log('⚠️ API returned no fees, using local calculation');
            // Fallback to local calculation
            const localResult = await ShippingService.calculateShippingFee(shippingRequest);
            if (localResult.success && localResult.fees.length > 0) {
              shippingFee = localResult.fees[0].fee;
              console.log('✅ Using local shipping fee:', shippingFee);
            }
          }
        } catch (apiError) {
          console.log('❌ Shipping API failed, using local calculation:', apiError);
          // Fallback to local calculation
          const localResult = await ShippingService.calculateShippingFee(shippingRequest);
          if (localResult.success && localResult.fees.length > 0) {
            shippingFee = localResult.fees[0].fee;
            console.log('✅ Using fallback shipping fee:', shippingFee);
          }
        }
      } catch (error) {
        console.error('Error calculating shipping fee:', error);
        // Fallback to default shipping fee
        shippingFee = 15000;
      }

      // Fix address location type before creating order
      console.log('Original address location:', address?.location);
      const fixedAddress = fixLocationType(address);
      console.log('Fixed address location:', fixedAddress?.location);
      
              // Create order using the updated API endpoint with total price calculation
        const orderData: any = {
          address_id: fixedAddress._id,
          payment_method: selectedPaymentMethod,
          // Backend will calculate total price including shipping fee and vouchers
          ...(orderVoucher && { voucher_code_order: orderVoucher.voucher.voucher_id }),
          ...(shippingVoucher && { voucher_code_shipping: shippingVoucher.voucher.voucher_id })
        };

      // Add book_id for single book purchase (buy now)
      if (cartItems.length === 0 && book) {
        orderData.book_id = book._id;
        orderData.quantity = Number(1);
      } else if (cartItems.length > 0) {
        // Add cart items for multi-item purchase
        orderData.cart_items = cartItems.map(item => ({
          book_id: item.book._id,
          quantity: Number(item.quantity) || 1
        }));
      }

      console.log('Order data being sent:', orderData);
              console.log('Order data details:', {
          address_id: orderData.address_id,
          payment_method: orderData.payment_method,
          book_id: orderData.book_id,
          quantity: orderData.quantity,
          cart_items: orderData.cart_items,
          voucher_code_order: orderData.voucher_code_order,
          voucher_code_shipping: orderData.voucher_code_shipping
        });
      const response = await createOrder(token, orderData);
      console.log('Order created successfully:', response);

      // Handle new API response structure
      let orderId;
      let zaloPayData;
      let orderCode;
      
      if (response.success && response.order) {
        // New response structure
        orderId = response.order._id;
        orderCode = response.order.order_id;
        zaloPayData = response.zaloPay;
      } else {
        // Fallback for old response structure
        orderId = response.order?._id || response._id;
        orderCode = response.order?.order_id || response.order_id;
        zaloPayData = response.zaloPay;
      }

      // Điều hướng sang trang ZaloPay nếu có order_url
      // Backend đã tự động xóa giỏ hàng sau khi đặt hàng thành công
      // Cập nhật cart count về 0
      if (token) {
        try {
          await fetchCartCount(token);
        } catch (error) {
          console.warn('Không thể cập nhật cart count:', error);
        }
      }
      if (zaloPayData?.order_url) {
        router.replace({ pathname: '/zalo-pay', params: { orderId } });
        return;
      }

              // Nếu payment method là PAYOS, điều hướng tới màn PayOS để lấy link/QR
        if (selectedPaymentMethod === PAYMENT_METHODS.PAYOS) {
          // Use total price from API response if available
          const paymentAmount = response.total_price_final || response.order?.total_amount || total;
          // cast to any to avoid typed-route union restrictions
          (router.replace as any)(`/payos?orderId=${orderId}&amount=${paymentAmount}`);
          return;
        }

      // Điều hướng sang trang thành công nếu không có ZaloPay hoặc PayOS
      router.replace({ pathname: '/order-success', params: { orderId } });
    } catch (error: any) {
      console.error('Order creation error:', error);
      
      // Handle specific backend errors with improved messages
      let errorMessage = 'Không thể đặt hàng. Vui lòng thử lại.';
      
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('not enough stock')) {
          errorMessage = 'Sản phẩm không đủ số lượng trong kho. Vui lòng chọn sản phẩm khác hoặc giảm số lượng.';
        } else if (errorMsg.includes('cannot read properties of null') && errorMsg.includes('stock')) {
          errorMessage = 'Lỗi hệ thống: Thông tin sản phẩm không hợp lệ. Vui lòng thử lại sau.';
        } else if (errorMsg.includes('duplicate key error')) {
          errorMessage = 'Lỗi hệ thống: Trùng lặp đơn hàng. Vui lòng thử lại sau.';
        } else if (errorMsg.includes('order value must be at least')) {
          errorMessage = 'Giá trị đơn hàng không đủ để áp dụng voucher. Vui lòng thêm sản phẩm hoặc chọn voucher khác.';
        } else if (errorMsg.includes('payment method is required')) {
          errorMessage = 'Vui lòng chọn phương thức thanh toán hợp lệ.';
        } else if (errorMsg.includes('cart is empty')) {
          errorMessage = 'Giỏ hàng trống. Vui lòng thêm sản phẩm vào giỏ hàng.';
        } else if (errorMsg.includes('address not found')) {
          errorMessage = 'Địa chỉ không hợp lệ. Vui lòng chọn địa chỉ khác.';
        } else if (errorMsg.includes('voucher not found')) {
          errorMessage = 'Voucher không tồn tại hoặc đã bị xóa.';
        } else if (errorMsg.includes('voucher is not active')) {
          errorMessage = 'Voucher không còn hoạt động.';
        } else if (errorMsg.includes('voucher has expired')) {
          errorMessage = 'Voucher đã hết hạn.';
        } else if (errorMsg.includes('usage limit exceeded')) {
          errorMessage = 'Voucher đã hết lượt sử dụng.';
        } else if (errorMsg.includes('already used this voucher')) {
          errorMessage = 'Bạn đã sử dụng voucher này tối đa số lần cho phép.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showErrorToast('Lỗi', errorMessage);
    }
  };

  // Helper function to validate image URL

  // Helper function to fix location type for order creation
  const fixLocationType = (address: any) => {
    if (!address || !address.location) return address;
    
    // Fix location type if it's a string instead of object
    if (typeof address.location.type === 'string') {
      return {
        ...address,
        location: {
          ...address.location,
          type: { type: address.location.type } // Convert string to object with type property
        }
      };
    }
    
    return address;
  };

  const formatAddressText = (addr: any) => {
    if (!addr) return '';
    const parts = [];
    if (addr.address_detail) parts.push(addr.address_detail);
    if (addr.ward) parts.push(addr.ward);
    if (addr.district) parts.push(addr.district);
    if (addr.province) parts.push(addr.province);
    return parts.join(', ');
  };

  // Khi mở modal, copy state chính sang state tạm
  const openVoucherModal = () => {
    setTempOrderVoucher(selectedOrderVoucher);
    setTempShippingVoucher(selectedShippingVoucher);
    setVoucherModalVisible(true);
  };

  // Function để validate voucher và hiển thị popup
  const validateVoucherAndShowPopup = (voucher: any) => {
    const now = Date.now();
    const timeSinceLastValidation = now - lastValidationTime;
    
    // Prevent spam clicking - chỉ cho phép validation mỗi 2 giây
    if (timeSinceLastValidation < 2000) {
      return false;
    }
    
    setLastValidationTime(now);
    
    const minOrderValue = voucher?.min_order_value || 0;
    const isInsufficient = subtotal < minOrderValue;
    
    if (isInsufficient) {
      setVoucherValidationPopup({
        visible: true,
        voucher: voucher,
        subtotal: subtotal,
      });
      return false;
    }
    
    return true;
  };

  const closeVoucherValidationPopup = () => {
    setVoucherValidationPopup({
      visible: false,
      voucher: null,
      subtotal: 0,
    });
  };

  // Dialog state cho lỗi payment chưa hoàn tất
  const [pendingPaymentDialog, setPendingPaymentDialog] = useState<{ visible: boolean, paymentId?: string } | null>(null);

  const renderPendingPaymentDialog = () => {
    if (!pendingPaymentDialog?.visible) return null;
    return (
      <Modal visible transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={48} color="#e67e22" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#e67e22', marginBottom: 8 }}>Bạn đã có giao dịch chưa hoàn tất</Text>
            <Text style={{ fontSize: 15, color: '#444', textAlign: 'center', marginBottom: 16 }}>
              Vui lòng hoàn tất giao dịch cũ trước khi tạo đơn hàng mới.
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{ backgroundColor: '#3498db', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, marginRight: 8 }}
                onPress={() => {
                  setPendingPaymentDialog(null);
                  if (pendingPaymentDialog.paymentId) {
                    router.replace({ pathname: '/order-detail', params: { orderId: pendingPaymentDialog.paymentId } });
                  } else {
                    router.replace('/order-history');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Đi tới đơn cần thanh toán</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#bbb', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 }}
                onPress={() => {
                  setPendingPaymentDialog(null);
                  router.back();
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3255FB" />
        <Text style={{ marginTop: 10 }}>{t('orderReview.loading')}</Text>
      </View>
    </SafeAreaView>
  );
  
  if (error) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#3255FB', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>{t('orderReview.back')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  
  if (cartItems.length === 0 && !book) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="cart-outline" size={64} color="#bdc3c7" />
        <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center' }}>
          {t('orderReview.noProductError')}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#3255FB', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>{t('orderReview.back')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  
  if (cartItems.length === 0 && (!book || typeof book.price !== 'number')) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="book-outline" size={64} color="#bdc3c7" />
        <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center' }}>
          {t('orderReview.noProductError')}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#3255FB', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>{t('orderReview.back')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orderReview.confirmOrder')}</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editHeaderBtn}>
          <Text style={styles.editHeaderText}>{t('orderReview.edit')}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('orderReview.product')}</Text>
        </View>
        
        {cartItems.length > 0 ? (
          // Multiple items from cart
          cartItems.filter(item => item && item.book).map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Image 
                source={{ uri: getBookImageUrl(item.book) }} 
                style={styles.bookImage} 
                contentFit="cover"
                transition={200}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle}>{item.book?.title || t('orderReview.noName')}</Text>
                <Text style={styles.bookAuthor}>{t('orderReview.author')}: {item.book?.author || ''}</Text>
                <Text style={styles.bookPrice}>{formatVND(item.book?.price || 0)}</Text>
                <Text style={styles.qty}>{t('orderReview.quantity')}: {item.quantity || 1}</Text>
              </View>
            </View>
          ))
        ) : (
          // Single book (buy now)
          <View style={styles.itemRow}>
            <Image 
              source={{ uri: getBookImageUrl(book) }} 
              style={styles.bookImage} 
              contentFit="cover"
              transition={200}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>{book.title || t('orderReview.noName')}</Text>
              <Text style={styles.bookAuthor}>{t('orderReview.author')}: {book.author || ''}</Text>
              <Text style={styles.bookPrice}>{formatVND(book.price || 0)}</Text>
              <Text style={styles.qty}>{t('orderReview.quantity')}: 1</Text>
            </View>
          </View>
        )}
        
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('orderReview.shippingAddress')}</Text>
        </View>
        
        {address ? (
          <TouchableOpacity style={styles.addressContainer} onPress={handleAddressSelect}>
            <View style={styles.addressInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.addressName}>{address.fullName || address.receiver_name}</Text>
                <Text style={styles.addressPhone}> | {address.phone || address.phone_number}</Text>
                {address.isDefault && (
                  <View style={{ backgroundColor: '#eaf1ff', borderRadius: 4, marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: '#3255FB', fontWeight: 'bold', fontSize: 11 }}>{t('default')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>{address.fullAddress || formatAddressText(address)}</Text>
              {address.type && (
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                  <View style={{ backgroundColor: '#f0f4ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 }}>
                    <Text style={{ color: '#3255FB', fontSize: 11, fontWeight: 'bold' }}>
                      {address.type === 'office' ? t('office') : t('home')}
                    </Text>
                  </View>
                </View>
              )}
              {address.note && (
                <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{t('note')}: {address.note}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.noAddressContainer} onPress={handleAddressSelect}>
            <Ionicons name="location-outline" size={24} color="#bdc3c7" />
            <Text style={styles.noAddressText}>{t('orderReview.noShippingAddress')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
        
        {/* --- VOUCHER SECTION (NEW SYSTEM) --- */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Voucher</Text>
        </View>
        <VoucherInput
          orderValue={subtotal}
          onVoucherApplied={handleVoucherApplied}
          onVoucherRemoved={handleVoucherRemoved}
          appliedVoucher={appliedVouchers[0]?.voucher}
        />
        {/* --- PHƯƠNG THỨC THANH TOÁN (GỌN GÀNG, DẠNG MODAL) --- */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('orderReview.paymentMethod')}</Text>
        </View>
        <TouchableOpacity
          style={styles.paymentSelectBtn}
          onPress={() => setPaymentModalVisible(true)}
        >
          {/* icon mapping: card for ZaloPay/PayOS, cash for COD */}
          <Ionicons
            name={
              selectedPaymentMethod === PAYMENT_METHODS.COD ? 'cash-outline' : 'card-outline'
            }
            size={20}
            color="#3255FB"
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: '#3255FB', fontWeight: 'bold' }}>
            {selectedPaymentMethod === PAYMENT_METHODS.ZALOPAY && t('orderReview.payViaZaloPay')}
            {selectedPaymentMethod === PAYMENT_METHODS.PAYOS && (t('orderReview.payViaPayOS') || 'Thanh toán qua PayOS')}
            {selectedPaymentMethod === PAYMENT_METHODS.COD && t('orderReview.payOnDelivery')}
          </Text>
        </TouchableOpacity>
        {/* Thay thế Modal voucher và payment bằng bottom sheet custom đẹp */}
        {/* --- VOUCHER BOTTOM SHEET --- */}
        <Modal
          visible={voucherModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setVoucherModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={() => setVoucherModalVisible(false)}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>{t('orderReview.selectVoucher')}</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {/* Mã giảm giá */}
                <Text style={styles.voucherGroupTitle}>{t('orderReview.discountVoucher')}</Text>
                {vouchers.filter(v => v.discount_type === 'order').length === 0 && (
                  <Text style={styles.noVouchersText}>{t('orderReview.noDiscountVouchers')}</Text>
                )}
                {vouchers.filter(v => v.discount_type === 'order').map(v => {
                  const expired = v.end_date ? new Date(v.end_date) <= new Date() : false;
                  const minOrderValue = v?.min_order_value || 0;
                  const isInsufficient = subtotal < minOrderValue;
                  const isDisabled = expired || isInsufficient;
                  const isSelected = tempOrderVoucher?._id === v._id;
                  return (
                    <TouchableOpacity
                      key={v._id}
                      style={[
                        styles.bottomSheetItem,
                        isSelected && styles.bottomSheetItemSelected,
                        isDisabled && styles.bottomSheetItemDisabled
                      ]}
                      activeOpacity={isDisabled ? 1 : 0.7}
                      onPress={() => {
                        if (isDisabled) {
                          // Show custom notification instantly if invalid
                          setTimeout(() => {
                            showWarningToast('Không thể chọn', expired ? 'Voucher đã hết hạn.' : 'Đơn hàng chưa đủ điều kiện để áp dụng mã này.');
                          }, 0);
                          return;
                        }
                        setTempOrderVoucher(isSelected ? null : v);
                      }}
                    >
                      {/* Icon left */}
                      <Ionicons name="pricetag" size={24} color="#FF9800" style={{ marginRight: 14 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.voucherCode}>{v.title || v.voucher_id}</Text>
                        <Text style={styles.voucherDescription}>{v.description || ''}</Text>
                        <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: 'bold' }}>
                          {v.voucher_type === 'percent'
                            ? `${t('orderReview.discountPercent', { value: v.discount_value })}`
                            : `${t('orderReview.discountAmount', { value: formatVND(v.discount_value) })}`}
                        </Text>
                        <Text style={styles.voucherExpiry}>HSD: {v.end_date ? new Date(v.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}</Text>
                        {isInsufficient && (
                          <Text style={styles.voucherInsufficient}>
                            Cần thêm {(minOrderValue - subtotal).toLocaleString('vi-VN')} VNĐ
                          </Text>
                        )}
                      </View>
                      {/* Checkbox right */}
                      <View style={[styles.radioButton, isSelected && styles.selectedRadio, { marginLeft: 12 }]}> 
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                        ) : (
                          <Ionicons name="ellipse-outline" size={22} color={isDisabled ? '#eee' : '#bbb'} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Mã vận chuyển */}
                <Text style={styles.voucherGroupTitle}>{t('orderReview.shippingVoucher')}</Text>
                {vouchers.filter(v => v.discount_type === 'shipping').length === 0 && (
                  <Text style={styles.noVouchersText}>{t('orderReview.noShippingVouchers')}</Text>
                )}
                {vouchers.filter(v => v.discount_type === 'shipping').map(v => {
                  const expired = v.end_date ? new Date(v.end_date) <= new Date() : false;
                  const minOrderValue = v?.min_order_value || 0;
                  const isInsufficient = subtotal < minOrderValue;
                  const isDisabled = expired || isInsufficient;
                  const isSelected = tempShippingVoucher?._id === v._id;
                  return (
                    <TouchableOpacity
                      key={v._id}
                      style={[
                        styles.bottomSheetItem,
                        isSelected && styles.bottomSheetItemSelected,
                        isDisabled && styles.bottomSheetItemDisabled
                      ]}
                      activeOpacity={isDisabled ? 1 : 0.7}
                      onPress={() => {
                        if (isDisabled) {
                          setTimeout(() => {
                            showWarningToast('Không thể chọn', expired ? 'Voucher đã hết hạn.' : 'Đơn hàng chưa đủ điều kiện để áp dụng mã này.');
                          }, 0);
                          return;
                        }
                        setTempShippingVoucher(isSelected ? null : v);
                      }}
                    >
                      {/* Icon left */}
                      <Ionicons name="cube" size={24} color="#2196F3" style={{ marginRight: 14 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.voucherCode}>{v.title || v.voucher_id}</Text>
                        <Text style={styles.voucherDescription}>{v.description || ''}</Text>
                        <Text style={{ color: '#2196F3', fontSize: 13, fontWeight: 'bold' }}>
                          {v.voucher_type === 'percent'
                            ? `${t('orderReview.shippingDiscountPercent', { value: v.discount_value })}`
                            : `${t('orderReview.shippingDiscountAmount', { value: formatVND(v.discount_value) })}`}
                        </Text>
                        <Text style={styles.voucherExpiry}>{t('orderReview.voucherExpiry')}: {v.end_date ? new Date(v.end_date).toLocaleDateString('vi-VN') : 'Không xác định'}</Text>
                        {isInsufficient && (
                          <Text style={styles.voucherInsufficient}>
                            Cần thêm {(minOrderValue - subtotal).toLocaleString('vi-VN')} VNĐ
                          </Text>
                        )}
                      </View>
                      {/* Checkbox right */}
                      <View style={[styles.radioButton, isSelected && styles.selectedRadio, { marginLeft: 12 }]}> 
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                        ) : (
                          <Ionicons name="ellipse-outline" size={22} color={isDisabled ? '#eee' : '#bbb'} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.bottomSheetActions}>
                <TouchableOpacity style={styles.bottomSheetBtn} onPress={() => {
                  setSelectedOrderVoucher(tempOrderVoucher);
                  setSelectedShippingVoucher(tempShippingVoucher);
                  setVoucherModalVisible(false);
                }}>
                  <Text style={styles.bottomSheetBtnText}>{t('orderReview.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        {/* --- PHƯƠNG THỨC THANH TOÁN BOTTOM SHEET --- */}
        <Modal
          visible={paymentModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={() => setPaymentModalVisible(false)}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>{t('orderReview.selectPaymentMethod')}</Text>
              <TouchableOpacity
                style={[
                  styles.bottomSheetItem,
                  selectedPaymentMethod === PAYMENT_METHODS.COD && styles.bottomSheetItemSelected
                ]}
                onPress={() => setSelectedPaymentMethod(PAYMENT_METHODS.COD)}
              >
                <Ionicons name="cash-outline" size={24} color="#3255FB" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentText}>{t('orderReview.payOnDelivery')}</Text>
                  <Text style={styles.paymentDescription}>{t('orderReview.payOnDeliveryDescription')}</Text>
                </View>
                {selectedPaymentMethod === PAYMENT_METHODS.COD && (
                  <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bottomSheetItem,
                  selectedPaymentMethod === PAYMENT_METHODS.ZALOPAY && styles.bottomSheetItemSelected
                ]}
                onPress={() => setSelectedPaymentMethod(PAYMENT_METHODS.ZALOPAY)}
              >
                <Ionicons name="card-outline" size={24} color="#3255FB" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentText}>{t('orderReview.payViaZaloPay')}</Text>
                  <Text style={styles.paymentDescription}>{t('orderReview.payViaZaloPayDescription')}</Text>
                </View>
                {selectedPaymentMethod === PAYMENT_METHODS.ZALOPAY && (
                  <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bottomSheetItem,
                  selectedPaymentMethod === PAYMENT_METHODS.PAYOS && styles.bottomSheetItemSelected
                ]}
                onPress={() => setSelectedPaymentMethod(PAYMENT_METHODS.PAYOS)}
              >
                <Ionicons name="card" size={24} color="#3255FB" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentText}>{t('orderReview.payViaPayOS', { defaultValue: 'Thanh toán qua PayOS' })}</Text>
                  <Text style={styles.paymentDescription}>{t('orderReview.payViaPayOSDescription', { defaultValue: 'Thanh toán qua cổng PayOS (VietQR / Webcheckout)' })}</Text>
                </View>
                {selectedPaymentMethod === PAYMENT_METHODS.PAYOS && (
                  <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                )}
              </TouchableOpacity>
              <View style={styles.bottomSheetActions}>
                <TouchableOpacity style={styles.bottomSheetBtn} onPress={() => setPaymentModalVisible(false)}>
                  <Text style={styles.bottomSheetBtnText}>{t('orderReview.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Order Summary with Vouchers */}
        <CheckoutSummary
          subtotal={subtotal}
          shippingFee={shippingFee}
          appliedVouchers={appliedVouchers}
          onEditVouchers={handleEditVouchers}
          showVoucherSection={true}
        />
        
      </ScrollView>
      
      <TouchableOpacity style={styles.payButton} onPress={handleConfirm}>
        <Text style={styles.payButtonText}>{t('orderReview.confirmOrder')}</Text>
      </TouchableOpacity>

      {/* Voucher Validation Popup */}
      <VoucherValidationPopup
        visible={voucherValidationPopup.visible}
        voucher={voucherValidationPopup.voucher}
        subtotal={voucherValidationPopup.subtotal}
        onClose={closeVoucherValidationPopup}
      />

      {/* Pending Payment Dialog */}
      {renderPendingPaymentDialog()}

      {/* Voucher Selector Modal */}
      <VoucherSelector
        visible={showVoucherSelector}
        orderValue={subtotal}
        shippingCost={shippingFee}
        onVouchersSelected={handleVouchersSelected}
        onClose={() => setShowVoucherSelector(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  qrCloseBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  backBtn: { marginRight: 10, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#222' },
  editHeaderBtn: { padding: 4 },
  editHeaderText: { color: '#3255FB', fontWeight: 'bold', fontSize: 16 },
  itemRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center', paddingHorizontal: 10 },
  bookImage: { width: 70, height: 90, borderRadius: 8, marginRight: 16 },
  bookTitle: { fontSize: 16, fontWeight: 'bold' },
  bookAuthor: { color: '#666' },
  bookPrice: { color: '#3255FB', fontWeight: 'bold', fontSize: 15 },
  qty: { color: '#888', fontSize: 13 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 10 },
  sectionLabel: { fontWeight: 'bold', fontSize: 16 },
  sectionValue: { color: '#222', marginBottom: 10, marginTop: 2, paddingHorizontal: 10 },
  edit: { color: '#3255FB', fontWeight: 'bold' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10 },
  paymentIcon: { width: 32, height: 32, marginRight: 8 },
  paymentText: { fontWeight: 'bold', marginRight: 8 },
  paymentCard: { color: '#888' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2, paddingHorizontal: 10 },
  grandTotal: { fontWeight: 'bold', fontSize: 18, color: '#222' },
  payButton: { backgroundColor: '#3255FB', borderRadius: 25, paddingVertical: 16, marginTop: 20, alignItems: 'center', marginHorizontal: 10 },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  addressContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8,
    marginHorizontal: 10
  },
  addressInfo: {
    flex: 1,
  },
  addressName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  addressPhone: { color: '#666', marginBottom: 5 },
  addressText: { color: '#222' },
  addAddressButton: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  addAddressText: { color: '#3255FB', fontWeight: 'bold', marginLeft: 10 },
  scrollView: { padding: 10 },
  voucherContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  voucherItem: { 
    borderWidth: 2, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 12, 
    backgroundColor: '#fff',
    minWidth: 180,
    position: 'relative'
  },
  voucherItemSelected: { borderColor: '#3255FB' },
  voucherItemExpired: { backgroundColor: '#eee' },
  voucherTitle: { fontWeight: 'bold', color: '#3255FB' },
  voucherTitleExpired: { color: '#aaa' },
  voucherCode: { fontSize: 13, fontWeight: '600', marginVertical: 2 },
  voucherDescription: { fontSize: 12, color: '#333' },
  voucherExpiry: { fontSize: 11, color: '#888', marginTop: 2 },
  voucherCheck: { position: 'absolute', top: 8, right: 8 },
  noVouchersText: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  noAddressContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8,
    marginHorizontal: 10
  },
  noAddressText: { 
    color: '#bdc3c7', 
    marginLeft: 10, 
    fontSize: 14 
  },
  paymentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedPaymentOption: {
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedPaymentText: {
    color: '#3255FB',
    fontWeight: 'bold',
  },
  paymentDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#3255FB',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3255FB',
  },
  voucherSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#3255FB',
  },
  voucherModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#3255FB',
  },
  // Thêm style cho bottom sheet
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 220,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8f9ff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bottomSheetItemSelected: {
    borderColor: '#3255FB',
    backgroundColor: '#eaf1ff',
  },
  bottomSheetItemDisabled: {
    opacity: 0.5,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bottomSheetBtn: {
    flex: 1,
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  bottomSheetBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  voucherGroupTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginTop: 10,
    marginBottom: 4,
    marginLeft: 2,
  },
  voucherInsufficient: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 2,
  },
});
