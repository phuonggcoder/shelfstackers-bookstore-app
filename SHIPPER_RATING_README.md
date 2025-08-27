# ⭐ Shipper Rating System - Hướng dẫn sử dụng

## 📋 Tóm tắt

Hệ thống đánh giá shipper cho phép user đánh giá shipper sau khi đơn hàng đã được giao thành công. Hệ thống đã có sẵn backend API và cần implement frontend.

## 🚀 Quick Start

### **1. Test với Node.js script**

```bash
# Set environment variables
$env:BASE_URL='http://localhost:3000'
$env:USER_TOKEN='your_user_jwt_token'
$env:ORDER_ID='your_delivered_order_id'

# Chạy test
node test-shipper-rating.js
```

### **2. Test với Postman**

1. Import file `postman/shipper_rating.postman_collection.json`
2. Set variables:
   - `BASE_URL`: http://localhost:3000
   - `USER_TOKEN`: JWT token của user
   - `ORDER_ID`: ID đơn hàng đã giao
   - `SHIPPER_ID`: ID của shipper (lấy từ order)

3. Chạy các requests theo thứ tự:
   - Get Rating Prompts
   - Check Rating Status
   - Create Shipper Rating
   - Update Shipper Rating
   - Get Shipper Stats

## 📱 Frontend Implementation

### **1. Component đánh giá shipper**

```javascript
import React, { useState, useEffect } from 'react';

const ShipperRatingModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/shipper-ratings/prompts');
      const data = await response.json();
      setPrompts(data.data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shipper-ratings/rate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: order._id,
          rating,
          selected_prompts: selectedPrompts,
          comment,
          is_anonymous: isAnonymous
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Đánh giá shipper</h3>
        
        {/* Rating stars */}
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`star ${rating >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
            >
              ⭐
            </button>
          ))}
          <span>{rating}/5 sao</span>
        </div>

        {/* Prompts */}
        <div className="prompts">
          {prompts.map(prompt => (
            <label key={prompt.id}>
              <input
                type="checkbox"
                checked={selectedPrompts.includes(prompt.text)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPrompts([...selectedPrompts, prompt.text]);
                  } else {
                    setSelectedPrompts(selectedPrompts.filter(p => p !== prompt.text));
                  }
                }}
              />
              <span className={prompt.type}>{prompt.text}</span>
            </label>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          maxLength={500}
        />

        {/* Anonymous */}
        <label>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          Đánh giá ẩn danh
        </label>

        {/* Actions */}
        <div className="actions">
          <button onClick={onClose}>Hủy</button>
          <button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipperRatingModal;
```

### **2. Integration với Order Detail**

```javascript
const OrderDetail = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    fetchOrder();
    checkRatingStatus();
  }, [orderId]);

  const checkRatingStatus = async () => {
    try {
      const response = await fetch(`/api/shipper-ratings/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.data) {
          setExistingRating(data.data);
        } else {
          setCanRate(true);
        }
      }
    } catch (error) {
      console.error('Error checking rating status:', error);
    }
  };

  return (
    <div className="order-detail">
      {/* Order info */}
      
      {/* Rating section */}
      {order?.order_status === 'Delivered' && (
        <div className="rating-section">
          {existingRating ? (
            <div className="existing-rating">
              <h4>Đánh giá của bạn</h4>
              <div className="stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={`star ${existingRating.rating >= star ? 'active' : ''}`}>
                    ⭐
                  </span>
                ))}
              </div>
              <p>{existingRating.comment}</p>
              <button onClick={() => setShowRatingModal(true)}>
                Chỉnh sửa đánh giá
              </button>
            </div>
          ) : canRate ? (
            <div className="rate-section">
              <h4>Đánh giá shipper</h4>
              <button onClick={() => setShowRatingModal(true)}>
                Đánh giá ngay
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <ShipperRatingModal
          order={order}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => {
            setCanRate(false);
            checkRatingStatus();
          }}
        />
      )}
    </div>
  );
};
```

## 🧪 Testing

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

### **Manual Testing:**

```bash
# 1. Test tạo đánh giá
curl -X POST "http://localhost:3000/api/shipper-ratings/rate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID",
    "rating": 4.5,
    "selected_prompts": ["Giao hàng nhanh chóng"],
    "comment": "Test comment",
    "is_anonymous": false
  }'

# 2. Test kiểm tra trạng thái
curl -X GET "http://localhost:3000/api/shipper-ratings/order/ORDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test cập nhật
curl -X PUT "http://localhost:3000/api/shipper-ratings/update/ORDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5.0,
    "comment": "Updated comment"
  }'
```

## 📊 Business Rules

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

## 🔧 Configuration

### **Environment Variables:**

```bash
# Backend
BASE_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret

# Frontend
REACT_APP_API_URL=http://localhost:3000
```

### **Database Indexes:**

```javascript
// ShipperRating model indexes
shipperRatingSchema.index({ shipper_id: 1, created_at: -1 });
shipperRatingSchema.index({ user_id: 1 });
shipperRatingSchema.index({ order_id: 1 }, { unique: true });
```

## 📈 Monitoring

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

## 🚀 Deployment

### **Checklist:**

- [x] **Backend API:** Đã sẵn sàng
- [x] **Database Schema:** Đã có
- [x] **Test Scripts:** Đã tạo
- [ ] **Frontend Components:** Cần implement
- [ ] **Error Handling:** Cần test
- [ ] **Performance:** Cần optimize
- [ ] **Security:** Cần review
- [ ] **Documentation:** Đã có

### **Files đã tạo:**

- `SHIPPER_RATING_IMPLEMENTATION_GUIDE.md` - Hướng dẫn chi tiết
- `test-shipper-rating.js` - Test script
- `postman/shipper_rating.postman_collection.json` - Postman collection
- `SHIPPER_RATING_README.md` - File này
