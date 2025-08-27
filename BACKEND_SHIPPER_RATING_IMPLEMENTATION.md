# 🚀 Backend Implementation Guide - Shipper Rating System

## 📋 Tổng quan

Hệ thống đánh giá shipper cho phép user đánh giá shipper sau khi đơn hàng đã được giao thành công. Backend cần implement các API endpoints để hỗ trợ tính năng này.

## 🎯 API Endpoints cần implement

### **1. Lấy danh sách prompts đánh giá**
```http
GET /api/shipper-ratings/prompts
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "fast_delivery", "text": "Giao hàng nhanh chóng", "type": "positive" },
    { "id": "good_service", "text": "Thái độ phục vụ tốt", "type": "positive" },
    { "id": "careful_packaging", "text": "Đóng gói cẩn thận", "type": "positive" },
    { "id": "clear_communication", "text": "Thông báo rõ ràng", "type": "positive" },
    { "id": "on_time", "text": "Giao hàng đúng giờ", "type": "positive" },
    { "id": "good_complaint_handling", "text": "Xử lý khiếu nại tốt", "type": "positive" },
    { "id": "slow_delivery", "text": "Giao hàng chậm", "type": "negative" },
    { "id": "bad_attitude", "text": "Thái độ không tốt", "type": "negative" },
    { "id": "poor_packaging", "text": "Đóng gói không cẩn thận", "type": "negative" },
    { "id": "no_notification", "text": "Không thông báo trước", "type": "negative" }
  ]
}
```

### **2. Kiểm tra có thể đánh giá shipper**
```http
GET /api/shipper-ratings/can-rate/:order_id
Authorization: Bearer <user_token>
```

**Response có thể đánh giá:**
```json
{
  "success": true,
  "data": {
    "canRate": true,
    "order": {
      "_id": "order_id",
      "order_id": "ORD123456",
      "assigned_shipper_id": "shipper_id"
    }
  }
}
```

**Response không thể đánh giá:**
```json
{
  "success": true,
  "data": {
    "canRate": false,
    "reason": "Đơn hàng này đã được đánh giá",
    "existingRating": {
      "_id": "rating_id",
      "rating": 4.5,
      "comment": "Shipper rất nhiệt tình"
    }
  }
}
```

### **3. Lấy đánh giá của đơn hàng**
```http
GET /api/shipper-ratings/order/:order_id
Authorization: Bearer <user_token>
```

