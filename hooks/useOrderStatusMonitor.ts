import { useCallback, useEffect, useState } from 'react';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import OrderStatusService, { OrderStatusChange } from '../services/orderStatusService';

export const useOrderStatusMonitor = (orderId?: string) => {
  const [statusChange, setStatusChange] = useState<OrderStatusChange | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const { showAlert: showUnifiedAlert } = useUnifiedModal();

  const handleStatusChange = useCallback((change: OrderStatusChange) => {
    // Chỉ xử lý nếu là đơn hàng hiện tại hoặc không có orderId cụ thể
    if (!orderId || change.orderId === orderId) {
      setStatusChange(change);
      setShowAlert(true);
      
      // Hiển thị thông báo
      showUnifiedAlert(
        'Cập nhật trạng thái đơn hàng',
        `Trạng thái đơn hàng đã được cập nhật từ "${getStatusText(change.previousStatus)}" thành "${getStatusText(change.currentStatus)}"`,
        'Làm mới',
        'Đóng',
        'info',
        () => {
          setShowAlert(false);
          // Trigger refresh callback nếu có
        }
      );
    }
  }, [orderId, showUnifiedAlert]);

  useEffect(() => {
    // Đăng ký listener
    OrderStatusService.addListener(handleStatusChange);

    // Cleanup khi unmount
    return () => {
      OrderStatusService.removeListener(handleStatusChange);
    };
  }, [handleStatusChange]);

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

  const dismissAlert = useCallback(() => {
    setShowAlert(false);
    setStatusChange(null);
  }, []);

  return {
    statusChange,
    showAlert,
    dismissAlert,
    getStatusText
  };
}; 