import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import i18n from 'i18next';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';

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
  const { t } = useTranslation();
  const { token } = useAuth();
  const { orders, loading, refreshing, refreshOrders } = useOrders();
  const [selectedTab, setSelectedTab] = useState('all');

  const tabs = [
    { key: 'all', label: t('all') },
    { key: 'pending', label: t('pending') },
    { key: 'processing', label: t('processing') },
    { key: 'shipped', label: t('shipped') },
    { key: 'delivered', label: t('delivered') },
    { key: 'cancelled', label: t('cancelled') },
  ];

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        refreshOrders();
      }
    }, [token, refreshOrders])
  );

  const onRefresh = async () => {
    refreshOrders();
  };

  const getStatusColor = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'pending': return '#f39c12';
      case 'processing': return '#3498db';
      case 'shipped': return '#9b59b6';
      case 'delivered': return '#27ae60';
      case 'cancelled':
      case 'canceled':
      case 'cancelled_by_user':
      case 'cancelled_by_admin':
        return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'pending': return t('pending');
      case 'processing': return t('processing');
      case 'shipped': return t('shipped');
      case 'delivered': return t('delivered');
      case 'cancelled':
      case 'canceled':
      case 'cancelled_by_user':
      case 'cancelled_by_admin':
        return t('cancelled');
      default: return t('unknown');
    }
  };

  const formatPrice = (price: number) => {
    // Use dynamic locale based on current language
    const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return t('unknownDate');
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
            <Text style={styles.orderCode}>{t('orderNumber')}: {item.order_id || item._id}</Text>
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
                  <Text style={[styles.bookTitle, { maxWidth: 220 }]} numberOfLines={2} ellipsizeMode="tail">{it.book?.title || t('noTitle')}</Text>
                  <Text style={[styles.bookAuthor, { maxWidth: 220 }]} numberOfLines={2} ellipsizeMode="tail">{t('author')}: {it.book?.author || ''}</Text>
                  <Text style={styles.itemCount}>{t('quantity')}: {it.quantity || 1}</Text>
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
              {t('totalAmount')} ({item.items.length} {t('products')}):
            </Text>
            <Text style={styles.totalAmount}>
              {formatPrice(item.totalAmount)}
            </Text>
          </View>
          <View style={styles.orderActions}>
            <TouchableOpacity style={styles.detailButton} onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.order_id || item._id } })}>
              <Text style={styles.detailButtonText}>{t('details')}</Text>
            </TouchableOpacity>
            {/* Review button for completed orders */}
            {item.status.toLowerCase() === 'delivered' && (
              <TouchableOpacity 
                style={styles.reviewButton}
                onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.order_id || item._id } })}
              >
                <Ionicons name="star-outline" size={16} color="#667eea" />
                <Text style={styles.reviewButtonText}>{t('review')}</Text>
              </TouchableOpacity>
            )}
          </View>
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
          <Text style={styles.headerTitle}>{t('myOrders')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loadingOrders')}</Text>
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
        <Text style={styles.headerTitle}>{t('myOrders')}</Text>
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
          <Text style={styles.emptyTitle}>{t('noOrdersYet')}</Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'all' 
              ? t('youHaveNoOrders')
              : t('noOrdersWithStatus', { status: getStatusText(selectedTab).toLowerCase() })
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
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  reviewButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default OrderHistoryScreen;
