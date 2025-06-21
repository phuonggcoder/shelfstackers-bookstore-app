import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addToCart, getBookById } from '../services/api';
import { formatVND } from '../utils/format';

export default function OrderReviewScreen() {
  const { token } = useAuth();
  const { bookId } = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<any>(null);
  const [payment] = useState<any>({ method: 'Master Card', card: '4897 4700 2589 9658' });
  const [shipping] = useState<'free' | 'fast'>('free');
  const [discount] = useState(15000); // giả lập
  const router = useRouter();

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    getBookById(Array.isArray(bookId) ? bookId[0] : bookId)
      .then(data => {
        // Nếu API trả về { book: {...} } thì lấy data.book, nếu trả về {...} thì lấy data
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
        console.log('Lỗi lấy book:', err);
        setBook(null);
      })
      .finally(() => setLoading(false));
    setAddress({
      id: '1',
      text: '2715 Ash Dr. San Jose, South Dakota 83475',
    });
  }, [bookId]);

  const subtotal = book && typeof book.price === 'number' ? book.price : 0;
  const shippingFee = shipping === 'free' ? 0 : 20000;
  const total = subtotal - discount + shippingFee;

  const handleEdit = async () => {
    if (!token || !book) return;
    try {
      await addToCart(token, book._id, 1);
      router.replace('/cart');
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleConfirm = async () => {
    if (!address) return Alert.alert('Vui lòng chọn địa chỉ giao hàng!');
    try {
      // Gọi API tạo order
      Alert.alert('Đặt hàng thành công!', 'Đơn hàng của bạn đã được lưu vào lịch sử.');
      router.replace('/');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đặt hàng.');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!book || typeof book.price !== 'number') return <Text>Không tìm thấy sản phẩm hoặc dữ liệu lỗi.</Text>;

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
      <View style={styles.itemRow}>
        <Image source={{ uri: book.cover_image?.[0] || '' }} style={styles.bookImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bookTitle}>{book.title || 'Không có tên'}</Text>
          <Text style={styles.bookAuthor}>Tác giả: {book.author || ''}</Text>
          <Text style={styles.bookPrice}>{formatVND(book.price || 0)}</Text>
          <Text style={styles.qty}>Số lượng: 1</Text>
        </View>
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Địa chỉ nhận hàng</Text>
        <TouchableOpacity><Text style={styles.edit}>Chỉnh sửa</Text></TouchableOpacity>
      </View>
      <Text style={styles.sectionValue}>{address?.text}</Text>
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
      <TouchableOpacity style={styles.payButton} onPress={handleConfirm}>
        <Text style={styles.payButtonText}>Xác nhận đặt hàng</Text>
      </TouchableOpacity>
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
});
