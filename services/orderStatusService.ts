
export interface OrderStatusChange {
  orderId: string;
  previousStatus: string;
  currentStatus: string;
  timestamp: string;
}

class OrderStatusService {
  private static instance: OrderStatusService;
  private statusCache: Map<string, string> = new Map();
  private listeners: Array<(change: OrderStatusChange) => void> = [];

  static getInstance(): OrderStatusService {
    if (!OrderStatusService.instance) {
      OrderStatusService.instance = new OrderStatusService();
    }
    return OrderStatusService.instance;
  }

  // Cache trạng thái đơn hàng
  cacheOrderStatus(orderId: string, status: string) {
    this.statusCache.set(orderId, status);
  }

  // Kiểm tra thay đổi trạng thái
  checkStatusChange(orderId: string, currentStatus: string): OrderStatusChange | null {
    const previousStatus = this.statusCache.get(orderId);
    
    if (previousStatus && previousStatus !== currentStatus) {
      const change: OrderStatusChange = {
        orderId,
        previousStatus,
        currentStatus,
        timestamp: new Date().toISOString()
      };
      
      // Cập nhật cache
      this.cacheOrderStatus(orderId, currentStatus);
      
      // Thông báo cho listeners
      this.notifyListeners(change);
      
      return change;
    }
    
    // Cập nhật cache nếu chưa có
    this.cacheOrderStatus(orderId, currentStatus);
    return null;
  }

  // Đăng ký listener
  addListener(listener: (change: OrderStatusChange) => void) {
    this.listeners.push(listener);
  }

  // Hủy đăng ký listener
  removeListener(listener: (change: OrderStatusChange) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Thông báo cho tất cả listeners
  private notifyListeners(change: OrderStatusChange) {
    this.listeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in order status listener:', error);
      }
    });
  }

  // Xóa cache cho một đơn hàng
  clearCache(orderId: string) {
    this.statusCache.delete(orderId);
  }

  // Xóa toàn bộ cache
  clearAllCache() {
    this.statusCache.clear();
  }

  // Lấy trạng thái từ cache
  getCachedStatus(orderId: string): string | undefined {
    return this.statusCache.get(orderId);
  }

  // Kiểm tra xem có thay đổi trạng thái không
  hasStatusChanged(orderId: string, currentStatus: string): boolean {
    const cachedStatus = this.statusCache.get(orderId);
    return cachedStatus !== undefined && cachedStatus !== currentStatus;
  }
}

export default OrderStatusService.getInstance(); 
