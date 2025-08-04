# 🔧 Backend Review Endpoint Specification

## 🚨 **Vấn đề hiện tại:**
Frontend đang gọi endpoint `/api/v1/review/user` nhưng backend chưa implement, dẫn đến lỗi **API Error: 500**.

## 📋 **Endpoint cần implement:**

### **GET /api/v1/review/user**
Lấy danh sách reviews của current user (user đang đăng nhập).

#### **Request:**
```http
GET /api/v1/review/user?page=1&limit=10
Authorization: Bearer <token>
Content-Type: application/json
```

#### **Query Parameters:**
- `page` (optional): Số trang, mặc định = 1
- `limit` (optional): Số reviews mỗi trang, mặc định = 10

#### **Response Success (200):**
```json
{
  "reviews": [
    {
      "_id": "review_id",
      "user_id": "user_id",
      "product_id": {
        "_id": "book_id",
        "title": "Tên sách",
        "cover_image": ["url1", "url2"]
      },
      "order_id": {
        "_id": "order_id",
        "order_id": "ORD001",
        "order_date": "2024-01-01T00:00:00.000Z"
      },
      "rating": 5,
      "comment": "Sách rất hay!",
      "images": [],
      "videos": [],
      "media": [],
      "is_verified_purchase": true,
      "helpful_votes": 0,
      "is_edited": false,
      "edited_at": null,
      "is_deleted": false,
      "deleted_at": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "timeAgo": "2 ngày trước"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### **Response Error (401):**
```json
{
  "msg": "Token không hợp lệ"
}
```

#### **Response Error (500):**
```json
{
  "msg": "Lỗi server",
  "error": "Error details (only in development)"
}
```

## 🔧 **Implementation Guide:**

### **1. Thêm route vào reviewRouter.js:**
```javascript
// GET /api/v1/review/user - Lấy reviews của current user
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { page = 1, limit = 10 } = req.query;

    // Validation
    if (!userId) {
      return res.status(401).json({ msg: 'Không tìm thấy thông tin user' });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query reviews của current user
    const query = {
      user_id: userId,
      is_deleted: false
    };

    // Get total count
    const totalReviews = await Review.countDocuments(query);

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate('product_id', 'title cover_image')
      .populate('order_id', 'order_id order_date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate timeAgo for each review
    const reviewsWithTimeAgo = reviews.map(review => {
      const timeAgo = calculateTimeAgo(review.createdAt);
      return {
        ...review.toObject(),
        timeAgo
      };
    });

    res.json({
      reviews: reviewsWithTimeAgo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error getting current user reviews:', error);
    res.status(500).json({ 
      msg: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to calculate timeAgo
function calculateTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
}
```

### **2. Đảm bảo middleware auth:**
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'Không có token, truy cập bị từ chối' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token không hợp lệ' });
  }
};

module.exports = auth;
```

### **3. Đảm bảo Review model:**
```javascript
// model/review.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000 },
  images: [{ type: String, trim: true }],
  videos: [{ type: String, trim: true }],
  media: [{
    url: { type: String, trim: true, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    public_id: { type: String, trim: true },
    size: { type: Number },
    duration: { type: Number }
  }],
  is_verified_purchase: { type: Boolean, default: true },
  helpful_votes: { type: Number, default: 0 },
  is_edited: { type: Boolean, default: false },
  edited_at: { type: Date },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
```

## 🧪 **Testing:**

### **Test với curl:**
```bash
# Test không có token
curl -X GET "https://your-backend-url.com/api/v1/review/user"

# Test với invalid token
curl -X GET "https://your-backend-url.com/api/v1/review/user" \
  -H "Authorization: Bearer invalid_token"

# Test với valid token
curl -X GET "https://your-backend-url.com/api/v1/review/user" \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"

# Test với pagination
curl -X GET "https://your-backend-url.com/api/v1/review/user?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"
```

### **Test với Postman:**
1. **Method:** GET
2. **URL:** `{{base_url}}/api/v1/review/user`
3. **Headers:** 
   - `Authorization: Bearer {{auth_token}}`
   - `Content-Type: application/json`
4. **Query Params:**
   - `page`: 1
   - `limit`: 10

## ✅ **Checklist:**

- [ ] Thêm route `/user` vào reviewRouter.js
- [ ] Implement authentication middleware
- [ ] Add pagination support
- [ ] Populate product và order information
- [ ] Calculate timeAgo for reviews
- [ ] Add proper error handling
- [ ] Test với valid token
- [ ] Test với invalid token
- [ ] Test pagination
- [ ] Deploy to production

## 🎯 **Kết quả mong đợi:**

Sau khi implement endpoint này:
- ✅ Frontend sẽ không còn lỗi 500
- ✅ Màn hình "Đánh giá của tôi" sẽ hiển thị reviews thực
- ✅ Pagination sẽ hoạt động đúng
- ✅ Error handling sẽ rõ ràng

## 📞 **Liên hệ:**

Nếu có vấn đề gì, hãy liên hệ team backend để implement endpoint này theo specification trên. 