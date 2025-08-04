# Hướng Dẫn Sử Dụng API Response Cho Đơn Hàng

## Tổng Quan

API đã được cập nhật để trả về cấu trúc response nhất quán và an toàn cho tất cả các endpoint liên quan đến đơn hàng.

## Cấu Trúc Response Mới

### 1. Create Order Response

```json
{
  "success": true,
  "order": {
    "_id": "686dae96353ef527ba7d8c9a",
    "order_id": "ORD1703123456789ABC123",
    "total_amount": 72000,
    "order_status": "Pending",
    "order_date": "2023-12-21T10:30:00.000Z",
    "address_id": {
      "_id": "686dae96353ef527ba7d8c9b",
      "full_name": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "order_items": [
      {
        "book_id": {
          "_id": "686dae96353ef527ba7d8c9c",
          "title": "Sách Test",
          "author": "Tác giả Test",
          "price": 36000,
          "cover_image": "cover.jpg"
        },
        "quantity": 2,
        "price": 36000
      }
    ],
    "discount_amount": 5000,
    "ship_amount": 10000,
    "art_amount": 0
  },
  "payment": {
    "_id": "686dae96353ef527ba7d8c9d",
    "payment_method": "ZALOPAY",
    "payment_status": "Pending",
    "amount": 72000,
    "transaction_id": null,
    "expireAt": "2023-12-21T11:30:00.000Z"
  },
  "zaloPay": {
    "order_url": "https://sandbox.zalopay.com.vn/order/123456",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "zp_trans_token": "token123456"
  },
  "discount_amount": 5000,
  "original_amount": 77000,
  "final_amount": 72000
}
```

### 2. Get Order Detail Response

```json
{
  "success": true,
  "order": {
    "_id": "686dae96353ef527ba7d8c9a",
    "order_id": "ORD1703123456789ABC123",
    "total_amount": 72000,
    "order_status": "Pending",
    "order_date": "2023-12-21T10:30:00.000Z",
    "address_id": { /* address object */ },
    "order_items": [ /* items array */ ],
    "discount_amount": 5000,
    "ship_amount": 10000,
    "art_amount": 0
  },
  "payment": {
    "_id": "686dae96353ef527ba7d8c9d",
    "payment_method": "ZALOPAY",
    "payment_status": "Pending",
    "amount": 72000,
    "transaction_id": null,
    "expireAt": "2023-12-21T11:30:00.000Z"
  }
}
```

## Cách Sử Dụng Trong Frontend

### ✅ Cách Đúng (An Toàn)

```javascript
// 1. Create Order
const response = await createOrder(token, orderData);

if (response.success) {
  const orderId = response.order._id;
  const orderCode = response.order.order_id;
  const totalAmount = response.order.total_amount;
  const paymentAmount = response.payment.amount;
  const paymentStatus = response.payment.payment_status;
  
  // ZaloPay data (nếu có)
  if (response.zaloPay) {
    const orderUrl = response.zaloPay.order_url;
    const qrCode = response.zaloPay.qr_code;
  }
  
  // Navigate to success page
  router.replace({ 
    pathname: '/order-success', 
    params: { orderId } 
  });
}

// 2. Get Order Detail
const response = await getOrderDetail(token, orderId);

if (response.success) {
  const order = response.order;
  const payment = response.payment;
  
  // Safe access to order data
  const totalAmount = order.total_amount || 0;
  const orderStatus = order.order_status || 'Pending';
  const orderCode = order.order_id || order._id;
  
  // Safe access to payment data
  const paymentAmount = payment.amount || 0;
  const paymentStatus = payment.payment_status || 'Pending';
  const transactionId = payment.transaction_id || null;
}
```

### ❌ Cách Sai (Gây Lỗi)

```javascript
// ❌ Không kiểm tra success
const order = await createOrder(token, orderData);
const orderId = order._id; // Có thể undefined

// ❌ Truy cập trực tiếp không an toàn
const totalAmount = response.total_amount; // Có thể undefined
const paymentAmount = response.amount; // Có thể undefined

// ❌ Không có fallback
const orderCode = order.order_id; // Có thể undefined
```

## Các Trường Quan Trọng

| Trường | Mô tả | Ví dụ | Fallback |
|--------|-------|-------|----------|
| `response.success` | Trạng thái thành công | `true` | - |
| `response.order.total_amount` | Tổng tiền đơn hàng | `72000` | `0` |
| `response.order.order_id` | Mã đơn hàng | `"ORD1703123456789ABC123"` | `order._id` |
| `response.order.order_status` | Trạng thái đơn hàng | `"Pending"` | `"Pending"` |
| `response.payment.amount` | Số tiền thanh toán | `72000` | `0` |
| `response.payment.payment_status` | Trạng thái thanh toán | `"Pending"` | `"Pending"` |
| `response.payment.transaction_id` | Mã giao dịch | `"TXN123456"` | `null` |
| `response.zaloPay.order_url` | Link thanh toán ZaloPay | `"https://..."` | - |
| `response.zaloPay.qr_code` | QR code ZaloPay | `"data:image/png;base64,..."` | - |

## Migration Guide

### Từ Cấu Trúc Cũ Sang Mới

```javascript
// ❌ Cũ
const order = await createOrder(token, orderData);
const orderId = order._id;
const totalAmount = order.total_amount;
const paymentAmount = order.payment?.amount;

// ✅ Mới
const response = await createOrder(token, orderData);
if (response.success) {
  const orderId = response.order._id;
  const totalAmount = response.order.total_amount;
  const paymentAmount = response.payment.amount;
}
```

### Backward Compatibility

Frontend đã được cập nhật để hỗ trợ cả cấu trúc cũ và mới:

```javascript
// Trong order-success.tsx
const response = await getOrderDetail(token, orderId);

// Handle new API response structure
if (response.success && response.order) {
  setOrder(response.order);
} else {
  // Fallback for old response structure
  setOrder(response);
}
```

## Error Handling

```javascript
try {
  const response = await createOrder(token, orderData);
  
  if (!response.success) {
    throw new Error(response.message || 'Tạo đơn hàng thất bại');
  }
  
  // Process successful response
  const orderId = response.order._id;
  
} catch (error) {
  console.error('Order creation failed:', error);
  Alert.alert('Lỗi', error.message || 'Không thể tạo đơn hàng');
}
```

## Testing

Chạy file test để kiểm tra cấu trúc response:

```bash
node test-order-response.js
```

## Lưu Ý

1. **Luôn kiểm tra `response.success`** trước khi sử dụng dữ liệu
2. **Sử dụng fallback values** cho các trường quan trọng
3. **Kiểm tra tồn tại** trước khi truy cập nested objects
4. **Log response** để debug khi cần thiết
5. **Handle errors** một cách graceful

## Kết Quả

✅ **Đã sửa xong**: API giờ trả về đầy đủ thông tin đơn hàng
✅ **Frontend an toàn**: Có thể truy cập các trường một cách an toàn
✅ **Không còn NaN**: Tất cả số tiền đều là number
✅ **Cấu trúc nhất quán**: Tất cả endpoint đều trả về cùng format
✅ **Backward compatible**: Vẫn hỗ trợ cấu trúc cũ 