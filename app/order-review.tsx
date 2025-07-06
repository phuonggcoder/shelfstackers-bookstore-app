import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddressSelector from '../components/AddressSelector';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import { useAuth } from '../context/AuthContext';
import { getAddresses } from '../services/addressService';
import { addToCart, getBookById, getCart } from '../services/api';
import { createOrder } from '../services/orderService';
import { PAYMENT_METHODS, PaymentMethod } from '../services/paymentService';
import { getAvailableVouchers, validateVoucher } from '../services/voucherService';
import { formatVND, getBookImageUrl } from '../utils/format';

export default function OrderReviewScreen() {
  const { token } = useAuth();
  const { bookId, ids } = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]); // For multi-item checkout
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(PAYMENT_METHODS.COD);
  const [shipping] = useState<'free' | 'fast'>('free');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any|null>(null);
  const router = useRouter();

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!token) return;
      try {
        const addresses = await getAddresses(token);
        setAddresses(addresses);
        console.log('OrderReview addresses:', addresses);
        
        // Check if there's a selected address from address list
        const selectedAddressStr = await AsyncStorage.getItem('selected_address');
        if (selectedAddressStr) {
          const selectedAddress = JSON.parse(selectedAddressStr);
          setAddress(selectedAddress);
          // Clear the stored address
          await AsyncStorage.removeItem('selected_address');
        } else {
          // Set default address if no selected address
          const defaultAddress = addresses.find((addr: any) => addr.is_default);
          if (defaultAddress) {
            setAddress(defaultAddress);
          }
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
      try {
        if (ids) {
          // Multi-item checkout from cart - only load selected items
          if (!token) {
            console.error('No token available for cart fetch');
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
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bookId, ids, token]);

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
  const subtotal = ids 
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
    if (ids) {
      // Store selected cart items for when user returns to cart
      try {
        const idsString = Array.isArray(ids) ? ids.join(',') : ids;
        const selectedItems = idsString.split(',').filter((id: string) => id.trim() !== '');
        await AsyncStorage.setItem('selected_cart_items', JSON.stringify(selectedItems));
      } catch (error) {
        console.error('Error storing selected items:', error);
      }
      router.replace('/cart');
      return;
    }
    if (!book) return;
    try {
      await addToCart(token, book._id, 1);
      router.replace('/cart');
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleAddressSelect = () => {
    // Navigate to address list screen
    router.push('/address-list?from=order-review');
  };

  const handleAddNewAddress = () => {
    setShowAddressModal(false);
    router.push('/add-address');
  };

  const handleConfirm = async () => {
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
      return;
    }

    if (!address) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng.');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán.');
      return;
    }

    // Check if we have items to order (either cart items or single book)
    if ((!cartItems || cartItems.length === 0) && !book) {
      Alert.alert('Lỗi', 'Không có sản phẩm để đặt hàng. Vui lòng thêm sản phẩm vào giỏ hàng.');
      return;
    }

    // For cart items, check if they have valid data
    if (ids && cartItems) {
      const invalidItems = cartItems.filter(item => !item.book || !item.book._id);
      if (invalidItems.length > 0) {
        Alert.alert('Lỗi', 'Một số sản phẩm trong giỏ hàng không hợp lệ. Vui lòng thử lại.');
        return;
      }
    }

    try {
      console.log('Creating order with:', {
        address_id: address._id,
        payment_method: selectedPaymentMethod,
        voucher_code: selectedVoucher?.voucher_id,
        subtotal: subtotal,
        cart_items_count: cartItems.length
      });

      // Validate voucher if selected
      if (selectedVoucher) {
        try {
          console.log('Validating voucher:', selectedVoucher.voucher_id, 'with subtotal:', subtotal);
          const voucherValidation = await validateVoucher(token, selectedVoucher.voucher_id, subtotal);
          console.log('Voucher validation result:', voucherValidation);
          
          if (!voucherValidation.valid) {
            Alert.alert('Lỗi voucher', voucherValidation.msg || 'Voucher không hợp lệ hoặc đã hết hạn.');
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
          
          Alert.alert('Lỗi voucher', voucherErrorMsg);
          return;
        }
      }

      // Create order using the correct API endpoint
      const orderData = {
        address_id: address._id,
        payment_method: selectedPaymentMethod,
        ...(selectedVoucher && { voucher_code: selectedVoucher.voucher_id })
      };

      // Add book_id for single book purchase (buy now)
      if (!ids && book) {
        orderData.book_id = book._id;
        orderData.quantity = 1;
      }

      console.log('Order data being sent:', orderData);
      const order = await createOrder(token, orderData);
      console.log('Order created successfully:', order);

      Alert.alert(
        'Đặt hàng thành công!', 
        'Đơn hàng của bạn đã được tạo thành công.',
        [
          {
            text: 'Xem đơn hàng',
            onPress: () => router.push('/order-history')
          },
          {
            text: 'Về trang chủ',
            onPress: () => router.replace('/')
          }
        ]
      );
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
      
      Alert.alert('Lỗi', errorMessage);
    }
  };

  // Helper function to validate image URL
  const getValidImageUrl = (url: string) => {
    if (!url || url.trim() === '') return 'https://i.imgur.com/gTzT0hA.jpeg';
    return url;
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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (ids && cartItems.length === 0) return <Text>Không tìm thấy sản phẩm hoặc dữ liệu lỗi.</Text>;
  if (!ids && (!book || typeof book.price !== 'number')) return <Text>Không tìm thấy sản phẩm hoặc dữ liệu lỗi.</Text>;

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
        
        {ids ? (
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
          <TouchableOpacity onPress={handleAddressSelect}>
            <Text style={styles.edit}>
              {addresses.length === 0 ? 'Thêm địa chỉ' : 'Chỉnh sửa'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {address ? (
          <View style={styles.addressContainer}>
            <Text style={styles.addressName}>{address.receiver_name}</Text>
            <Text style={styles.addressPhone}>{address.phone_number}</Text>
            <Text style={styles.addressText}>{formatAddressText(address)}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.addAddressButton} onPress={handleAddressSelect}>
            <Ionicons name="add-circle-outline" size={24} color="#3255FB" />
            <Text style={styles.addAddressText}>Thêm địa chỉ giao hàng</Text>
          </TouchableOpacity>
        )}
        
        {/* Payment Method Selector */}
        <PaymentMethodSelector
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={setSelectedPaymentMethod}
        />
        
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Tóm tắt đơn hàng</Text>
        </View>
        <View style={styles.summaryRow}><Text>Tạm tính</Text><Text>{formatVND(subtotal)}</Text></View>
        <View style={styles.summaryRow}><Text>Giảm giá</Text><Text style={{ color: '#4CAF50' }}>- {formatVND(discount)}</Text></View>
        <View style={styles.summaryRow}><Text>Phí vận chuyển</Text><Text style={{ color: '#3255FB' }}>{shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.grandTotal}>Tổng cộng</Text><Text style={styles.grandTotal}>{formatVND(total)}</Text></View>
        
        {/* Voucher Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Chọn voucher</Text>
        </View>
        <View style={styles.voucherContainer}>
          {vouchers && vouchers.length > 0 ? vouchers.map(v => {
            const now = new Date();
            const expired = new Date(v.end_date) <= now;
            return (
              <TouchableOpacity
                key={v._id}
                style={[
                  styles.voucherItem,
                  selectedVoucher?._id === v._id && styles.voucherItemSelected,
                  expired && styles.voucherItemExpired
                ]}
                disabled={expired}
                onPress={() => setSelectedVoucher(v)}
              >
                <Text style={[styles.voucherTitle, expired && styles.voucherTitleExpired]}>Voucher</Text>
                <Text style={styles.voucherCode}>{v.title || v.voucher_id}</Text>
                <Text style={styles.voucherDescription}>
                  {v.description || `${v.discount_value}${v.voucher_type === 'percent' ? '%' : 'đ'} off`}
                </Text>
                <Text style={styles.voucherExpiry}>
                  HSD: {new Date(v.end_date).toLocaleDateString('vi-VN')}
                </Text>
                {selectedVoucher?._id === v._id && (
                  <Ionicons name="checkmark-circle" size={18} color="#3255FB" style={styles.voucherCheck} />
                )}
              </TouchableOpacity>
            );
          }) : (
            <Text style={styles.noVouchersText}>Không có voucher khả dụng</Text>
          )}
        </View>
      </ScrollView>
      
      <TouchableOpacity style={styles.payButton} onPress={handleConfirm}>
        <Text style={styles.payButtonText}>Xác nhận đặt hàng</Text>
      </TouchableOpacity>

      <AddressSelector
        visible={showAddressModal}
        addresses={addresses}
        selectedAddress={address}
        onSelectAddress={(selectedAddr) => {
          setAddress(selectedAddr);
          setShowAddressModal(false);
        }}
        onAddNewAddress={handleAddNewAddress}
        onClose={() => setShowAddressModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  addressContainer: { padding: 10 },
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
  noVouchersText: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 20 }
});
