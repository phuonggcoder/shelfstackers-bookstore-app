import axios from 'axios';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://server-shelf-stacker.onrender.com/api/orders/my';

// Define types for order and item
interface OrderItem {
  book: {
    _id: string;
    title: string;
    author: string;
    price: number;
    image_url?: string;
  };
  quantity: number;
}

interface Order {
  _id: string;
  order_code?: string;
  items: OrderItem[];
  status: string;
  expected_delivery?: string;
}

const OrderHistoryScreen = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const handleCancel = async (orderId: string) => {
    try {
      await axios.patch(
        `https://server-shelf-stacker.onrender.com/api/orders/${orderId}/cancel`,
        { cancellation_reason: 'User cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: 'Cancelled' } : o));
    } catch (e) {}
  };

  const filteredOrders = orders.filter((order) => {
    if (tab === 'upcoming') return order.status !== 'Delivered' && order.status !== 'Cancelled';
    return order.status === 'Delivered' || order.status === 'Cancelled';
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Order</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4A3780" style={{ marginTop: 40 }} />
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found.</Text>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {filteredOrders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <Text style={styles.orderId}>Order ID: #{order.order_code || order._id.slice(-8).toUpperCase()}</Text>
              {order.items.map((item) => (
                <View key={item.book._id} style={styles.bookRow}>
                  <Image source={{ uri: item.book.image_url || 'https://via.placeholder.com/60' }} style={styles.bookImage} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.bookAuthor}>By {item.book.author}</Text>
                    <Text style={styles.bookTitle}>{item.book.title}</Text>
                    <Text style={styles.bookPrice}>${item.book.price}</Text>
                    <Text style={styles.bookQty}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.deliveryText}>
                Expected Delivery by {order.expected_delivery ? new Date(order.expected_delivery).toDateString() : 'N/A'}
              </Text>
              <View style={styles.buttonRow}>
                {order.status !== 'Cancelled' && order.status !== 'Delivered' ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(order._id)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.cancelBtn, { backgroundColor: '#eee' }]}> 
                    <Text style={[styles.cancelText, { color: '#aaa' }]}>Cancel</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/order-review?orderId=${order._id}`)}>
                  <Text style={styles.viewText}>View Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F3F3F3', borderRadius: 8, marginBottom: 16 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 16, color: '#888' },
  tabTextActive: { color: '#4A3780', fontWeight: 'bold' },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  orderId: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  bookRow: { flexDirection: 'row', marginBottom: 10 },
  bookImage: { width: 60, height: 60, borderRadius: 8 },
  bookAuthor: { fontSize: 13, color: '#666' },
  bookTitle: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  bookPrice: { color: '#222', fontSize: 14 },
  bookQty: { color: '#888', fontSize: 13 },
  deliveryText: { color: '#888', fontSize: 13, marginTop: 5, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#FFF2F2', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  cancelText: { color: '#F55', fontWeight: 'bold', fontSize: 16 },
  viewBtn: { backgroundColor: '#4A3780', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  viewText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
});

export default OrderHistoryScreen;
