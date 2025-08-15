# Khắc phục vấn đề trạng thái đơn hàng

## Vấn đề
Đơn hàng đã được hủy nhưng vẫn hiển thị trạng thái "Chờ xử lý" thay vì "Đã huỷ".

## Nguyên nhân
1. **Thiếu hỗ trợ trạng thái hủy** - Code chỉ hỗ trợ `'cancelled'` nhưng server có thể trả về `'canceled'`, `'cancelled_by_user'`, `'cancelled_by_admin'`
2. **Cache dữ liệu** - Ứng dụng cache dữ liệu cũ
3. **Chưa refresh** - Dữ liệu chưa được cập nhật từ server

## Giải pháp đã triển khai

### 1. Cập nhật hỗ trợ trạng thái hủy
**File**: `app/order-detail.tsx`, `app/order-history.tsx`

**Thay đổi**:
```typescript
// Trước
case 'cancelled': return 'Đã huỷ';

// Sau
case 'cancelled':
case 'canceled':
case 'cancelled_by_user':
case 'cancelled_by_admin':
  return 'Đã huỷ';
```

### 2. Cập nhật màu sắc cho trạng thái hủy
**File**: `app/order-detail.tsx`, `app/order-history.tsx`

**Thay đổi**:
```typescript
// Trước
case 'cancelled': return '#4A90E2';

// Sau
case 'cancelled':
case 'canceled':
case 'cancelled_by_user':
case 'cancelled_by_admin':
  return '#e74c3c'; // Màu đỏ cho trạng thái hủy
```

### 3. Thêm nút refresh
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
  <TouchableOpacity onPress={refreshOrderDetail} disabled={loading}>
    <Ionicons name="refresh" size={24} color="#2c3e50" />
  </TouchableOpacity>
</View>
```

### 4. Cập nhật mô tả trạng thái
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
{order.status.toLowerCase().includes('cancelled') || order.status.toLowerCase().includes('canceled')
  ? 'Đơn hàng đã được hủy. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.'
  : 'Đơn hàng của bạn đang được xử lý'
}
```

### 5. Tạo component thông báo
**File**: `components/OrderStatusNotification.tsx`

**Tính năng**:
- Hiển thị thông báo khi trạng thái thay đổi
- Tự động ẩn sau 5 giây
- Nút refresh để cập nhật dữ liệu
- Hỗ trợ nhiều loại trạng thái hủy

## Cách sử dụng

### 1. Refresh thủ công
- Nhấn nút refresh (🔄) ở góc phải header
- Hoặc kéo xuống để refresh trang đơn hàng

### 2. Tự động refresh
- Khi quay lại trang đơn hàng, dữ liệu sẽ tự động refresh
- Sử dụng `useFocusEffect` để đảm bảo dữ liệu luôn mới nhất

### 3. Thông báo thay đổi
- Khi trạng thái đơn hàng thay đổi, sẽ hiển thị thông báo
- Thông báo tự động ẩn sau 5 giây
- Có thể nhấn "Làm mới" để cập nhật dữ liệu

## Các trạng thái hỗ trợ

### Trạng thái đơn hàng
- `pending` → "Chờ xác nhận"
- `processing` → "Đang xử lý"
- `shipped` → "Đang giao hàng"
- `delivered` → "Đã giao"
- `cancelled` → "Đã huỷ"
- `canceled` → "Đã huỷ"
- `cancelled_by_user` → "Đã huỷ"
- `cancelled_by_admin` → "Đã huỷ"

### Trạng thái thanh toán
- `pending` → "Chờ xử lý"
- `paid` → "Đã thanh toán"
- `failed` → "Thanh toán thất bại"

## Testing

### Test case 1: Đơn hàng bị hủy
1. Admin hủy đơn hàng
2. User quay lại trang đơn hàng
3. **Kết quả mong đợi**: Hiển thị "Đã huỷ" với màu đỏ

### Test case 2: Refresh thủ công
1. User nhấn nút refresh
2. **Kết quả mong đợi**: Dữ liệu được cập nhật từ server

### Test case 3: Thông báo thay đổi
1. User đang xem đơn hàng
2. Admin thay đổi trạng thái
3. **Kết quả mong đợi**: Hiển thị thông báo thay đổi trạng thái

## Lưu ý quan trọng

1. **Server response**: Đảm bảo server trả về đúng trạng thái mới nhất
2. **Network**: Kiểm tra kết nối mạng khi refresh
3. **Cache**: Dữ liệu được cache để tối ưu hiệu suất
4. **User Experience**: Thông báo không quá spam, cho phép tắt

## Tương lai

### Cải thiện có thể thực hiện:
1. **WebSocket**: Kết nối real-time để nhận thông báo thay đổi trạng thái
2. **Push Notification**: Gửi push notification khi trạng thái thay đổi
3. **Background Sync**: Đồng bộ dữ liệu khi app ở background
4. **Offline Support**: Cache dữ liệu để sử dụng offline 