import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddressSelector from '../components/AddressSelector';
import { useAuth } from '../context/AuthContext';
import { getAddresses } from '../services/addressService';
import { addToCart, getBookById, getCart } from '../services/api';
import { formatVND } from '../utils/format';

export default function OrderReviewScreen() {
  const { token } = useAuth();
  const { bookId, ids } = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]); // For multi-item checkout
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [payment] = useState<any>({ method: 'Master Card', card: '4897 4700 2589 9658' });
  const [shipping] = useState<'free' | 'fast'>('free');
  const [discount] = useState(15000); // giả lập
  const router = useRouter();

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!token) return;
      try {
        const addressData = await getAddresses(token);
        setAddresses(addressData.addresses || []);
        // Set default address
        const defaultAddress = addressData.addresses?.find((addr: any) => addr.is_default);
        if (defaultAddress) {
          setAddress(defaultAddress);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };
    loadAddresses();
  }, [token]);

  // Multi-item: fetch cart and filter by ids
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!ids || !token) return;
      setLoading(true);
      try {
        const cart = await getCart(token);
        const idArr = String(ids).split(',');
        const selected = (cart.items || []).filter((item: any) => idArr.includes(item.book_id?._id || item.book_id));
        // Map to unified format for rendering
        setCartItems(selected.map((item: any) => ({
          book: item.book_id,
          quantity: item.quantity,
        })));
      } catch {
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    if (ids) fetchCartItems();
  }, [ids, token]);

  // Single book (buy now) logic giữ nguyên
  useEffect(() => {
    if (!bookId || ids) return; // skip if multi-item
    setLoading(true);
    getBookById(Array.isArray(bookId) ? bookId[0] : bookId)
      .then(data => {
        if (data && typeof data === 'object') {
          if ('book' in data && typeof data.book === 'object') {
            setBook(data.book);
          } else {
            setBook(data);
          }
        } else {
          setBook(null);
        }
      })
      .catch((err) => {
        setBook(null);
      })
      .finally(() => setLoading(false));
  }, [bookId, ids]);

  // Tính tổng tiền cho nhiều sách
  const subtotal = ids
    ? cartItems.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0)
    : (book && typeof book.price === 'number' ? book.price : 0);
  const shippingFee = shipping === 'free' ? 0 : 20000;
  const total = subtotal - discount + shippingFee;

  const handleEdit = async () => {
    if (!token) return;
    if (ids) {
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
    if (addresses.length === 0) {
      // No addresses, go to add new address
      router.push('/add-address');
    } else {
      // Show address selection modal
      setShowAddressModal(true);
    }
  };

  const handleAddNewAddress = () => {
    setShowAddressModal(false);
    router.push('/add-address');
  };

  const handleConfirm = async () => {
    if (!address) return Alert.alert('Vui lòng chọn địa chỉ giao hàng!');
    try {
      // TODO: Gọi API tạo order với nhiều sách nếu ids, hoặc 1 sách nếu bookId
      Alert.alert('Đặt hàng thành công!', 'Đơn hàng của bạn đã được lưu vào lịch sử.');
      router.replace('/');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đặt hàng.');
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
        {/* Multi-item render */}
        {ids ? (
          <View>
            {cartItems.map((item, idx) => (
              <View key={item.book._id || idx} style={styles.itemRow}>
                <Image 
                  source={{ uri: getValidImageUrl(item.book.cover_image?.[0] || '') }} 
                  style={styles.bookImage} 
                  contentFit="cover"
                  transition={200}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{item.book.title || 'Không có tên'}</Text>
                  <Text style={styles.bookAuthor}>Tác giả: {item.book.author || ''}</Text>
                  <Text style={styles.bookPrice}>{formatVND(item.book.price || 0)}</Text>
                  <Text style={styles.qty}>Số lượng: {item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          // Single book (buy now)
          <View style={styles.itemRow}>
            <Image 
              source={{ uri: getValidImageUrl(book.cover_image?.[0] || '') }} 
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
        
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>
          <TouchableOpacity><Text style={styles.edit}>Chỉnh sửa</Text></TouchableOpacity>
        </View>
        <View style={styles.paymentRow}>
          <Image source={require('../assets/images/mastercard_temp.png')} style={styles.paymentIcon} />
          <Text style={styles.paymentText}>{payment.method}</Text>
          <Text style={styles.paymentCard}>{payment.card}</Text>
        </View>
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
});
