import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../services/orderService';

interface OrderItem {
  _id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  items: Array<{
    book: {
      _id: string;
      title: string;
      author: string;
      thumbnail?: string;
      cover_image?: string[];
    };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

const OrderHistoryScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipped', label: 'Đang giao hàng' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã huỷ' },
  ];

  useEffect(() => {
    loadOrders();
  }, [token]);

  const loadOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getMyOrders(token);
      setOrders((response.orders || []).map((order: any) => ({
        _id: order._id,
        order_id: order.order_id, // Lưu cả hai trường
        orderCode: order.order_id || order._id,
        status: order.order_status || order.status,
        totalAmount: order.total_amount,
        // Map lại items đúng chuẩn: [{book, quantity, price}]
        items: (order.order_items || []).map((oi: any) => ({
          book: oi.book_id, // BE trả về book_id là object
          quantity: oi.quantity,
          price: oi.price
        })),
        address: order.address_id, // BE trả về address_id là object
        createdAt: order.order_date || order.createdAt,
        updatedAt: order.updatedAt,
      })));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'pending': return '#f39c12';
      case 'processing': return '#3498db';
      case 'shipped': return '#9b59b6';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#4A90E2';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'pending': return 'Chờ xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã huỷ';
      default: return 'Không xác định';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'Ngày không xác định';
    }
  };

  const getBookImage = (book: any) => {
    if (!book) return 'https://i.imgur.com/gTzT0hA.jpeg';
    
    // Try thumbnail first
    if (book.thumbnail && book.thumbnail.trim() !== '') {
      return book.thumbnail;
    }
    
    // Try cover_image array
    if (book.cover_image && Array.isArray(book.cover_image) && book.cover_image.length > 0) {
      const firstImage = book.cover_image[0];
      if (firstImage && firstImage.trim() !== '') {
        return firstImage;
      }
    }
    
    // Try image field
    if (book.image && book.image.trim() !== '') {
      return book.image;
    }
    
    // Try image_url field
    if (book.image_url && book.image_url.trim() !== '') {
      return book.image_url;
    }
    
    // Fallback to placeholder
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  };

  const filteredOrders = selectedTab === 'all' 
    ? orders 
    : orders.filter(order => (order.status || '').toLowerCase() === selectedTab);

  const renderOrderItem = ({ item }: { item: any }) => {
    // Lấy thông tin địa chỉ nếu có
    const address = item.address || {};
    const receiverName = address.full_name || address.receiver_name || '';
    const phoneNumber = address.phone || address.phone_number || '';
    const addressDetail = address.address || address.address_detail || '';
    const street = address.street || '';
    const ward = address.ward || '';
    const district = address.district || '';
    const province = address.province || '';
    const fullAddress = [addressDetail, street, ward, district].filter(Boolean).join(', '); // chỉ đến phường/xã
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push({
          pathname: '/order-detail',
          params: { orderId: item.order_id || item._id }
        })}
        activeOpacity={0.8}
      >
        {/* Mã đơn lên đầu */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCode}>Mã đơn: {item.order_id || item._id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        {/* Danh sách sách trong đơn */}
        {item.items && item.items.length > 0 && (
          <View style={{ marginBottom: 8, alignItems: 'flex-start', width: '100%' }}>
            {item.items.map((it: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 6,
                  alignSelf: 'stretch',
                  width: '100%',
                }}
              >
                <Image
                  source={{ uri: getBookImage(it.book) }}
                  style={{ width: 48, height: 64, borderRadius: 6, marginRight: 10 }}
                  contentFit="cover"
                  transition={200}
                />
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={[styles.bookTitle, { maxWidth: 220 }]} numberOfLines={2} ellipsizeMode="tail">{it.book?.title || 'Không có tên'}</Text>
                  <Text style={[styles.bookAuthor, { maxWidth: 220 }]} numberOfLines={2} ellipsizeMode="tail">Tác giả: {it.book?.author || ''}</Text>
                  <Text style={styles.itemCount}>Số lượng: {it.quantity || 1}</Text>
                  <Text style={styles.totalAmount}>{formatPrice(it.price)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {/* Thông tin đơn hàng */}
        <View style={styles.orderFooter}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              Tổng số tiền ({item.items.length} sản phẩm):
            </Text>
            <Text style={styles.totalAmount}>
              {formatPrice(item.totalAmount)}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailButton} onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.order_id || item._id } })}>
            <Text style={styles.detailButtonText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab bar độc lập */}
      <OrderTabBar
        tabs={tabs}
        selectedTab={selectedTab}
        onTabPress={setSelectedTab}
      />

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'all' 
              ? 'Bạn chưa có đơn hàng nào'
              : `Chưa có đơn hàng ${getStatusText(selectedTab).toLowerCase()}`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            ...styles.orderList,
            paddingTop: 0,
            marginTop: 0,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea']}
              tintColor="#667eea"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// Component tab bar độc lập
const OrderTabBar = ({ tabs, selectedTab, onTabPress }: {
  tabs: { key: string, label: string }[],
  selectedTab: string,
  onTabPress: (key: string) => void
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.tabContainer}
  >
    {tabs.map((item) => (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.tab,
          selectedTab === item.key && styles.tabActive
        ]}
        onPress={() => onTabPress(item.key)}
      >
        <Text style={[
          styles.tabText,
          selectedTab === item.key && styles.tabTextActive
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4, // Giảm padding để tab bar gọn lại
  },
  tab: {
    height: 36, // Giảm chiều cao cho tab
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  orderList: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingTop: 0, // Đảm bảo không có padding top
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'flex-start',
    // borderWidth: 1, borderColor: 'blue', // debug nếu cần
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  orderContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  detailButton: {
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 80,
  },
  detailButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OrderHistoryScreen;
