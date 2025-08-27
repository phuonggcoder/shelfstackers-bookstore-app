import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrderStatusUpdateAlertProps {
  currentStatus: string;
  previousStatus?: string;
  onRefresh: () => void;
  visible: boolean;
  onDismiss: () => void;
}

const OrderStatusUpdateAlert: React.FC<OrderStatusUpdateAlertProps> = ({
  currentStatus,
  previousStatus,
  onRefresh,
  visible,
  onDismiss
}) => {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (visible && previousStatus && currentStatus !== previousStatus) {
      setShowAlert(true);
    }
  }, [visible, currentStatus, previousStatus]);

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

  const handleRefresh = () => {
    onRefresh();
    setShowAlert(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setShowAlert(false);
    onDismiss();
  };

  if (!showAlert) return null;

  return (
    <View style={styles.container}>
      <View style={styles.alert}>
        <View style={styles.iconContainer}>
          <Ionicons name="refresh-circle" size={24} color="#667eea" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Cập nhật trạng thái đơn hàng</Text>
          <Text style={styles.message}>
            Trạng thái đơn hàng đã được cập nhật từ "{getStatusText(previousStatus || '')}" 
            thành "{getStatusText(currentStatus)}"
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Text style={styles.dismissButtonText}>Đóng</Text>
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
  alert: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  iconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  content: {
    marginBottom: 12,
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
    justifyContent: 'flex-end',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissButtonText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OrderStatusUpdateAlert; 
