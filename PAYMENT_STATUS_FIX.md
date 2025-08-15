# Khắc phục vấn đề trạng thái thanh toán

## Vấn đề
Trạng thái thanh toán hiển thị "Chờ xử lý" nhưng thực tế đã hoàn tiền.

## Nguyên nhân
1. **Thiếu hỗ trợ trạng thái hoàn tiền** - Code chỉ hỗ trợ `'pending'`, `'paid'`, `'failed'` nhưng server có thể trả về `'refunded'`, `'refund_pending'`, etc.
2. **Mapping sai trạng thái** - Server trả về trạng thái khác nhưng code không map đúng
3. **Thiếu thông báo hoàn tiền** - User không biết khi nào tiền được hoàn

## Giải pháp đã triển khai

### 1. Cập nhật hỗ trợ trạng thái hoàn tiền
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ xử lý';
    case 'paid': return 'Đã thanh toán';
    case 'failed': return 'Thanh toán thất bại';
    default: return 'Không xác định';
  }
};

// Sau
const getPaymentStatusText = (status: string) => {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'pending': return 'Chờ xử lý';
    case 'paid': return 'Đã thanh toán';
    case 'failed': return 'Thanh toán thất bại';
    case 'refunded':
    case 'refund_pending':
    case 'refund_processing':
    case 'refund_completed':
      return 'Đã hoàn tiền';
    case 'partially_refunded':
    case 'partial_refund':
      return 'Hoàn tiền một phần';
    case 'cancelled':
    case 'canceled':
      return 'Đã hủy';
    default: return 'Không xác định';
  }
};
```

### 2. Thêm màu sắc cho trạng thái thanh toán
**File**: `app/order-detail.tsx`

**Thêm function**:
```typescript
const getPaymentStatusColor = (status: string) => {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'pending': return '#f39c12';
    case 'paid': return '#27ae60';
    case 'failed': return '#e74c3c';
    case 'refunded':
    case 'refund_pending':
    case 'refund_processing':
    case 'refund_completed':
      return '#3498db';
    case 'partially_refunded':
    case 'partial_refund':
      return '#9b59b6';
    case 'cancelled':
    case 'canceled':
      return '#e74c3c';
    default: return '#95a5a6';
  }
};
```

### 3. Cập nhật hiển thị màu sắc
**File**: `app/order-detail.tsx`

**Thay đổi**:
```typescript
// Trước
<Text style={[styles.infoValue, { color: getStatusColor(order.paymentStatus) }]}>

// Sau
<Text style={[styles.infoValue, { color: getPaymentStatusColor(order.paymentStatus) }]}>
```

### 4. Thêm thông báo hoàn tiền
**File**: `app/order-detail.tsx`

**Thêm**:
```typescript
{order.paymentStatus.toLowerCase().includes('refund') && (
  <Text style={styles.refundNote}> (Tiền sẽ được hoàn trong 3-5 ngày làm việc)</Text>
)}
```

### 5. Tạo component thông báo hoàn tiền
**File**: `components/RefundStatusNotification.tsx`

**Tính năng**:
- Hiển thị thông báo khi có trạng thái hoàn tiền
- Hiển thị số tiền được hoàn
- Thông báo thời gian hoàn tiền
- Màu sắc và icon phù hợp với trạng thái

## Các trạng thái thanh toán hỗ trợ

### Trạng thái cơ bản
- `pending` → "Chờ xử lý" (màu cam)
- `paid` → "Đã thanh toán" (màu xanh lá)
- `failed` → "Thanh toán thất bại" (màu đỏ)

### Trạng thái hoàn tiền
- `refunded` → "Đã hoàn tiền" (màu xanh dương)
- `refund_pending` → "Đã hoàn tiền" (màu xanh dương)
- `refund_processing` → "Đã hoàn tiền" (màu xanh dương)
- `refund_completed` → "Đã hoàn tiền" (màu xanh dương)
- `partially_refunded` → "Hoàn tiền một phần" (màu tím)
- `partial_refund` → "Hoàn tiền một phần" (màu tím)

### Trạng thái hủy
- `cancelled` → "Đã hủy" (màu đỏ)
- `canceled` → "Đã hủy" (màu đỏ)

## Component RefundStatusNotification

### Props
- `paymentStatus: string` - Trạng thái thanh toán
- `refundAmount?: number` - Số tiền được hoàn (optional)

### Tính năng
- **Tự động ẩn** - Chỉ hiển thị khi có trạng thái hoàn tiền
- **Icon động** - Thay đổi icon theo trạng thái
- **Màu sắc** - Màu sắc phù hợp với trạng thái
- **Thông tin chi tiết** - Hiển thị số tiền và thời gian hoàn

### Các trạng thái hiển thị
1. **Hoàn tất** - Icon checkmark, màu xanh lá
2. **Đang xử lý** - Icon time, màu cam
3. **Đã gửi yêu cầu** - Icon card, màu xanh dương

## Cách sử dụng

### 1. Refresh thủ công
- Nhấn nút refresh (🔄) ở header
- Dữ liệu sẽ được cập nhật từ server

### 2. Tự động refresh
- Khi quay lại trang đơn hàng
- Sử dụng `useFocusEffect` để đảm bảo dữ liệu mới nhất

### 3. Thông báo hoàn tiền
- Hiển thị component `RefundStatusNotification`
- Thông báo chi tiết về quá trình hoàn tiền

## Testing

### Test case 1: Hoàn tiền hoàn tất
1. Admin hoàn tiền đơn hàng
2. User quay lại trang đơn hàng
3. **Kết quả mong đợi**: Hiển thị "Đã hoàn tiền" với màu xanh dương

### Test case 2: Hoàn tiền đang xử lý
1. Admin bắt đầu xử lý hoàn tiền
2. User quay lại trang đơn hàng
3. **Kết quả mong đợi**: Hiển thị "Đã hoàn tiền" với thông báo đang xử lý

### Test case 3: Hoàn tiền một phần
1. Admin hoàn tiền một phần
2. User quay lại trang đơn hàng
3. **Kết quả mong đợi**: Hiển thị "Hoàn tiền một phần" với màu tím

## Lưu ý quan trọng

1. **Server response** - Đảm bảo server trả về đúng trạng thái thanh toán
2. **Normalization** - Chuyển đổi trạng thái về lowercase để so sánh
3. **User Experience** - Thông báo rõ ràng về thời gian hoàn tiền
4. **Visual Feedback** - Màu sắc và icon giúp user hiểu trạng thái

## Tương lai

### Cải thiện có thể thực hiện:
1. **Real-time updates** - WebSocket để cập nhật trạng thái real-time
2. **Push notifications** - Thông báo khi hoàn tiền hoàn tất
3. **Tracking** - Theo dõi tiến trình hoàn tiền
4. **Multiple payment methods** - Hỗ trợ nhiều phương thức thanh toán 