import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OrderScreen = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await api.getMyOrders(token);
        setOrders(data.orders || data);
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn hàng của bạn</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <Text style={styles.orderId}>Mã đơn: {item._id}</Text>
            <Text>Trạng thái: {item.status || item.order_status}</Text>
            <Text>Tổng tiền: {item.total ? item.total + 'đ' : ''}</Text>
            <Text>Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>Không có đơn hàng nào.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  orderItem: { padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 15 },
  orderId: { fontWeight: 'bold', marginBottom: 5 },
});

export default OrderScreen;
