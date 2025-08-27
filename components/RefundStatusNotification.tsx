import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RefundStatusNotificationProps {
  paymentStatus: string;
  orderStatus?: string;
  refundAmount?: number;
}

const RefundStatusNotification: React.FC<RefundStatusNotificationProps> = ({
  paymentStatus,
  orderStatus,
  refundAmount
}) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  const normalizedOrder = (orderStatus || '').toLowerCase();
  
  // Chỉ hiển thị khi đã thanh toán VÀ (có refund HOẶC đơn hàng bị hủy)
  if (normalizedPayment !== 'paid' || 
      (!normalizedPayment.includes('refund') && 
       !normalizedOrder.includes('cancelled') && 
       !normalizedOrder.includes('canceled'))) {
    return null;
  }

  const getRefundIcon = () => {
    // Nếu đơn hàng bị hủy, hiển thị icon khác
    if (normalizedOrder.includes('cancelled') || normalizedOrder.includes('canceled')) {
      return 'close-circle';
    }
    
    if (normalizedPayment.includes('completed')) {
      return 'checkmark-circle';
    }
    if (normalizedPayment.includes('processing') || normalizedPayment.includes('pending')) {
      return 'time';
    }
    return 'card';
  };

  const getRefundColor = () => {
    // Nếu đơn hàng bị hủy, hiển thị màu khác
    if (normalizedOrder.includes('cancelled') || normalizedOrder.includes('canceled')) {
      return '#e74c3c';
    }
    
    if (normalizedPayment.includes('completed')) {
      return '#27ae60';
    }
    if (normalizedPayment.includes('processing') || normalizedPayment.includes('pending')) {
      return '#f39c12';
    }
    return '#3498db';
  };

  const getRefundMessage = () => {
    // Nếu đơn hàng bị hủy, hiển thị thông báo khác
    if (normalizedOrder.includes('cancelled') || normalizedOrder.includes('canceled')) {
      return 'Đơn hàng đã được hủy - Tiền sẽ được hoàn';
    }
    
    if (normalizedPayment.includes('completed')) {
      return 'Hoàn tiền đã hoàn tất';
    }
    if (normalizedPayment.includes('processing')) {
      return 'Đang xử lý hoàn tiền';
    }
    if (normalizedPayment.includes('pending')) {
      return 'Yêu cầu hoàn tiền đã được gửi';
    }
    return 'Hoàn tiền';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <View style={[styles.container, { borderLeftColor: getRefundColor() }]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getRefundIcon() as any} 
          size={24} 
          color={getRefundColor()} 
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{getRefundMessage()}</Text>
        {refundAmount && (
          <Text style={styles.amount}>
            Số tiền: {formatPrice(refundAmount)}
          </Text>
        )}
        <Text style={styles.description}>
          {normalizedOrder.includes('cancelled') || normalizedOrder.includes('canceled')
            ? 'Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc do đơn hàng bị hủy'
            : 'Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
});

export default RefundStatusNotification; 
