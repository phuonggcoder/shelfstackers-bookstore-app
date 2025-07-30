import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewForm from '../components/ReviewForm';
import ThankYouModal from '../components/ThankYouModal';
import { useAuth } from '../context/AuthContext';
import { cancelOrder, getOrderDetail } from '../services/orderService';
import ReviewService from '../services/reviewService';

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
    street?: string;
  };
  createdAt: string;
  updatedAt: string;
  orderHistory: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

const OrderDetailScreen = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [isUpdateReview, setIsUpdateReview] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId, token]);

  const loadOrderDetail = async () => {
    if (!token || !orderId) return;
    try {
      setLoading(true);
      const response = await getOrderDetail(token, orderId as string);
      // Map lại dữ liệu từ BE
      const order = response.order || response;
      // Ưu tiên lấy snapshot địa chỉ giao hàng
      const shippingAddressRaw = order.shipping_address_snapshot || order.address_id || {};
      setOrder({
        _id: order._id,
        orderCode: order.order_id || order._id,
        status: order.order_status || order.status,
        totalAmount: order.total_amount,
        subtotal: order.subtotal || order.total_amount,
        shippingFee: order.ship_amount || order.shipping_fee || 0,
        items: (order.order_items || []).map((oi: any) => ({
          book: oi.book_id,
          quantity: oi.quantity,
          price: oi.price
        })),
        paymentMethod: order.payment_method || 'COD',
        paymentStatus: order.payment_status || 'pending',
        shippingAddress: {
          receiverName: shippingAddressRaw.full_name || shippingAddressRaw.receiver_name || '',
          phoneNumber: shippingAddressRaw.phone || shippingAddressRaw.phone_number || '',
          addressDetail: shippingAddressRaw.address || shippingAddressRaw.address_detail || '',
          street: shippingAddressRaw.street || '',
          ward: shippingAddressRaw.ward || '',
          district: shippingAddressRaw.district || '',
          province: shippingAddressRaw.province || ''
        },
        createdAt: order.order_date || order.createdAt,
        updatedAt: order.updatedAt,
        orderHistory: order.order_history || [],
      });
    } catch (error) {
      console.error('Error loading order detail:', error);
      Alert.alert(t('error'), t('cannotLoadOrderInfo'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!token || !orderId) return;
    Alert.alert(t('confirm'), t('confirmCancelOrder'), [
      { text: t('no'), style: 'cancel' },
      { text: t('cancelOrder'), style: 'destructive', onPress: async () => {
        setCancelling(true);
        try {
          await cancelOrder(token, orderId as string, t('customerCancelled'));
          Alert.alert(t('success'), t('orderCancelled'));
          loadOrderDetail();
        } catch (e) {
          Alert.alert(t('error'), t('cannotCancelOrder'));
        } finally {
          setCancelling(false);
        }
      }}
    ]);
  };

  const handleReviewProduct = async (product: OrderItem) => {
    if (!token) return;
    
    setSelectedProduct(product);
    setReviewLoading(true);
    
    try {
      // Check if user already reviewed this product from this order
      const userReview = await ReviewService.checkUserReview(
        product.book._id, 
        orderId as string, 
        token
      );
      setExistingReview(userReview);
    } catch (error) {
      console.error('Error checking existing review:', error);
      setExistingReview(null);
    } finally {
      setReviewLoading(false);
      setShowReviewForm(true);
    }
  };

  const handleReviewSubmit = async (reviewData: any) => {
    if (!token || !selectedProduct || !orderId) return;
    
    try {
      if (existingReview) {
        await ReviewService.updateReview(
          existingReview._id,
          reviewData,
          token
        );
        setIsUpdateReview(true);
      } else {
        await ReviewService.createReview({
          productId: selectedProduct.book._id,
          orderId: orderId as string,
          rating: reviewData.rating,
          comment: reviewData.comment,
          media: reviewData.mediaUrls || []
        }, token);
        setIsUpdateReview(false);
      }
      setShowReviewForm(false);
      setShowThankYouModal(true);
      setSelectedProduct(null);
      setExistingReview(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  };

  const handleGoHome = () => {
    setShowThankYouModal(false);
    router.push('/');
  };

  const handleCloseThankYouModal = () => {
    setShowThankYouModal(false);
  };

  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setSelectedProduct(null);
    setExistingReview(null);
  };

  const handleReviewOrder = () => {
    if (!order) return;
    
    // Navigate to product-reviews with order information
    router.push({
      pathname: '/product-reviews',
      params: {
        orderId: order._id,
        orderCode: order.orderCode,
        items: JSON.stringify(order.items)
      }
    });
  };

  const isOrderCompleted = () => {
    return order?.status?.toLowerCase() === 'delivered';
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
      case 'pending': return t('pending');
      case 'processing': return t('processing');
      case 'shipped': return t('shipped');
      case 'delivered': return t('delivered');
      case 'cancelled': return t('cancelled');
      default: return t('unknown');
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('paymentPending');
      case 'paid': return t('paymentPaid');
      case 'failed': return t('paymentFailed');
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
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loadingInfo')}</Text>
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
          <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#4A90E2" />
          <Text style={styles.errorText}>{t('orderNotFound')}</Text>
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
        <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
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
                {isOrderCompleted() 
                  ? t('orderDeliveredSuccessfully')
                  : t('orderProcessing')
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orderInformation')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('orderNumber')}:</Text>
            <Text style={styles.infoValue}>{order.orderCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('orderDate')}:</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Purchased Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('purchasedProducts')}</Text>
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
                {/* Review button for completed orders */}
                {isOrderCompleted() && (
                  <TouchableOpacity
                    style={styles.productReviewButton}
                    onPress={() => handleReviewProduct(item)}
                    disabled={reviewLoading}
                  >
                    <Ionicons name="star-outline" size={16} color="#667eea" />
                    <Text style={styles.productReviewButtonText}>
                      {reviewLoading ? 'Đang tải...' : 'Đánh giá sản phẩm'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shippingAddress')}</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color="#667eea" />
            <View style={styles.addressInfo}>
              {/* Tên người nhận và số điện thoại */}
              {(order.shippingAddress.receiverName || order.shippingAddress.phoneNumber) && (
                <Text style={styles.receiverName}>
                  {order.shippingAddress.receiverName}
                  {order.shippingAddress.phoneNumber ? ` - ${order.shippingAddress.phoneNumber}` : ''}
                </Text>
              )}
              {/* Địa chỉ đầy đủ */}
              <Text style={styles.addressDetail}>
                {[
                  order.shippingAddress.addressDetail,
                  order.shippingAddress.street,
                  order.shippingAddress.ward,
                  order.shippingAddress.district,
                  order.shippingAddress.province
                ].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('paymentInformation')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('paymentMethod')}:</Text>
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
          <Text style={styles.sectionTitle}>{t('orderSummary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('shippingFee')}</Text>
            <Text style={[styles.summaryValue, { color: '#667eea' }]}>
              {order.shippingFee === 0 ? t('free') : formatPrice(order.shippingFee)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Order History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orderHistory')}</Text>
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

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {isOrderCompleted() ? (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReviewOrder}
          >
            <Ionicons name="star-outline" size={20} color="white" />
            <Text style={styles.reviewButtonText}>{t('reviewOrder')}</Text>
          </TouchableOpacity>
        ) : order.status !== 'cancelled' && order.status !== 'delivered' ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            <Text style={styles.cancelButtonText}>
              {cancelling ? t('cancelling') : t('cancelOrder')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Review Form Modal */}
      {showReviewForm && selectedProduct && (
        <ReviewForm
          productId={selectedProduct.book._id}
          orderId={orderId as string}
          existingReview={existingReview}
          onSubmit={handleReviewSubmit}
          onCancel={handleReviewCancel}
          isLoading={false}
        />
      )}

      {/* Thank You Modal */}
      <ThankYouModal
        visible={showThankYouModal}
        onClose={handleCloseThankYouModal}
        onGoHome={handleGoHome}
        isUpdate={isUpdateReview}
      />
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
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  productAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#2c3e50',
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
  // Review button styles for product items
  productReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  productReviewButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Action buttons container and styles
  actionButtonsContainer: {
    padding: 16,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#bbb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrderDetailScreen; 