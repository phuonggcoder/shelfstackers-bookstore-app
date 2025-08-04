# Backend Review System Fixes

## Các lỗi Backend hiện tại

### 1. **Lỗi 500 - `/v1/review/check` endpoint**
```
ERROR: API Error: 500 - {"msg":"Lỗi server"}
```

### 2. **Lỗi 500 - `/v1/review/product/[productId]` endpoint**
```
ERROR: API Error: 500 - {"msg":"Lỗi server"}
```

### 3. **Lỗi 500 - `/v1/review/product/[productId]/summary` endpoint**
```
ERROR: API Error: 500 - {"msg":"Lỗi server"}
```

### 4. **Lỗi `[object Object]` trong URL**
```
LOG: Checking for productId: [object Object] orderId: [object Object]
```

## Nguyên nhân và giải pháp

### **Vấn đề chính: Populated Fields**

Backend đang populate các field `product_id`, `order_id`, và `user_id` thành object thay vì giữ nguyên string ID. Điều này gây ra lỗi khi frontend cố gắng sử dụng chúng làm string.

## Backend cần sửa:

### 1. **Sửa endpoint `/v1/review/check`**

```javascript
// router/reviewRouter.js
router.get('/check', auth, async (req, res) => {
  try {
    const { productId, orderId } = req.query;
    const userId = req.user.id;
    
    // Validate input
    if (!productId || !orderId) {
      return res.status(400).json({ msg: 'Thiếu productId hoặc orderId' });
    }
    
    const review = await Review.findOne({
      product_id: productId,
      order_id: orderId,
      user_id: userId,
      is_deleted: false
    }).populate('user_id', 'name avatar')
      .populate('product_id', 'title image')
      .populate('order_id', 'order_code');
    
    if (!review) {
      return res.status(404).json({ msg: 'Không tìm thấy đánh giá' });
    }
    
    res.json(review);
  } catch (error) {
    console.error('Error checking user review:', error);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});
```

### 2. **Sửa endpoint `/v1/review/product/:productId`**

```javascript
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate productId
    if (!productId) {
      return res.status(400).json({ msg: 'Thiếu productId' });
    }
    
    const reviews = await Review.find({
      product_id: productId,
      is_deleted: false
    })
    .populate('user_id', 'name avatar')
    .populate('product_id', 'title image')
    .populate('order_id', 'order_code')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Review.countDocuments({
      product_id: productId,
      is_deleted: false
    });
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting product reviews:', error);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});
```

### 3. **Sửa endpoint `/v1/review/product/:productId/summary`**

```javascript
router.get('/product/:productId/summary', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate productId
    if (!productId) {
      return res.status(400).json({ msg: 'Thiếu productId' });
    }
    
    const reviews = await Review.find({
      product_id: productId,
      is_deleted: false
    });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingCounts[review.rating]++;
    });
    
    res.json({
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCounts
    });
  } catch (error) {
    console.error('Error getting review summary:', error);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});
```

### 4. **Sửa endpoint `/v1/review/user`**

```javascript
router.get('/user', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    
    const reviews = await Review.find({
      user_id: userId,
      is_deleted: false
    })
    .populate('user_id', 'name avatar')
    .populate('product_id', 'title image')
    .populate('order_id', 'order_code')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
    
    // Add timeAgo to each review
    const reviewsWithTimeAgo = reviews.map(review => {
      const timeAgo = getTimeAgo(review.createdAt);
      return { ...review.toObject(), timeAgo };
    });
    
    const total = await Review.countDocuments({
      user_id: userId,
      is_deleted: false
    });
    
    res.json({
      reviews: reviewsWithTimeAgo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});

// Helper function for timeAgo
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} năm trước`;
}
```

## Frontend đã sửa:

### 1. **Tạo utility functions** (`utils/reviewUtils.ts`)
- `extractId()`: Extract ID từ field có thể là string hoặc object
- `getProductId()`, `getOrderId()`, `getUserId()`: Extract ID từ review
- `getUserName()`, `getUserAvatar()`, `getProductTitle()`: Get data từ populated fields

### 2. **Cập nhật interface Review**
- Cho phép `product_id`, `order_id`, `user_id` có thể là string hoặc object
- Hỗ trợ cả populated và non-populated data

### 3. **Cập nhật components**
- `MyReviewsScreen`: Sử dụng utility functions để extract ID
- `ReviewCard`: Sử dụng utility functions để display user data
- `ProductReviewsScreen`: Sử dụng utility functions để check ownership

## Testing Checklist

Sau khi backend sửa xong, kiểm tra:

- [ ] `/v1/review/check` trả về 200 thay vì 500
- [ ] `/v1/review/product/:productId` trả về reviews thay vì 500
- [ ] `/v1/review/product/:productId/summary` trả về summary thay vì 500
- [ ] `/v1/review/user` trả về user reviews với timeAgo
- [ ] Edit review từ "My Reviews" screen hoạt động
- [ ] Single product orders tự động skip selection screen
- [ ] Multiple product orders hiển thị selection screen
- [ ] Review form tự động mở khi edit mode

## Lưu ý quan trọng

1. **Consistent Data Structure**: Backend nên luôn populate các field cần thiết
2. **Error Handling**: Thêm proper error handling cho tất cả endpoints
3. **Validation**: Validate input parameters trước khi query database
4. **Logging**: Thêm detailed logging để debug issues
5. **Performance**: Sử dụng proper indexing cho các field thường query 