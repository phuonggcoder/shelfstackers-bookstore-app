import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getOrderDetail } from '../services/orderService';

export default function OrderSuccessRoute() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId && token) {
      getOrderData();
    }
  }, [orderId, token]);

  const getOrderData = async () => {
    try {
      setLoading(true);
      const response = await getOrderDetail(token as string, orderId as string);
      if (response?.success) {
        setOrderData(response.order);
        console.log('Order success data:', response.order);
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    // Navigate to order detail or order history
    router.replace('/order-history');
  };

  const handleContinueShopping = () => {
    // Navigate back to home
    router.replace('/');
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'PAYOS':
        return 'PayOS (VietQR/Webcheckout)';
      case 'COD':
        return 'Thanh toán khi nhận hàng';
      case 'ZALOPAY':
        return 'ZaloPay';
      default:
        return method;
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đã gửi hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'processing':
        return '#17a2b8';
      case 'shipped':
        return '#007bff';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Thanh toán thành công!</Text>
        <Text style={styles.subtitle}>
          Đơn hàng của bạn đã được xử lý thành công
        </Text>

        {/* Order Info */}
        {orderData && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Mã đơn hàng:</Text>
            <Text style={styles.orderNumber}>{orderData.order_id}</Text>
            
            <Text style={styles.orderLabel}>Tổng tiền:</Text>
            <Text style={styles.orderAmount}>
              {orderData.total_amount?.toLocaleString()} VND
            </Text>
            
            <Text style={styles.orderLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.paymentMethod}>
              {formatPaymentMethod(orderData.payment_method)}
            </Text>
            
            <Text style={styles.orderLabel}>Trạng thái:</Text>
            <Text style={[styles.orderStatus, { color: getOrderStatusColor(orderData.status) }]}>
              {getOrderStatusText(orderData.status)}
            </Text>

            {/* Product Details */}
            {orderData.order_items && orderData.order_items.length > 0 && (
              <View style={styles.productSection}>
                <Text style={styles.sectionTitle}>Sản phẩm đã mua:</Text>
                {orderData.order_items.map((item: any, index: number) => (
                  <View key={index} style={styles.productItem}>
                    <Text style={styles.productName}>
                      {item.book_id?.title || 'Sản phẩm không xác định'}
                    </Text>
                    <Text style={styles.productDetails}>
                      Số lượng: {item.quantity} x {item.price?.toLocaleString()} VND
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Shipping Address */}
            {orderData.shipping_address && (
              <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>Địa chỉ giao hàng:</Text>
                <Text style={styles.addressText}>
                  {orderData.shipping_address.fullName}
                </Text>
                <Text style={styles.addressText}>
                  {orderData.shipping_address.fullAddress}
                </Text>
                <Text style={styles.addressText}>
                  SĐT: {orderData.shipping_address.phone}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrder}>
            <Text style={styles.primaryButtonText}>Xem đơn hàng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleContinueShopping}>
            <Text style={styles.secondaryButtonText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  orderInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 16,
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  paymentMethod: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
  },
  productSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  productItem: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addressSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addressText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
