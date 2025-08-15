# Hiển thị thông báo hoàn tiền khi đơn hàng bị hủy

## Vấn đề
Khi đơn hàng bị hủy, user cần biết rằng tiền sẽ được hoàn về tài khoản của họ.

## Yêu cầu
- Khi đơn hàng bị hủy và có trạng thái thanh toán liên quan đến refund
- Hiển thị thông báo "Đơn hàng đã được hủy - Tiền sẽ được hoàn"
- Thông báo rõ ràng về thời gian hoàn tiền

## Giải pháp đã triển khai

### 1. Cập nhật logic kiểm tra hoàn tiền
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  const normalizedOrder = (orderStatus || '').toLowerCase();
  
  // Chỉ hiển thị hoàn tiền khi không phải đơn hàng bị hủy
  return normalizedPayment.includes('refund') && 
         !normalizedOrder.includes('cancelled') && 
         !normalizedOrder.includes('canceled');
};

// Sau
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  
  // Hiển thị hoàn tiền khi có trạng thái refund
  return normalizedPayment.includes('refund');
};

const isCancelledOrder = (orderStatus: string) => {
  const normalizedOrder = (orderStatus || '').toLowerCase();
  return normalizedOrder.includes('cancelled') || normalizedOrder.includes('canceled');
};
```

### 2. Cập nhật component RefundStatusNotification
**File**: `components/RefundStatusNotification.tsx`

**Thay đổi**:
```typescript
// Cập nhật logic hiển thị
const normalizedPayment = (paymentStatus || '').toLowerCase();
const normalizedOrder = (orderStatus || '').toLowerCase();

// Chỉ hiển thị khi có trạng thái hoàn tiền
if (!normalizedPayment.includes('refund')) {
  return null;
}

// Cập nhật message cho đơn hàng bị hủy
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

// Cập nhật icon cho đơn hàng bị hủy
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

// Cập nhật màu sắc cho đơn hàng bị hủy
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

// Cập nhật mô tả cho đơn hàng bị hủy
<Text style={styles.description}>
  {normalizedOrder.includes('cancelled') || normalizedOrder.includes('canceled')
    ? 'Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc do đơn hàng bị hủy'
    : 'Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc'
  }
</Text>
```

## Logic mới

### Hiển thị thông báo hoàn tiền khi:
1. **Có trạng thái thanh toán refund** - `refunded`, `refund_pending`, `refund_processing`, etc.
2. **Bất kỳ trạng thái đơn hàng nào** - Bao gồm cả đơn hàng bị hủy

### Các trường hợp hiển thị

#### ✅ Đơn hàng bị hủy + có refund
- **Icon**: `close-circle` (màu đỏ)
- **Message**: "Đơn hàng đã được hủy - Tiền sẽ được hoàn"
- **Màu sắc**: `#e74c3c` (đỏ)
- **Mô tả**: "Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc do đơn hàng bị hủy"

#### ✅ Đơn hàng giao thành công + có refund
- **Icon**: `checkmark-circle` (màu xanh lá)
- **Message**: "Hoàn tiền đã hoàn tất"
- **Màu sắc**: `#27ae60` (xanh lá)
- **Mô tả**: "Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc"

#### ✅ Đơn hàng đang xử lý + có refund
- **Icon**: `time` (màu cam)
- **Message**: "Đang xử lý hoàn tiền"
- **Màu sắc**: `#f39c12` (cam)
- **Mô tả**: "Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc"

## Kết quả

### Trước khi sửa
```
Trạng thái: Đã hoàn tiền
[RefundStatusNotification component KHÔNG hiển thị khi đơn hàng bị hủy]
```

### Sau khi sửa
```
Trạng thái: Đã hoàn tiền
[RefundStatusNotification component hiển thị với thông báo phù hợp]
```

## Testing

### Test case 1: Đơn hàng bị hủy + có refund
1. Admin hủy đơn hàng
2. Server trả về paymentStatus = 'refunded'
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Đơn hàng đã được hủy - Tiền sẽ được hoàn" với màu đỏ

### Test case 2: Đơn hàng giao thành công + hoàn tiền
1. Admin giao đơn hàng
2. Admin hoàn tiền
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Hoàn tiền đã hoàn tất" với màu xanh lá

### Test case 3: Đơn hàng bị hủy + không có refund
1. Admin hủy đơn hàng
2. Server trả về paymentStatus = 'pending'
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Không hiển thị thông báo hoàn tiền

## Lưu ý quan trọng

1. **User Experience** - Thông báo rõ ràng về việc hoàn tiền khi đơn hàng bị hủy
2. **Visual Feedback** - Màu sắc và icon khác nhau cho từng trường hợp
3. **Consistency** - Đảm bảo tính nhất quán trong thông báo
4. **Clarity** - Thông báo rõ ràng về lý do hoàn tiền

## Tương lai

### Cải thiện có thể thực hiện:
1. **Dynamic timing** - Thời gian hoàn tiền có thể thay đổi theo từng trường hợp
2. **Multiple refund reasons** - Hỗ trợ nhiều lý do hoàn tiền khác nhau
3. **Refund tracking** - Theo dõi tiến trình hoàn tiền
4. **Notification preferences** - Cho phép user tùy chỉnh thông báo 