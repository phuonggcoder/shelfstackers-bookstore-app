# Chỉ hiển thị thông báo hoàn tiền khi đã thanh toán

## Yêu cầu
Chỉ hiển thị thông báo hoàn tiền khi tiền đã được thanh toán (payment status = 'paid'), còn khi chưa thanh toán thì không cần hiển thị.

## Lý do
- **Chưa thanh toán**: Không cần hoàn tiền vì chưa có tiền nào được trả
- **Đã thanh toán**: Cần hoàn tiền khi đơn hàng bị hủy hoặc có vấn đề
- **User Experience**: Tránh gây nhầm lẫn cho user

## Giải pháp đã triển khai

### 1. Cập nhật logic kiểm tra hoàn tiền
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  const normalizedOrder = (orderStatus || '').toLowerCase();
  
  // Hiển thị hoàn tiền khi có trạng thái refund HOẶC đơn hàng bị hủy
  return normalizedPayment.includes('refund') || 
         normalizedOrder.includes('cancelled') || 
         normalizedOrder.includes('canceled');
};

// Sau
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  const normalizedOrder = (orderStatus || '').toLowerCase();
  
  // Chỉ hiển thị hoàn tiền khi đã thanh toán VÀ (có refund HOẶC đơn hàng bị hủy)
  return normalizedPayment === 'paid' && (
    normalizedPayment.includes('refund') || 
    normalizedOrder.includes('cancelled') || 
    normalizedOrder.includes('canceled')
  );
};
```

### 2. Cập nhật component RefundStatusNotification
**File**: `components/RefundStatusNotification.tsx`

**Thay đổi**:
```typescript
// Trước
if (!normalizedPayment.includes('refund') && 
    !normalizedOrder.includes('cancelled') && 
    !normalizedOrder.includes('canceled')) {
  return null;
}

// Sau
if (normalizedPayment !== 'paid' || 
    (!normalizedPayment.includes('refund') && 
     !normalizedOrder.includes('cancelled') && 
     !normalizedOrder.includes('canceled'))) {
  return null;
}
```

## Logic mới

### Hiển thị thông báo hoàn tiền khi:
1. **Payment status = 'paid'** - Đã thanh toán
2. **VÀ** có một trong các điều kiện:
   - Có trạng thái thanh toán refund (`refunded`, `refund_pending`, etc.)
   - HOẶC đơn hàng bị hủy (`cancelled`, `canceled`, etc.)

### Các trường hợp hiển thị

#### ✅ Đã thanh toán + đơn hàng bị hủy
- **Payment Status**: `paid`
- **Order Status**: `cancelled`
- **Kết quả**: Hiển thị thông báo hoàn tiền

#### ✅ Đã thanh toán + có refund
- **Payment Status**: `refunded`
- **Order Status**: `delivered`
- **Kết quả**: Hiển thị thông báo hoàn tiền

#### ✅ Đã thanh toán + refund pending
- **Payment Status**: `refund_pending`
- **Order Status**: `delivered`
- **Kết quả**: Hiển thị thông báo hoàn tiền

### Các trường hợp KHÔNG hiển thị

#### ❌ Chưa thanh toán + đơn hàng bị hủy
- **Payment Status**: `pending`
- **Order Status**: `cancelled`
- **Kết quả**: KHÔNG hiển thị thông báo hoàn tiền

#### ❌ Chưa thanh toán + đơn hàng giao thành công
- **Payment Status**: `pending`
- **Order Status**: `delivered`
- **Kết quả**: KHÔNG hiển thị thông báo hoàn tiền

#### ❌ Thanh toán thất bại + đơn hàng bị hủy
- **Payment Status**: `failed`
- **Order Status**: `cancelled`
- **Kết quả**: KHÔNG hiển thị thông báo hoàn tiền

## Testing

### Test case 1: Đã thanh toán + đơn hàng bị hủy
1. User thanh toán đơn hàng (payment status = 'paid')
2. Admin hủy đơn hàng
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Đơn hàng đã được hủy - Tiền sẽ được hoàn"

### Test case 2: Chưa thanh toán + đơn hàng bị hủy
1. User chưa thanh toán (payment status = 'pending')
2. Admin hủy đơn hàng
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: KHÔNG hiển thị thông báo hoàn tiền

### Test case 3: Đã thanh toán + hoàn tiền
1. User thanh toán đơn hàng (payment status = 'paid')
2. Admin hoàn tiền (payment status = 'refunded')
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo "Hoàn tiền đã hoàn tất"

### Test case 4: Thanh toán thất bại + đơn hàng bị hủy
1. Thanh toán thất bại (payment status = 'failed')
2. Admin hủy đơn hàng
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: KHÔNG hiển thị thông báo hoàn tiền

## Lưu ý quan trọng

1. **Logic thanh toán** - Chỉ hoàn tiền khi đã thực sự thanh toán
2. **User Experience** - Tránh gây nhầm lẫn cho user về việc hoàn tiền
3. **Business Logic** - Phù hợp với logic nghiệp vụ thực tế
4. **Payment Gateway** - Cần tích hợp với cổng thanh toán để xác định trạng thái thanh toán

## Tương lai

### Cải thiện có thể thực hiện:
1. **Payment verification** - Xác minh trạng thái thanh toán với cổng thanh toán
2. **Partial payment** - Hỗ trợ hoàn tiền một phần
3. **Payment history** - Lịch sử thanh toán chi tiết
4. **Refund tracking** - Theo dõi tiến trình hoàn tiền 