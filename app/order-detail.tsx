import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  book: {
    _id: string;
    title: string;
    author: string;
    price: number;
    thumbnail?: string;
    cover_image?: string[];
  };
  quantity: number;
  price: number;
}

interface OrderDetail {
  _id: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  items: OrderItem[];
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: {
    receiverName: string;
    phoneNumber: string;
    addressDetail: string;
    ward: string;
    district: string;
    province: string;
  };
  createdAt: string;
  updatedAt: string;
  orderHistory: {
    status: string;
    timestamp: string;
    description: string;
  }[];
}

const OrderDetailScreen = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadOrderDetail();
  }, [orderId, token]);

  const loadOrderDetail = async () => {
    if (!token || !orderId) return;
    
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getOrderDetail(token, orderId as string);
      // setOrder(response);
      
      // Mock data for now
      setOrder({
        _id: orderId as string,
        orderCode: 'ORD001',
        status: 'pending',
        totalAmount: 23000,
        subtotal: 23000,
        shippingFee: 0,
        items: [
          {
            book: {
              _id: 'book1',
              title: 'Sách không xác định',
              author: 'Tác giả không xác định',
              price: 23000,
            },
            quantity: 1,
            price: 23000,
          }
        ],
        paymentMethod: 'COD',
        paymentStatus: 'pending',
        shippingAddress: {
          receiverName: 'Nguyễn Văn A',
          phoneNumber: '0123456789',
          addressDetail: '123 Đường ABC',
          ward: 'Phường XYZ',
          district: 'Quận 1',
          province: 'TP.HCM',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderHistory: [
          {
            status: 'created',
            timestamp: new Date().toISOString(),
            description: 'Đơn hàng đã được tạo',
          }
        ],
      });
    } catch (error) {
      console.error('Error loading order detail:', error);
      Alert.alert(t('error'), t('cannot load order'));
    } finally {
      setLoading(false);
    }
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
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Chờ lấy hàng';
      case 'shipping': return 'Chờ giao hàng';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã huỷ';
      case 'completed': return 'Hoàn thành';
      default: return 'Không xác định';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'paid': return 'Đã thanh toán';
      case 'failed': return 'Thanh toán thất bại';
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
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('order detail')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loading info')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('order detail')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#4A90E2" />
          <Text style={styles.errorText}>{t('not found')}</Text>
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
        <Text style={styles.headerTitle}>{t('order detail')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.section}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(order.status) }]}>
              <Ionicons name="checkmark" size={24} color="white" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              <Text style={styles.statusDescription}>
                {t('order status processing')}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order info')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('order code')}:</Text>
            <Text style={styles.infoValue}>{order.orderCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('order date')}:</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Purchased Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('purchased products')}</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productImageContainer}>
                <Image
                  source={{ uri: getBookImage(item.book) }}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={300}
                />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.book.title}
                </Text>
                <Text style={styles.productAuthor}>
                  {item.book.author}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.price)} x {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shipping address')}</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color="#667eea" />
            <View style={styles.addressInfo}>
              <Text style={styles.receiverName}>{order.shippingAddress.receiverName}</Text>
              <Text style={styles.phoneNumber}>{order.shippingAddress.phoneNumber}</Text>
              <Text style={styles.addressDetail}>
                {order.shippingAddress.addressDetail}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('payment info')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('method')}:</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('status')}:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(order.paymentStatus) }]}>
              {getPaymentStatusText(order.paymentStatus)}
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order summary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('shipping fee')}</Text>
            <Text style={[styles.summaryValue, { color: '#667eea' }]}>
              {order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Order History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order history')}</Text>
          {order.orderHistory.map((history, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: getStatusColor(history.status) }]}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDescription}>{history.description}</Text>
                <Text style={styles.historyTime}>{formatDate(history.timestamp)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  productAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default OrderDetailScreen; 