**Response có đánh giá:**
```json
{
  "success": true,
  "data": {
    "_id": "rating_id",
    "order_id": "order_id",
    "user_id": "user_id",
    "shipper_id": "shipper_id",
    "rating": 4.5,
    "selected_prompts": ["Giao hàng nhanh chóng", "Thái độ phục vụ tốt"],
    "comment": "Shipper rất nhiệt tình",
    "is_anonymous": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response chưa đánh giá:**
```json
{
  "success": true,
  "data": null
}
```

### **4. Tạo đánh giá shipper**
```http
POST /api/shipper-ratings/rate
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "order_id": "order_id",
  "rating": 4.5,
  "selected_prompts": ["Giao hàng nhanh chóng", "Thái độ phục vụ tốt"],
  "comment": "Shipper rất nhiệt tình và giao hàng đúng giờ",
  "is_anonymous": false
}
```

**Response thành công:**
```json
{
  "success": true,
  "message": "Đánh giá shipper thành công",
  "data": {
    "_id": "rating_id",
    "order_id": "order_id",
    "user_id": "user_id", 
    "shipper_id": "shipper_id",
    "rating": 4.5,
    "selected_prompts": ["Giao hàng nhanh chóng", "Thái độ phục vụ tốt"],
    "comment": "Shipper rất nhiệt tình và giao hàng đúng giờ",
    "is_anonymous": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### **5. Cập nhật đánh giá (trong 24h)**
```http
PUT /api/shipper-ratings/update/:order_id
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "rating": 5.0,
  "selected_prompts": ["Giao hàng nhanh chóng", "Thái độ phục vụ tốt", "Đóng gói cẩn thận"],
  "comment": "Cập nhật: Shipper rất xuất sắc!",
  "is_anonymous": false
}
```

### **6. Xóa đánh giá (trong 24h)**
```http
DELETE /api/shipper-ratings/delete/:order_id
Authorization: Bearer <user_token>
```

## 🗄️ Database Schema

### **ShipperRating Model**
```javascript
const mongoose = require('mongoose');

const shipperRatingSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shipper_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return v >= 1 && v <= 5;
      },
      message: 'Rating phải từ 1 đến 5'
    }
  },
  selected_prompts: [{
    type: String,
    enum: [
      'Giao hàng nhanh chóng',
      'Thái độ phục vụ tốt',
      'Đóng gói cẩn thận',
      'Thông báo rõ ràng',
      'Giao hàng đúng giờ',
      'Xử lý khiếu nại tốt',
      'Giao hàng chậm',
      'Thái độ không tốt',
      'Đóng gói không cẩn thận',
      'Không thông báo trước'
    ]
  }],
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  is_anonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
shipperRatingSchema.index({ order_id: 1 }, { unique: true });
shipperRatingSchema.index({ shipper_id: 1, created_at: -1 });
shipperRatingSchema.index({ user_id: 1 });

module.exports = mongoose.model('ShipperRating', shipperRatingSchema);
```

## 🔧 Business Rules

### **Validation Rules:**
1. **Order Status:** Chỉ đánh giá đơn `Delivered`
2. **User Ownership:** Chỉ user mua mới đánh giá
3. **Unique Rating:** Mỗi đơn chỉ đánh giá 1 lần
4. **Rating Range:** 1.0 - 5.0 (có thể 1 chữ số thập phân)
5. **Time Limit:** Chỉ edit/delete trong 24h
6. **Prompts:** Phải là prompts hợp lệ từ danh sách

### **Error Messages:**
- `"Chỉ có thể đánh giá đơn hàng đã giao thành công"`
- `"Bạn không có quyền đánh giá đơn hàng này"`
- `"Đơn hàng này đã được đánh giá"`
- `"Rating phải từ 1 đến 5"`
- `"Chỉ có thể cập nhật đánh giá trong vòng 24 giờ"`

## 🧪 Test Cases

### **Test Cases cần cover:**

1. **✅ Tạo đánh giá thành công**
   - Đơn hàng đã giao (`Delivered`)
   - User chưa đánh giá
   - Rating hợp lệ (1-5)

2. **❌ Tạo đánh giá thất bại**
   - Đơn hàng chưa giao
   - Đã đánh giá rồi
   - Rating không hợp lệ
   - Không phải user mua

3. **✅ Cập nhật đánh giá**
   - Trong vòng 24h
   - Rating hợp lệ

4. **❌ Cập nhật thất bại**
   - Quá 24h
   - Không phải user tạo

5. **✅ Xóa đánh giá**
   - Trong vòng 24h
   - User tạo đánh giá

## 🚀 Implementation Steps

### **1. Tạo Model**
```bash
# Tạo file models/shipperRating.js
```

### **2. Tạo Routes**
```bash
# Tạo file routes/shipperRating.js
```

### **3. Tạo Controller**
```bash
# Tạo file controllers/shipperRating.js
```

### **4. Thêm vào app.js**
```javascript
const shipperRatingRoutes = require('./routes/shipperRating');
app.use('/api/shipper-ratings', shipperRatingRoutes);
```

### **5. Test với Postman**
```bash
# Import collection và test các endpoints
```

## 📊 Monitoring & Analytics

### **Metrics cần track:**
- **Rating distribution:** Phân bố đánh giá 1-5 sao
- **Average rating:** Điểm trung bình theo shipper
- **Response rate:** Tỷ lệ đơn được đánh giá
- **Edit rate:** Tỷ lệ đánh giá được chỉnh sửa

### **Logs:**
```javascript
// Log khi tạo đánh giá
logger.info('Shipper rating created', {
  orderId: order_id,
  shipperId: shipper_id,
  rating: rating,
  isAnonymous: is_anonymous
});

// Log khi có lỗi
logger.error('Shipper rating error', {
  orderId: order_id,
  error: error.message,
  userId: user_id
});
```

## ✅ Deployment Checklist

- [ ] **Model:** ShipperRating schema đã tạo
- [ ] **Routes:** Tất cả endpoints đã implement
- [ ] **Validation:** Business rules đã validate
- [ ] **Authentication:** JWT auth đã setup
- [ ] **Error Handling:** Error responses đã handle
- [ ] **Testing:** Test cases đã pass
- [ ] **Documentation:** API docs đã cập nhật
- [ ] **Monitoring:** Logs và metrics đã setup
- [ ] **Deploy:** Deploy to production

## 🔗 Related Files

- `models/shipperRating.js` - Database schema
- `routes/shipperRating.js` - API routes
- `controllers/shipperRating.js` - Business logic
- `middleware/auth.js` - Authentication middleware
- `test/shipperRating.test.js` - Test cases
