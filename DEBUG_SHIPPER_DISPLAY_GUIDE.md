# 🔍 Debug Guide - Shipper Information Not Displaying

## 🚨 Vấn đề
Shipper information không hiển thị trong Order Detail mặc dù đã implement helper functions.

## 🔍 Nguyên nhân có thể

### 1. **Order chưa có shipper được gán**
```javascript
// assigned_shipper_id là null/undefined
assigned_shipper_id: null
```

### 2. **Order status chưa phải "delivered"**
```javascript
// ShipperRatingCard chỉ hiển thị khi status = "delivered"
order.status !== "delivered"
```

### 3. **Backend chưa populate assigned_shipper_id**
```javascript
// Vẫn là string thay vì object
assigned_shipper_id: "68a6e9ed5103b702f20595b6" // string
// Thay vì:
assigned_shipper_id: { // object
  _id: "68a6e9ed5103b702f20595b6",
  full_name: "Cao Hoàng Nguyên",
  phone_number: "0563182308"
}
```

### 4. **Helper functions không hoạt động đúng**
```javascript
// getShipperName() trả về "Unknown Shipper"
getShipperName(order.assigned_shipper_id) // "Unknown Shipper"
```

## 🛠️ Cách Debug

### Bước 1: Chạy Debug Script
```bash
# Cung cấp token và order_id
USER_TOKEN=your_token ORDER_ID=your_order_id node debug-order-shipper-data.js
```

### Bước 2: Kiểm tra Console Logs
Trong React Native app, mở Developer Menu và xem console logs:

```javascript
// Thêm debug logs vào app/order-detail.tsx
console.log('Order data:', order);
console.log('assigned_shipper_id:', order.assigned_shipper_id);
console.log('getOrderShipperName():', getOrderShipperName());
console.log('getOrderShipperInfo():', getOrderShipperInfo());
```

### Bước 3: Kiểm tra Network Tab
Trong React Native Debugger hoặc Flipper, kiểm tra API response:

```
GET /api/orders/{order_id}
```

Response cần có:
```json
{
  "assigned_shipper_id": {
    "_id": "68a6e9ed5103b702f20595b6",
    "full_name": "Cao Hoàng Nguyên",
    "phone_number": "0563182308",
    "username": "nguyen11111"
  }
}
```

## 📋 Checklist Debug

### ✅ Kiểm tra Order Data:
- [ ] `order.assigned_shipper_id` có tồn tại không?
- [ ] `order.assigned_shipper_id` là object hay string?
- [ ] `order.assigned_shipper_id.full_name` có giá trị không?

### ✅ Kiểm tra Order Status:
- [ ] `order.status` có phải "delivered" không?
- [ ] `order.order_status` có phải "delivered" không?

### ✅ Kiểm tra Helper Functions:
- [ ] `getOrderShipperName()` trả về gì?
- [ ] `getOrderShipperInfo()` trả về gì?
- [ ] `getOrderShipperPhone()` trả về gì?

### ✅ Kiểm tra UI Conditions:
- [ ] `{getOrderShipperName() && (...)}` có render không?
- [ ] `{isOrderCompleted() && (...)}` có render không?

## 🎯 Expected Results

### Nếu có shipper và order đã giao:
```javascript
// Console logs:
Order data: { assigned_shipper_id: { _id: "...", full_name: "Cao Hoàng Nguyên" } }
getOrderShipperName(): "Cao Hoàng Nguyên"
getOrderShipperInfo(): { _id: "...", full_name: "Cao Hoàng Nguyên", phone_number: "..." }

// UI hiển thị:
// - Shipper Information section
// - ShipperRatingCard
// - OrderStatusBadge với shipper name
```

### Nếu không có shipper:
```javascript
// Console logs:
Order data: { assigned_shipper_id: null }
getOrderShipperName(): "Unknown Shipper"
getOrderShipperInfo(): null

// UI không hiển thị:
// - Shipper Information section
// - ShipperRatingCard
```

## 🔧 Fix Actions

### Nếu assigned_shipper_id là null:
- Kiểm tra backend logic gán shipper cho order
- Đảm bảo order có status phù hợp để gán shipper

### Nếu assigned_shipper_id là string:
- Backend chưa populate, cần deploy fix `orderRouter.js`
- Hoặc frontend đang gọi API cũ

### Nếu assigned_shipper_id là object nhưng không có full_name:
- Backend populate thiếu field `full_name`
- Kiểm tra shipper data trong database

### Nếu helper functions không hoạt động:
- Kiểm tra import `utils/shipperHelpers.ts`
- Kiểm tra TypeScript compilation errors

## 📱 Test Cases

### Test Case 1: Order có shipper, đã giao
```javascript
// Expected: Hiển thị đầy đủ shipper info
order.status = "delivered"
order.assigned_shipper_id = { _id: "...", full_name: "Cao Hoàng Nguyên" }
```

### Test Case 2: Order có shipper, chưa giao
```javascript
// Expected: Không hiển thị ShipperRatingCard
order.status = "pending"
order.assigned_shipper_id = { _id: "...", full_name: "Cao Hoàng Nguyên" }
```

### Test Case 3: Order không có shipper
```javascript
// Expected: Không hiển thị shipper info
order.assigned_shipper_id = null
```

## 🚀 Next Steps

1. **Chạy debug script** để xác định nguyên nhân
2. **Kiểm tra console logs** trong app
3. **Verify API response** có đúng format không
4. **Apply fix** dựa trên kết quả debug
5. **Test lại** với order thực tế

---

**Status:** 🔍 Debug in progress
**Priority:** 🔥 High - Need to identify root cause
