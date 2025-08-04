import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrderStatusNotificationProps {
  currentStatus: string;
  previousStatus?: string;
  onRefresh: () => void;
  visible: boolean;
  onDismiss: () => void;
}

const OrderStatusNotification: React.FC<OrderStatusNotificationProps> = ({
  currentStatus,
  previousStatus,
  onRefresh,
  visible,
  onDismiss
}) => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (visible && previousStatus && currentStatus !== previousStatus) {
      setShowNotification(true);
      // Tự động ẩn sau 5 giây
      const timer = setTimeout(() => {
        setShowNotification(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, currentStatus, previousStatus, onDismiss]);

  const getStatusText = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'pending': return 'Chờ xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao';
      case 'cancelled':
      case 'canceled':
      case 'cancelled_by_user':
      case 'cancelled_by_admin':
        return 'Đã huỷ';
      default: return 'Không xác định';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('cancelled') || normalized.includes('canceled')) {
      return 'close-circle';
    }
    if (normalized === 'delivered') {
      return 'checkmark-circle';
    }
    return 'information-circle';
  };

  const getStatusColor = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('cancelled') || normalized.includes('canceled')) {
      return '#e74c3c';
    }
    if (normalized === 'delivered') {
      return '#27ae60';
    }
    return '#3498db';
  };

  const handleRefresh = () => {
    onRefresh();
    setShowNotification(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setShowNotification(false);
    onDismiss();
  };

  if (!showNotification) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.notification, { borderLeftColor: getStatusColor(currentStatus) }]}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getStatusIcon(currentStatus) as any} 
            size={24} 
            color={getStatusColor(currentStatus)} 
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Cập nhật trạng thái đơn hàng</Text>
          <Text style={styles.message}>
            Trạng thái đã thay đổi từ "{getStatusText(previousStatus || '')}" 
            thành "{getStatusText(currentStatus)}"
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Ionicons name="close" size={16} color="#7f8c8d" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
  },
  notification: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
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
  message: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dismissButton: {
    padding: 4,
  },
});

export default OrderStatusNotification; 