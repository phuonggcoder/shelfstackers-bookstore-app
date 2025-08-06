import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';
import { useAuth } from '../context/AuthContext';
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';
import api, { getBookById } from '../services/api';
import { Book } from '../types';

const OrderPaymentScreen = () => {
  const { token } = useAuth();
  const { bookId } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert, alertVisible, alertConfig, hideAlert } = useUnifiedComponent();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;
      setLoading(true);
      try {
        const data = await getBookById(bookId as string);
        setBook(data);
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  const handleOrderAndPay = async () => {
    if (!token || !book) return;
    setPaying(true);
    try {
      // TODO: Lấy address_id thực tế từ user, hiện để giả lập
      const address_id = 'default-address-id';
      const order = await api.createOrder(token, { address_id, payment_method: 'COD' });
      await api.createPayment(token, order._id, 'COD', book.price, 'VND', 'Thanh toán khi nhận hàng');
      showAlert('Thành công', 'Đặt hàng và thanh toán thành công!', 'success');
      router.replace('/order-history');
    } catch {
      showAlert('Lỗi', 'Không thể đặt hàng/thanh toán.', 'error');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!book) return <Text>Không tìm thấy sách.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác nhận đơn hàng</Text>
      <Text style={styles.label}>Sách: {book.title}</Text>
      <Text style={styles.label}>Tác giả: {book.author}</Text>
      <Text style={styles.label}>Giá: {book.price}đ</Text>
      <Button title={paying ? 'Đang thanh toán...' : 'Đặt hàng & Thanh toán'} onPress={handleOrderAndPay} disabled={paying} />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 10 },
});

export default OrderPaymentScreen;
