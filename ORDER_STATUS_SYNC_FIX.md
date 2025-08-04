# Khắc phục vấn đề đồng bộ trạng thái đơn hàng

## Vấn đề
Khi admin cập nhật trạng thái đơn hàng từ "Chờ xác nhận" thành "Đã giao", ứng dụng mobile vẫn hiển thị trạng thái cũ "Chờ xác nhận" do cache dữ liệu.

## Nguyên nhân
1. **Cache dữ liệu**: Ứng dụng cache dữ liệu đơn hàng và không refresh khi quay lại trang
2. **Không có cơ chế real-time**: Không có cơ chế theo dõi thay đổi trạng thái từ server
3. **useFocusEffect thiếu**: Không có cơ chế refresh khi màn hình được focus

## Giải pháp đã triển khai

### 1. Thêm useFocusEffect
- **File**: `app/order-history.tsx`, `app/order-detail.tsx`
- **Chức năng**: Refresh dữ liệu khi màn hình được focus
- **Code**:
```typescript
useFocusEffect(
  React.useCallback(() => {
    if (token) {
      refreshOrders();
    }
  }, [token, refreshOrders])
);
```

### 2. Tạo custom hooks
- **File**: `hooks/useOrders.ts`
- **Chức năng**: Quản lý state và cache cho danh sách đơn hàng
- **Tính năng**:
  - Cache dữ liệu đơn hàng
  - Refresh dữ liệu từ server
  - Theo dõi thay đổi trạng thái

### 3. OrderStatusService
- **File**: `services/orderStatusService.ts`
- **Chức năng**: Theo dõi và thông báo thay đổi trạng thái đơn hàng
- **Tính năng**:
  - Cache trạng thái đơn hàng
  - Phát hiện thay đổi trạng thái
  - Thông báo cho listeners

### 4. OrderStatusUpdateAlert Component
- **File**: `components/OrderStatusUpdateAlert.tsx`
- **Chức năng**: Hiển thị thông báo khi trạng thái đơn hàng thay đổi
- **Tính năng**:
  - Hiển thị thông báo đẹp mắt
  - Nút refresh để cập nhật dữ liệu
  - Nút đóng thông báo

### 5. useOrderStatusMonitor Hook
- **File**: `hooks/useOrderStatusMonitor.ts`
- **Chức năng**: Hook để theo dõi thay đổi trạng thái đơn hàng
- **Tính năng**:
  - Đăng ký listener cho thay đổi trạng thái
  - Hiển thị Alert khi có thay đổi
  - Quản lý state của thông báo

## Cách sử dụng

### Trong component OrderHistory
```typescript
import { useOrders } from '../hooks/useOrders';
import { useOrderStatusMonitor } from '../hooks/useOrderStatusMonitor';

const OrderHistoryScreen = () => {
  const { orders, loading, refreshing, refreshOrders } = useOrders();
  const { dismissAlert } = useOrderStatusMonitor();

  // Component sẽ tự động refresh khi focus
  // và hiển thị thông báo khi có thay đổi trạng thái
};
```

### Trong component OrderDetail
```typescript
import { useOrderDetail } from '../hooks/useOrders';
import { useOrderStatusMonitor } from '../hooks/useOrderStatusMonitor';

const OrderDetailScreen = () => {
  const { order, loading, refreshOrderDetail } = useOrderDetail(orderId);
  const { dismissAlert } = useOrderStatusMonitor(orderId);

  // Component sẽ tự động refresh khi focus
  // và hiển thị thông báo khi có thay đổi trạng thái
};
```

## Cải thiện hiệu suất

### 1. Cache thông minh
- Chỉ cache trạng thái đơn hàng, không cache toàn bộ dữ liệu
- Tự động xóa cache khi không cần thiết

### 2. Refresh có điều kiện
- Chỉ refresh khi thực sự cần thiết
- Sử dụng useFocusEffect để tránh refresh không cần thiết

### 3. Thông báo thông minh
- Chỉ hiển thị thông báo khi có thay đổi thực sự
- Cho phép người dùng tắt thông báo

## Testing

### Test case 1: Admin cập nhật trạng thái
1. User mở trang đơn hàng
2. Admin cập nhật trạng thái từ "Chờ xác nhận" thành "Đã giao"
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Trạng thái được cập nhật thành "Đã giao"

### Test case 2: Refresh thủ công
1. User kéo xuống để refresh trang đơn hàng
2. **Kết quả mong đợi**: Dữ liệu được refresh từ server

### Test case 3: Thông báo thay đổi
1. User đang xem chi tiết đơn hàng
2. Admin cập nhật trạng thái
3. **Kết quả mong đợi**: Hiển thị thông báo thay đổi trạng thái

## Lưu ý quan trọng

1. **Backend API**: Đảm bảo API trả về đúng trạng thái mới nhất
2. **Network**: Kiểm tra kết nối mạng khi refresh
3. **Performance**: Cache không quá lớn để tránh memory leak
4. **User Experience**: Thông báo không quá spam, cho phép tắt

## Tương lai

### Cải thiện có thể thực hiện:
1. **WebSocket**: Kết nối real-time để nhận thông báo thay đổi trạng thái
2. **Push Notification**: Gửi push notification khi trạng thái thay đổi
3. **Background Sync**: Đồng bộ dữ liệu khi app ở background
4. **Offline Support**: Cache dữ liệu để sử dụng offline 