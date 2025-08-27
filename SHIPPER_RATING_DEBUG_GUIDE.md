# 🔍 Shipper Rating Debug Guide

## 📋 Vấn đề

**ShipperRatingCard không hiển thị** trong màn hình "Chi tiết đơn hàng" mặc dù đơn hàng đã ở trạng thái "Đã giao" (Delivered).

## 🔍 Nguyên nhân

Component `ShipperRatingCard` có **2 điều kiện nghiêm ngặt** để hiển thị:

```typescript
// Điều kiện 1: Đơn hàng phải đã giao
if (orderStatus?.toLowerCase() !== 'delivered') {
  return null;
}

// Điều kiện 2: Phải có shipper được gán
if (!shipperInfo?._id) {
  return null;
}
```

## 🎯 Các trường hợp không hiển thị

### **1. Order Status không phải "delivered"**
- ✅ Hiển thị: `status = "delivered"` hoặc `"Delivered"`
- ❌ Không hiển thị: `status = "shipped"`, `"pending"`, `"processing"`, etc.

### **2. Không có assigned_shipper_id**
- ✅ Hiển thị: `assigned_shipper_id = "shipper123"`
- ❌ Không hiển thị: `assigned_shipper_id = null` hoặc `undefined`

## 🧪 Debug Steps

### **Bước 1: Kiểm tra dữ liệu đơn hàng**
```javascript
// Trong order-detail.tsx, thêm debug info
{__DEV__ && (
  <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 10 }}>
    <Text>Debug ShipperRatingCard:</Text>
    <Text>Order Status: {order.status}</Text>
    <Text>Assigned Shipper ID: {order.assigned_shipper_id || 'null'}</Text>
    <Text>Assigned Shipper Name: {order.assigned_shipper_name || 'null'}</Text>
    <Text>Assigned Shipper Phone: {order.assigned_shipper_phone || 'null'}</Text>
  </View>
)}
```

### **Bước 2: Chạy debug script**
```bash
node debug-shipper-rating-logic.js
```

### **Bước 3: Sử dụng component test**
```typescript
// Thay thế ShipperRatingCard bằng ShipperRatingCardTest
import ShipperRatingCardTest from '../components/ShipperRatingCardTest';

<ShipperRatingCardTest
  orderId={orderId as string}
  orderStatus={order.status}
  shipperInfo={{
    _id: order.assigned_shipper_id || '',
    full_name: order.assigned_shipper_name || '',
    phone_number: order.assigned_shipper_phone || ''
  }}
  onRatePress={handleRateShipper}
/>
```

## 🔧 Giải pháp

### **Giải pháp 1: Cập nhật dữ liệu đơn hàng**
```javascript
// Backend cần cập nhật đơn hàng với shipper info
{
  "assigned_shipper_id": "shipper123",
  "assigned_shipper_name": "Nguyễn Văn A",
  "assigned_shipper_phone": "0123456789"
}
```

### **Giải pháp 2: Làm mềm điều kiện hiển thị**
```typescript
// Trong ShipperRatingCard.tsx, thay đổi logic
// Thay vì return null, hiển thị thông báo
if (!shipperInfo?._id) {
  return (
    <View style={styles.container}>
      <Text>Đơn hàng đã giao nhưng chưa có thông tin shipper</Text>
    </View>
  );
}
```

### **Giải pháp 3: Sử dụng component test**
Component `ShipperRatingCardTest` sẽ:
- ✅ Luôn hiển thị debug info trong development
- ✅ Hiển thị thông báo khi không có shipper
- ✅ Hiển thị thông báo khi chưa giao hàng
- ✅ Hiển thị bình thường khi có đủ điều kiện

## 📊 Test Cases

| Order Status | Assigned Shipper | Expected Result |
|--------------|------------------|-----------------|
| "delivered" | ✅ Có | ✅ Hiển thị |
| "Delivered" | ✅ Có | ✅ Hiển thị |
| "delivered" | ❌ Không có | ❌ Không hiển thị |
| "shipped" | ✅ Có | ❌ Không hiển thị |
| "pending" | ✅ Có | ❌ Không hiển thị |

## 🚀 Next Steps

1. **Kiểm tra dữ liệu thực tế** của đơn hàng
2. **Cập nhật backend** để gán shipper cho đơn hàng
3. **Test với ShipperRatingCardTest** để xác nhận logic
4. **Quyết định** có làm mềm điều kiện hay không

## 📞 Support

Nếu vẫn gặp vấn đề:
1. Chạy `node debug-order-data.js` với token hợp lệ
2. Kiểm tra console logs trong app
3. Xem debug info từ `ShipperRatingCardTest`
