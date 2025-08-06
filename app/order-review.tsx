import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';
import VoucherValidationPopup from '../components/VoucherValidationPopup';
import { useAuth } from '../context/AuthContext';
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';
import AddressService from '../services/addressService';
import { addToCart, getBookById, getCart } from '../services/api';
import { createOrder } from '../services/orderService';
import { PAYMENT_METHODS, PaymentMethod } from '../services/paymentService';
import { getAvailableVouchers, validateVoucher } from '../services/voucherService';
import { formatVND, getBookImageUrl } from '../utils/format';

export default function OrderReviewScreen() {
  const { token } = useAuth();
  const { showAlert, alertVisible, alertConfig, hideAlert } = useUnifiedComponent();
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


  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!token) return;
      try {
        const addresses = await AddressService.getAddresses(token);
        setAddresses(addresses);
        console.log('OrderReview addresses:', addresses);
        
        // Always use default address or first available address
        const defaultAddress = addresses.find((addr: any) => addr.is_default) || addresses[0];
        if (defaultAddress) {
          setAddress(defaultAddress);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        setAddresses([]);
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
            setError('Không thể xử lý dữ liệu giỏ hàng');
          }
        } else if (ids) {
          // Multi-item checkout from cart - only load selected items
          if (!token) {
            console.error('No token available for cart fetch');
            setError('Không có token xác thực');
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
          }));
          
          console.log('OrderReview selected items:', selectedItems);
          setCartItems(selectedItems);
        } else if (bookId && typeof bookId === 'string') {
          // Single book checkout
          if (bookId.trim() !== '') {
            const bookData = await getBookById(bookId);
            setBook(bookData);
          }
        } else if (Array.isArray(bookId) && bookId.length > 0) {
          // Handle array case
          const firstBookId = bookId[0];
          if (firstBookId && typeof firstBookId === 'string') {
            const bookData = await getBookById(firstBookId);
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
              }));
              setCartItems(formattedItems);
              
              // Clear stored data
              await AsyncStorage.multiRemove(['checkout_cart_items', 'checkout_total_amount', 'checkout_item_count']);
            }
          } catch (storageError) {
            console.error('Error loading from AsyncStorage:', storageError);
            setError('Không thể tải dữ liệu từ bộ nhớ');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Không thể tải dữ liệu đơn hàng');
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
        const vouchersData = await getAvailableVouchers(token);
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

  // Calculate totals
  const subtotal = cartItems.length > 0
    ? cartItems.reduce((sum, item) => {
        if (!item || !item.book) {
          console.log('Skipping item with null book for subtotal calculation:', item);
          return sum;
        }
        const price = item.book.price || 0;
        const quantity = item.quantity || 1;
        console.log('Adding to subtotal:', { title: item.book.title, price, quantity, total: price * quantity });
        return sum + (price * quantity);
      }, 0)
    : (book?.price || 0);
  
  const shippingFee = shipping === 'free' ? 0 : 30000;
  const discount = selectedVoucher ? (selectedVoucher.voucher_type==='percent' ? subtotal*selectedVoucher.discount_value/100 : selectedVoucher.discount_value) : 15000; // fallback 15000 demo
  const total = subtotal - discount + shippingFee;

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
      showAlert('Lỗi', 'Không thể thêm vào giỏ hàng.', 'error');
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
      showAlert('Lỗi', 'Vui lòng đăng nhập lại.', 'error');
      return;
    }

    if (!address) {
      showAlert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng.', 'error');
      return;
    }

    if (!selectedPaymentMethod) {
      showAlert('Lỗi', 'Vui lòng chọn phương thức thanh toán.', 'error');
      return;
    }

    // Check if we have items to order (either cart items or single book)
    if ((!cartItems || cartItems.length === 0) && !book) {
      showAlert('Lỗi', 'Không có sản phẩm để đặt hàng. Vui lòng thêm sản phẩm vào giỏ hàng.', 'error');
      return;
    }

    // For cart items, check if they have valid data and stock
    if (cartItems.length > 0) {
      const invalidItems = cartItems.filter(item => !item.book || !item.book._id);
      if (invalidItems.length > 0) {
        showAlert('Lỗi', 'Một số sản phẩm trong giỏ hàng không hợp lệ. Vui lòng thử lại.', 'error');
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
          `${item.book.title}: Còn ${item.book.stock}, Yêu cầu ${item.quantity}`
        ).join('\n');
        showAlert('Hết hàng', `Một số sản phẩm không đủ số lượng:\n${outOfStockMessage}`, 'warning');
        return;
      }
    }
    
    // For single book, check stock
    if (book && (!book.stock || book.stock < 1)) {
      showAlert('Hết hàng', 'Sản phẩm này hiện đã hết hàng.', 'warning');
      return;
    }

    try {
      console.log('Creating order with:', {
        address_id: address._id,
        payment_method: selectedPaymentMethod,
        voucher_code: selectedVoucher?.voucher_id,
        subtotal: subtotal,
        cart_items_count: cartItems.length,
        has_book: !!book,
        has_cart_items: cartItems.length > 0
      });

      // Validate voucher if selected
      if (selectedVoucher) {
        try {
          console.log('Validating voucher:', selectedVoucher.voucher_id, 'with subtotal:', subtotal);
          const voucherValidation = await validateVoucher(token, selectedVoucher.voucher_id, subtotal);
          console.log('Voucher validation result:', voucherValidation);
          
          if (!voucherValidation.valid) {
            showAlert('Lỗi voucher', voucherValidation.msg || 'Voucher không hợp lệ hoặc đã hết hạn.', 'error');
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
          
          showAlert('Lỗi voucher', voucherErrorMsg, 'error');
          return;
        }
      }

      // Create order using the correct API endpoint
      const orderData = {
        address_id: address._id,
        payment_method: selectedPaymentMethod,
        ...(selectedOrderVoucher && { voucher_code_order: selectedOrderVoucher.voucher_id }),
        ...(selectedShippingVoucher && { voucher_code_shipping: selectedShippingVoucher.voucher_id })
      };

      // Add book_id for single book purchase (buy now)
      if (cartItems.length === 0 && book) {
        orderData.book_id = book._id;
        orderData.quantity = 1;
      } else if (cartItems.length > 0) {
        // Add cart items for multi-item purchase
        orderData.cart_items = cartItems.map(item => ({
          book_id: item.book._id,
          quantity: item.quantity
        }));
      }

      console.log('Order data being sent:', orderData);
      console.log('Order data details:', {
        address_id: orderData.address_id,
        payment_method: orderData.payment_method,
        book_id: orderData.book_id,
        quantity: orderData.quantity,
        cart_items: orderData.cart_items,
        voucher_code: orderData.voucher_code
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
      if (zaloPayData && zaloPayData.order_url) {
        router.replace({ pathname: '/zalo-pay', params: { orderId } });
        return;
      }
      // Nếu không có, fallback sang order-success
      // Ưu tiên truyền order_id đẹp nếu có, fallback sang _id
      router.replace({ pathname: '/order-success', params: { orderId: orderCode || orderId } });
      return;
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
      
      showAlert('Lỗi', errorMessage, 'error');
    }
  };

  // Helper function to validate image URL


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

  if (loading) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3255FB" />
        <Text style={{ marginTop: 10 }}>Đang tải...</Text>
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
          <Text style={{ color: 'white' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  
  if (cartItems.length === 0 && !book) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="cart-outline" size={64} color="#bdc3c7" />
        <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center' }}>
          Không tìm thấy sản phẩm hoặc dữ liệu lỗi.
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#3255FB', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  
  if (cartItems.length === 0 && (!book || typeof book.price !== 'number')) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="book-outline" size={64} color="#bdc3c7" />
        <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center' }}>
          Không tìm thấy sản phẩm hoặc dữ liệu lỗi.
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#3255FB', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>Quay lại</Text>
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
        <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editHeaderBtn}>
          <Text style={styles.editHeaderText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Sản phẩm</Text>
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
                <Text style={styles.bookTitle}>{item.book?.title || 'Không có tên'}</Text>
                <Text style={styles.bookAuthor}>Tác giả: {item.book?.author || ''}</Text>
                <Text style={styles.bookPrice}>{formatVND(item.book?.price || 0)}</Text>
                <Text style={styles.qty}>Số lượng: {item.quantity || 1}</Text>
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
              <Text style={styles.bookTitle}>{book.title || 'Không có tên'}</Text>
              <Text style={styles.bookAuthor}>Tác giả: {book.author || ''}</Text>
              <Text style={styles.bookPrice}>{formatVND(book.price || 0)}</Text>
              <Text style={styles.qty}>Số lượng: 1</Text>
            </View>
          </View>
        )}
        
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Địa chỉ nhận hàng</Text>
        </View>
        
        {address ? (
          <TouchableOpacity style={styles.addressContainer} onPress={handleAddressSelect}>
            <View style={styles.addressInfo}>
              <Text style={styles.addressName}>{address.receiver_name}</Text>
              <Text style={styles.addressPhone}>{address.phone_number}</Text>
              <Text style={styles.addressText}>{formatAddressText(address)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.noAddressContainer} onPress={handleAddressSelect}>
            <Ionicons name="location-outline" size={24} color="#bdc3c7" />
            <Text style={styles.noAddressText}>Không có địa chỉ giao hàng</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
        
        {/* --- VOUCHER SELECT ROW (hiển thị trên màn chính, giống payment) --- */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Mã khuyến mãi</Text>
        </View>
        <TouchableOpacity
          style={styles.paymentSelectBtn}
          onPress={openVoucherModal}
        >
          <Ionicons name="pricetag-outline" size={20} color="#bbb" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: selectedOrderVoucher || selectedShippingVoucher ? '#FF5722' : '#888', fontWeight: 'bold' }}>
              {(selectedOrderVoucher || selectedShippingVoucher)
                ? [selectedOrderVoucher?.title || selectedOrderVoucher?.voucher_id, selectedShippingVoucher?.title || selectedShippingVoucher?.voucher_id].filter(Boolean).join(' + ')
                : 'Chọn mã khuyến mãi'}
            </Text>
            {/* Hiển thị mô tả và mức giảm cho từng loại nếu có */}
            {selectedOrderVoucher && (
              <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: 'bold' }}>
                {selectedOrderVoucher.voucher_type === 'percent'
                  ? `Giảm ${selectedOrderVoucher.discount_value}%`
                  : `Giảm ${formatVND(selectedOrderVoucher.discount_value)}`}
              </Text>
            )}
            {selectedShippingVoucher && (
              <Text style={{ color: '#2196F3', fontSize: 13, fontWeight: 'bold' }}>
                {selectedShippingVoucher.voucher_type === 'percent'
                  ? `Giảm ${selectedShippingVoucher.discount_value}% phí vận chuyển`
                  : `Giảm ${formatVND(selectedShippingVoucher.discount_value)} phí vận chuyển`}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#888" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        {/* --- PHƯƠNG THỨC THANH TOÁN (GỌN GÀNG, DẠNG MODAL) --- */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>
        </View>
        <TouchableOpacity
          style={styles.paymentSelectBtn}
          onPress={() => setPaymentModalVisible(true)}
        >
          <Ionicons name={selectedPaymentMethod === PAYMENT_METHODS.ZALOPAY ? 'card-outline' : 'cash-outline'} size={20} color="#3255FB" style={{ marginRight: 8 }} />
          <Text style={{ color: '#3255FB', fontWeight: 'bold' }}>
            {selectedPaymentMethod === PAYMENT_METHODS.ZALOPAY ? 'Thanh toán qua ZaloPay' : 'Thanh toán khi nhận hàng (COD)'}
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
              <Text style={styles.bottomSheetTitle}>Chọn mã khuyến mãi</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {/* Mã giảm giá */}
                <Text style={styles.voucherGroupTitle}>Mã giảm giá</Text>
                {vouchers.filter(v => v.discount_type === 'order').length === 0 && (
                  <Text style={styles.noVouchersText}>Không có mã giảm giá khả dụng</Text>
                )}
                {vouchers.filter(v => v.discount_type === 'order').map(v => {
                  const expired = new Date(v.end_date) <= new Date();
                  const minOrderValue = v?.min_order_value || 0;
                  const isInsufficient = subtotal < minOrderValue;
                  const isDisabled = expired || isInsufficient;
                  return (
                    <TouchableOpacity
                      key={v._id}
                      style={[
                        styles.bottomSheetItem,
                        tempOrderVoucher?._id === v._id && styles.bottomSheetItemSelected,
                        isDisabled && styles.bottomSheetItemDisabled
                      ]}
                      disabled={isDisabled}
                      onPress={() => {
                        const newVoucher = tempOrderVoucher?._id === v._id ? null : v;
                        if (newVoucher) {
                          // Validate voucher trước khi cho phép chọn
                          if (validateVoucherAndShowPopup(newVoucher)) {
                            setTempOrderVoucher(newVoucher);
                          }
                        } else {
                          setTempOrderVoucher(null);
                        }
                      }}
                    >
                      <Ionicons name="pricetag-outline" size={28} color="#bbb" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.voucherCode}>{v.title || v.voucher_id}</Text>
                        <Text style={styles.voucherDescription}>{v.description || ''}</Text>
                        <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: 'bold' }}>
                          {v.voucher_type === 'percent'
                            ? `Giảm ${v.discount_value}%`
                            : `Giảm ${formatVND(v.discount_value)}`}
                        </Text>
                        <Text style={styles.voucherExpiry}>HSD: {new Date(v.end_date).toLocaleDateString('vi-VN')}</Text>
                        {isInsufficient && (
                          <Text style={styles.voucherInsufficient}>
                            Cần thêm {(minOrderValue - subtotal).toLocaleString('vi-VN')} VNĐ
                          </Text>
                        )}
                      </View>
                      {tempOrderVoucher?._id === v._id && (
                        <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                      )}
                    </TouchableOpacity>
                  );
                })}
                {/* Mã vận chuyển */}
                <Text style={styles.voucherGroupTitle}>Mã vận chuyển</Text>
                {vouchers.filter(v => v.discount_type === 'shipping').length === 0 && (
                  <Text style={styles.noVouchersText}>Không có mã vận chuyển khả dụng</Text>
                )}
                {vouchers.filter(v => v.discount_type === 'shipping').map(v => {
                  const expired = new Date(v.end_date) <= new Date();
                  return (
                    <TouchableOpacity
                      key={v._id}
                      style={[
                        styles.bottomSheetItem,
                        tempShippingVoucher?._id === v._id && styles.bottomSheetItemSelected,
                        expired && styles.bottomSheetItemDisabled
                      ]}
                      disabled={expired}
                      onPress={() => setTempShippingVoucher(tempShippingVoucher?._id === v._id ? null : v)}
                    >
                      <Ionicons name="car-outline" size={28} color="#bbb" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.voucherCode}>{v.title || v.voucher_id}</Text>
                        <Text style={styles.voucherDescription}>{v.description || ''}</Text>
                        <Text style={{ color: '#2196F3', fontSize: 13, fontWeight: 'bold' }}>
                          {v.voucher_type === 'percent'
                            ? `Giảm ${v.discount_value}% phí vận chuyển`
                            : `Giảm ${formatVND(v.discount_value)} phí vận chuyển`}
                        </Text>
                        <Text style={styles.voucherExpiry}>HSD: {new Date(v.end_date).toLocaleDateString('vi-VN')}</Text>
                      </View>
                      {tempShippingVoucher?._id === v._id && (
                        <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                      )}
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
                  <Text style={styles.bottomSheetBtnText}>Xác nhận</Text>
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
              <Text style={styles.bottomSheetTitle}>Chọn phương thức thanh toán</Text>
              <TouchableOpacity
                style={[
                  styles.bottomSheetItem,
                  selectedPaymentMethod === PAYMENT_METHODS.COD && styles.bottomSheetItemSelected
                ]}
                onPress={() => setSelectedPaymentMethod(PAYMENT_METHODS.COD)}
              >
                <Ionicons name="cash-outline" size={24} color="#3255FB" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentText}>Thanh toán khi nhận hàng (COD)</Text>
                  <Text style={styles.paymentDescription}>Thanh toán bằng tiền mặt khi nhận hàng</Text>
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
                  <Text style={styles.paymentText}>Thanh toán qua ZaloPay</Text>
                  <Text style={styles.paymentDescription}>Thanh toán nhanh chóng và an toàn</Text>
                </View>
                {selectedPaymentMethod === PAYMENT_METHODS.ZALOPAY && (
                  <Ionicons name="checkmark-circle" size={22} color="#3255FB" />
                )}
              </TouchableOpacity>
              <View style={styles.bottomSheetActions}>
                <TouchableOpacity style={styles.bottomSheetBtn} onPress={() => setPaymentModalVisible(false)}>
                  <Text style={styles.bottomSheetBtnText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Tóm tắt đơn hàng</Text>
        </View>
        <View style={styles.summaryRow}><Text>Tạm tính</Text><Text>{formatVND(subtotal)}</Text></View>
        <View style={styles.summaryRow}><Text>Giảm giá</Text><Text style={{ color: '#4CAF50' }}>- {formatVND(discount)}</Text></View>
        <View style={styles.summaryRow}><Text>Phí vận chuyển</Text><Text style={{ color: '#3255FB' }}>{shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.grandTotal}>Tổng cộng</Text><Text style={styles.grandTotal}>{formatVND(total)}</Text></View>
        
      </ScrollView>
      
      <TouchableOpacity style={styles.payButton} onPress={handleConfirm}>
        <Text style={styles.payButtonText}>Xác nhận đặt hàng</Text>
      </TouchableOpacity>

      {/* Voucher Validation Popup */}
      <VoucherValidationPopup
        visible={voucherValidationPopup.visible}
        voucher={voucherValidationPopup.voucher}
        subtotal={voucherValidationPopup.subtotal}
        onClose={closeVoucherValidationPopup}
      />

      {/* Unified Components */}
      <UnifiedCustomComponent
        type="alert"
        mode={alertConfig.mode as any}
        visible={alertVisible}
        title={alertConfig.title}
        description={alertConfig.description}
        buttonText={alertConfig.buttonText}
        onButtonPress={hideAlert}
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
