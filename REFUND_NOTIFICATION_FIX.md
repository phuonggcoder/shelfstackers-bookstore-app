# Loại bỏ thông báo hoàn tiền khi hủy đơn hàng

## Vấn đề
Khi đơn hàng bị hủy, ứng dụng vẫn hiển thị thông báo "Tiền sẽ được hoàn trong 3-5 ngày làm việc" mặc dù không có hoàn tiền thực sự.

## Nguyên nhân
1. **Logic kiểm tra không đầy đủ** - Chỉ kiểm tra trạng thái thanh toán có chứa 'refund' mà không kiểm tra trạng thái đơn hàng
2. **Thông báo sai** - Hiển thị thông báo hoàn tiền cho đơn hàng bị hủy
3. **User Experience kém** - Gây nhầm lẫn cho user

## Giải pháp đã triển khai

### 1. Loại bỏ thông báo hoàn tiền trong trạng thái thanh toán
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
<Text style={[styles.infoValue, { color: getPaymentStatusColor(order.paymentStatus) }]}>
  {getPaymentStatusText(order.paymentStatus)}
  {order.paymentStatus.toLowerCase().includes('refund') && (
    <Text style={styles.refundNote}> (Tiền sẽ được hoàn trong 3-5 ngày làm việc)</Text>
  )}
</Text>

// Sau
<Text style={[styles.infoValue, { color: getPaymentStatusColor(order.paymentStatus) }]}>
  {getPaymentStatusText(order.paymentStatus)}
</Text>
```

### 2. Thêm function kiểm tra hoàn tiền thực sự
**File**: `app/order-detail.tsx`

**Thêm function**:
```typescript
const isRealRefund = (paymentStatus: string, orderStatus: string) => {
  const normalizedPayment = (paymentStatus || '').toLowerCase();
  const normalizedOrder = (orderStatus || '').toLowerCase();
  
  // Chỉ hiển thị hoàn tiền khi không phải đơn hàng bị hủy
  return normalizedPayment.includes('refund') && 
         !normalizedOrder.includes('cancelled') && 
         !normalizedOrder.includes('canceled');
};
```

### 3. Cập nhật component RefundStatusNotification
**File**: `components/RefundStatusNotification.tsx`

**Thay đổi**:
```typescript
// Thêm prop orderStatus
interface RefundStatusNotificationProps {
  paymentStatus: string;
  orderStatus?: string;
  refundAmount?: number;
}

// Cập nhật logic kiểm tra
const normalizedPayment = (paymentStatus || '').toLowerCase();
const normalizedOrder = (orderStatus || '').toLowerCase();

// Chỉ hiển thị khi có trạng thái hoàn tiền thực sự (không phải khi hủy)
if (!normalizedPayment.includes('refund') || 
    normalizedOrder.includes('cancelled') || 
    normalizedOrder.includes('canceled')) {
  return null;
}
```

### 4. Cập nhật cách gọi component
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
<RefundStatusNotification 
  paymentStatus={order.paymentStatus}
  refundAmount={order.totalAmount}
/>

// Sau
{isRealRefund(order.paymentStatus, order.status) && (
  <RefundStatusNotification 
    paymentStatus={order.paymentStatus}
    orderStatus={order.status}
    refundAmount={order.totalAmount}
  />
)}
```

## Logic mới

### Kiểm tra hoàn tiền thực sự
1. **Trạng thái thanh toán** - Phải chứa 'refund'
2. **Trạng thái đơn hàng** - KHÔNG được chứa 'cancelled' hoặc 'canceled'
3. **Kết hợp** - Chỉ hiển thị khi cả hai điều kiện đều đúng

### Các trường hợp

#### ✅ Hiển thị thông báo hoàn tiền
- Đơn hàng: `delivered` + Thanh toán: `refunded`
- Đơn hàng: `delivered` + Thanh toán: `refund_pending`
- Đơn hàng: `delivered` + Thanh toán: `refund_processing`

#### ❌ KHÔNG hiển thị thông báo hoàn tiền
- Đơn hàng: `cancelled` + Thanh toán: `refunded`
- Đơn hàng: `canceled` + Thanh toán: `refund_pending`
- Đơn hàng: `cancelled_by_admin` + Thanh toán: `refund_processing`

## Kết quả

### Trước khi sửa
```
Trạng thái: Đã hoàn tiền (Tiền sẽ được hoàn trong 3-5 ngày làm việc)
[RefundStatusNotification component hiển thị]
```

### Sau khi sửa
```
Trạng thái: Đã hoàn tiền
[RefundStatusNotification component KHÔNG hiển thị khi đơn hàng bị hủy]
```

## Testing

### Test case 1: Đơn hàng bị hủy
1. Admin hủy đơn hàng
2. User quay lại trang đơn hàng
3. **Kết quả mong đợi**: Không hiển thị thông báo hoàn tiền

### Test case 2: Đơn hàng giao thành công + hoàn tiền
1. Admin giao đơn hàng
2. Admin hoàn tiền
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Hiển thị thông báo hoàn tiền

### Test case 3: Đơn hàng bị hủy + có trạng thái refund
1. Admin hủy đơn hàng
2. Server trả về paymentStatus = 'refunded'
3. User quay lại trang đơn hàng
4. **Kết quả mong đợi**: Không hiển thị thông báo hoàn tiền

## Lưu ý quan trọng

1. **Logic kiểm tra** - Cần kiểm tra cả trạng thái đơn hàng và thanh toán
2. **User Experience** - Không gây nhầm lẫn cho user
3. **Consistency** - Đảm bảo tính nhất quán trong toàn bộ ứng dụng
4. **Future-proof** - Dễ dàng mở rộng cho các trạng thái mới

## Tương lai

### Cải thiện có thể thực hiện:
1. **Configurable rules** - Cho phép cấu hình logic hiển thị
2. **Admin override** - Cho phép admin ghi đè logic hiển thị
3. **Analytics** - Theo dõi các trường hợp hiển thị/ẩn thông báo
4. **A/B testing** - Test các cách hiển thị khác nhau 