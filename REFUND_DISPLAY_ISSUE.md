# Vấn đề hiển thị thông báo hoàn tiền

## Vấn đề hiện tại
Trong hình ảnh, đơn hàng đã bị hủy nhưng:
1. **Trạng thái thanh toán** vẫn hiển thị "Chờ xử lý" thay vì trạng thái hoàn tiền
2. **Thông báo hoàn tiền** không xuất hiện
3. **Server chưa cập nhật** trạng thái thanh toán thành `refunded`

## Nguyên nhân
1. **Server chưa xử lý** - Khi admin hủy đơn hàng, server chưa tự động cập nhật trạng thái thanh toán
2. **Logic hiển thị** - Component chỉ hiển thị khi có trạng thái `refund` trong payment status
3. **Thiếu fallback** - Không có logic dự phòng cho đơn hàng bị hủy

## Giải pháp đã triển khai

### 1. Cập nhật logic hiển thị
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  
  // Hiển thị hoàn tiền khi có trạng thái refund
  return normalizedPayment.includes('refund');
};

// Sau
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  const normalizedOrder = (orderStatus || '').toLowerCase();
  
  // Hiển thị hoàn tiền khi có trạng thái refund HOẶC đơn hàng bị hủy
  return normalizedPayment.includes('refund') || 
         normalizedOrder.includes('cancelled') || 
         normalizedOrder.includes('canceled');
};
```

### 2. Cập nhật component RefundStatusNotification
**File**: `components/RefundStatusNotification.tsx`

**Thay đổi**:
```typescript
// Trước
if (!normalizedPayment.includes('refund')) {
  return null;
}

// Sau
if (!normalizedPayment.includes('refund') && 
    !normalizedOrder.includes('cancelled') && 
    !normalizedOrder.includes('canceled')) {
  return null;
}
```

### 3. Thêm debug info
**File**: `app/order-detail.tsx`

**Thêm**:
```typescript
{/* Debug Info - Remove after testing */}
{__DEV__ && (
  <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 10 }}>
    <Text>Debug: Payment Status = {order.paymentStatus}</Text>
    <Text>Debug: Order Status = {order.status}</Text>
    <Text>Debug: isRealRefund = {isRealRefund(order.paymentStatus, order.status).toString()}</Text>
  </View>
)}
```

## Logic mới

### Hiển thị thông báo hoàn tiền khi:
1. **Có trạng thái thanh toán refund** - `refunded`, `refund_pending`, `refund_processing`, etc.
2. **HOẶC đơn hàng bị hủy** - `cancelled`, `canceled`, `cancelled_by_admin`, etc.

### Các trường hợp hiển thị

#### ✅ Đơn hàng bị hủy + payment status pending
- **Icon**: `close-circle` (màu đỏ)
- **Message**: "Đơn hàng đã được hủy - Tiền sẽ được hoàn"
- **Màu sắc**: `#e74c3c` (đỏ)
- **Mô tả**: "Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc do đơn hàng bị hủy"

#### ✅ Đơn hàng bị hủy + payment status refunded
- **Icon**: `close-circle` (màu đỏ)
- **Message**: "Đơn hàng đã được hủy - Tiền sẽ được hoàn"
- **Màu sắc**: `#e74c3c` (đỏ)
- **Mô tả**: "Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc do đơn hàng bị hủy"

#### ✅ Đơn hàng giao thành công + có refund
- **Icon**: `checkmark-circle` (màu xanh lá)
- **Message**: "Hoàn tiền đã hoàn tất"
- **Màu sắc**: `#27ae60` (xanh lá)
- **Mô tả**: "Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc"

## Testing

### Test case 1: Đơn hàng bị hủy + payment status pending
1. Admin hủy đơn hàng
2. Server chưa cập nhật payment status (vẫn là 'pending')
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Đơn hàng đã được hủy - Tiền sẽ được hoàn"

### Test case 2: Đơn hàng bị hủy + payment status refunded
1. Admin hủy đơn hàng
2. Server cập nhật payment status thành 'refunded'
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Đơn hàng đã được hủy - Tiền sẽ được hoàn"

### Test case 3: Đơn hàng giao thành công + hoàn tiền
1. Admin giao đơn hàng
2. Admin hoàn tiền
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Hoàn tiền đã hoàn tất"

## Debug Info

Khi chạy trong development mode, sẽ hiển thị thông tin debug:
- Payment Status: Trạng thái thanh toán hiện tại
- Order Status: Trạng thái đơn hàng hiện tại
- isRealRefund: Kết quả kiểm tra có hiển thị thông báo không

## Lưu ý quan trọng

1. **Server cần cập nhật** - Server nên tự động cập nhật payment status khi hủy đơn hàng
2. **Fallback logic** - Client có logic dự phòng để hiển thị thông báo ngay cả khi server chưa cập nhật
3. **User Experience** - User luôn biết rằng tiền sẽ được hoàn khi đơn hàng bị hủy
4. **Debug mode** - Thông tin debug giúp kiểm tra trạng thái thực tế

## Tương lai

### Cải thiện có thể thực hiện:
1. **Server-side fix** - Server tự động cập nhật payment status khi hủy đơn hàng
2. **Real-time updates** - WebSocket để cập nhật trạng thái real-time
3. **Admin notification** - Thông báo cho admin khi cần xử lý hoàn tiền
4. **Payment gateway integration** - Tích hợp với cổng thanh toán để tự động hoàn tiền 