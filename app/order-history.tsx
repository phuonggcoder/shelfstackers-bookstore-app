import axios from 'axios';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';

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
  order_id?: string;
  order_code?: string;
  order_date?: string;
  order_status?: string;
  status: string;
  items: OrderItem[];
  order_items?: OrderItem[];
  payment?: {
    payment_method?: string;
    payment_status?: string;
  };
  discount_amount?: number;
  ship_amount?: number;
  final_amount?: number;
  total_amount?: number;
  address_id?: {
    receiver_name?: string;
    phone_number?: string;
    address_detail?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  expected_delivery?: string;
}

// Mapping trạng thái đơn hàng sang tiếng Việt
const ORDER_STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Chờ lấy hàng',
  shipped: 'Chờ giao hàng',
  delivered: 'Đã giao',
  returned: 'Trả hàng',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn thành',
};

const ORDER_TABS = [
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'processing', label: 'Chờ lấy hàng' },
  { key: 'shipped', label: 'Chờ giao hàng' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'returned', label: 'Trả hàng' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'completed', label: 'Hoàn thành' },
];

const OrderHistoryScreen = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders with token:', token ? 'present' : 'missing');
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Orders API response:', res.data);
        
        // Đảm bảo orders luôn là array
        const ordersData = res.data.orders || res.data || [];
        const ordersArray = Array.isArray(ordersData) ? ordersData : [];
        console.log('Processed orders:', ordersArray);
        setOrders(ordersArray);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        console.error('Error details:', err.response?.data || err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchOrders();
    } else {
      console.log('No token available, setting empty orders');
      setOrders([]);
      setLoading(false);
    }
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

  const filteredOrders = (orders || []).filter((order) => {
    const status = (order.order_status || order.status || '').toLowerCase();
    return status === tab;
  });

  // Hàm format địa chỉ
  const formatAddressText = (addr: any) => {
    if (!addr) return '';
    const parts = [];
    if (addr.address_detail) parts.push(addr.address_detail);
    if (addr.ward) parts.push(addr.ward);
    if (addr.district) parts.push(addr.district);
    if (addr.province) parts.push(addr.province);
    return parts.join(', ');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn hàng của tôi</Text>
      <View style={styles.tabContainer}>
        {ORDER_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4A3780" style={{ marginTop: 40 }} />
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào.</Text>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {filteredOrders.map((order) => {
            const firstItem = (order.items || order.order_items || [])[0];
            const statusVi = ORDER_STATUS_VI[(order.order_status || order.status || '').toLowerCase()] || (order.order_status || order.status || 'Không xác định');
            return (
              <View key={order._id} style={styles.orderCard}>
                {/* Trạng thái góc phải trên */}
                <Text style={{position:'absolute',top:10,right:16,color:'#F55',fontWeight:'bold',fontSize:16}}>{statusVi}</Text>
                {/* Ảnh và thông tin sản phẩm đầu tiên */}
                <View style={{flexDirection:'row',alignItems:'center'}}>
                  <Image source={{ uri: firstItem?.book?.image_url || 'https://via.placeholder.com/60' }} style={styles.bookImage} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text numberOfLines={1} style={styles.bookTitle}>{firstItem?.book?.title || 'Sách không xác định'}</Text>
                    <Text style={{color:'#888'}}>{(firstItem?.book && (firstItem.book as any).color) ? (firstItem.book as any).color : ''}</Text>
                    <Text style={styles.bookQty}>x{firstItem?.quantity || 1}</Text>
                  </View>
                </View>
                {/* Giá gốc và giá giảm */}
                <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
                  <Text style={{textDecorationLine:'line-through',color:'#888',marginRight:8}}>{firstItem?.book?.price ? formatVND(firstItem.book.price) : ''}</Text>
                  <Text style={{fontWeight:'bold',fontSize:16}}>{(firstItem?.book && (firstItem.book as any).discount_price) ? formatVND((firstItem.book as any).discount_price) : (firstItem?.book?.price ? formatVND(firstItem.book.price) : '')}</Text>
                </View>
                {/* Tổng số tiền và tổng số sản phẩm */}
                <Text style={{marginTop:8,fontWeight:'bold'}}>Tổng số tiền ({(order.items || order.order_items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)} sản phẩm): {formatVND(order.final_amount || order.total_amount || 0)}</Text>
                {/* Nút chi tiết đơn hàng ở góc phải dưới */}
                <View style={{flexDirection:'row',justifyContent:'flex-end',marginTop:10}}>
                  <TouchableOpacity style={{backgroundColor:'#4A3780',paddingVertical:8,paddingHorizontal:18,borderRadius:20}} onPress={() => router.push(`/order-detail?orderId=${order._id}`)}>
                    <Text style={{color:'#fff',fontWeight:'bold'}}>Chi tiết đơn hàng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
