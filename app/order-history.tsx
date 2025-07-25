import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  _id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  items: {
    book: {
      _id: string;
      title: string;
      author: string;
      thumbnail?: string;
      cover_image?: string[];
    };
    quantity: number;
    price: number;
  }[];
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
  const { t } = useTranslation();

  const tabs = [
    { key: 'all', label: t('all') },
    { key: 'pending', label: t('pending') },
    { key: 'confirmed', label: t('confirmed') },
    { key: 'shipping', label: t('shipping') },
    { key: 'delivered', label: t('delivered') },
    { key: 'cancelled', label: t('cancelled') },
    { key: 'completed', label: t('completed') },
  ];

  useEffect(() => {
    loadOrders();
  }, [token]);

  const loadOrders = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getOrders(token);
      // setOrders(response);
      
      // Mock data for now
      setOrders([
        {
          _id: '1',
          orderCode: 'ORD001',
          status: 'pending',
          totalAmount: 23000,
          items: [
            {
              book: {
                _id: 'book1',
                title: 'Sách không xác định',
                author: 'Tác giả không xác định',
              },
              quantity: 1,
              price: 23000,
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);
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
    switch (status) {
      case 'pending': return '#f39c12';
      case 'confirmed': return '#3498db';
      case 'shipping': return '#9b59b6';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#4A90E2';
      case 'completed': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('pending');
      case 'confirmed': return t('confirmed');
      case 'shipping': return t('shipping');
      case 'delivered': return t('delivered');
      case 'cancelled': return t('cancelled');
      case 'completed': return t('completed');
      default: return t('unknown');
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
    : orders.filter(order => order.status === selectedTab);

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    const firstBook = item.items[0]?.book;
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push({
          pathname: '/order-detail',
          params: { orderId: item._id }
        })}
        activeOpacity={0.8}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCode}>{t('order code')}: {item.orderCode}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getBookImage(firstBook) }}
              style={styles.bookImage}
              contentFit="cover"
              transition={300}
            />
          </View>
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {firstBook?.title || 'Sách không xác định'}
            </Text>
            <Text style={styles.bookAuthor}>
              {firstBook?.author || 'Tác giả không xác định'}
            </Text>
            <Text style={styles.itemCount}>
              x{item.items[0]?.quantity || 1}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              {t('total amount', { count: item.items.length })}
            </Text>
            <Text style={styles.totalAmount}>
              {formatPrice(item.totalAmount)}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>{t('detail')}</Text>
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
          <Text style={styles.headerTitle}>{t('my orders')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loading orders')}</Text>
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
        <Text style={styles.headerTitle}>{t('my orders')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        horizontal
        data={tabs}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === item.key && styles.tabActive
            ]}
            onPress={() => setSelectedTab(item.key)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === item.key && styles.tabTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
      />

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>{t('no orders')}</Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'all' 
              ? t('you have no orders')
              : t('no orders status', { status: getStatusText(selectedTab).toLowerCase() })
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.orderList}
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
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    padding: 16,
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
