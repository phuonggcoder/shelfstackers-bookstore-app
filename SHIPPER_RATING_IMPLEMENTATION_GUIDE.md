# ⭐ Hướng dẫn implement đánh giá shipper cho app user

## 📋 Tóm tắt

Khi đơn hàng đã được giao thành công (`order_status = 'Delivered'`), user có thể đánh giá shipper giao hàng. Hệ thống đã có sẵn model `ShipperRating` và API endpoints.

## 🔄 Luồng đánh giá shipper

### **1. Kiểm tra đơn hàng có thể đánh giá**
```javascript
// Kiểm tra đơn hàng đã giao và chưa đánh giá
GET /api/shipper-ratings/order/:order_id
```

### **2. Lấy danh sách prompts đánh giá**
```javascript
// Lấy các tiêu chí đánh giá có sẵn
GET /api/shipper-ratings/prompts
```

### **3. Tạo đánh giá shipper**
```javascript
// User đánh giá shipper
POST /api/shipper-ratings/rate
```

### **4. Cập nhật/xóa đánh giá (trong 24h)**
```javascript
// Cập nhật đánh giá
PUT /api/shipper-ratings/update/:order_id

// Xóa đánh giá  
DELETE /api/shipper-ratings/delete/:order_id
```

## 🎯 API Endpoints chi tiết

### **1. Lấy prompts đánh giá**
```javascript
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

### **2. Kiểm tra đơn hàng có thể đánh giá**
```javascript
GET /api/shipper-ratings/order/:order_id
Authorization: Bearer <user_token>
```

**Response thành công:**
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

### **3. Tạo đánh giá shipper**
```javascript
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

### **4. Cập nhật đánh giá (trong 24h)**
```javascript
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

### **5. Xóa đánh giá (trong 24h)**
```javascript
DELETE /api/shipper-ratings/delete/:order_id
Authorization: Bearer <user_token>
```

## 🎨 UI/UX Implementation

### **1. Màn hình đánh giá shipper**

```javascript
// Component đánh giá shipper
const ShipperRatingModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Lấy danh sách prompts
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
          'Authorization': `Bearer ${token}`,
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
    <Modal onClose={onClose}>
      <div className="shipper-rating-modal">
        <h3>Đánh giá shipper</h3>
        
        {/* Thông tin đơn hàng */}
        <div className="order-info">
          <p>Đơn hàng: {order.order_id}</p>
          <p>Shipper: {order.assigned_shipper?.full_name}</p>
        </div>

        {/* Rating stars */}
        <div className="rating-stars">
          <label>Đánh giá:</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ⭐
              </button>
            ))}
          </div>
          <span>{rating}/5 sao</span>
        </div>

        {/* Prompts selection */}
        <div className="prompts-section">
          <label>Tiêu chí đánh giá:</label>
          <div className="prompts-grid">
            {prompts.map(prompt => (
              <label key={prompt.id} className="prompt-item">
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
                <span className={`prompt-text ${prompt.type}`}>
                  {prompt.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="comment-section">
          <label>Nhận xét (tùy chọn):</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            maxLength={500}
          />
          <span className="char-count">{comment.length}/500</span>
        </div>

        {/* Anonymous option */}
        <div className="anonymous-section">
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            Đánh giá ẩn danh
          </label>
        </div>

        {/* Submit button */}
        <div className="actions">
          <button onClick={onClose}>Hủy</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || rating === 0}
            className="submit-btn"
          >
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

### **2. CSS Styles**

```css
.shipper-rating-modal {
  padding: 20px;
  max-width: 500px;
}

.order-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.rating-stars {
  margin-bottom: 20px;
}

.stars {
  display: flex;
  gap: 5px;
  margin: 10px 0;
}

.star {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s;
}

.star.active {
  opacity: 1;
}

.prompts-section {
  margin-bottom: 20px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.prompt-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.prompt-text.positive {
  color: #28a745;
}

.prompt-text.negative {
  color: #dc3545;
}

.comment-section {
  margin-bottom: 20px;
}

.comment-section textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.char-count {
  font-size: 12px;
  color: #666;
  text-align: right;
}

.anonymous-section {
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

### **3. Integration với Order Detail**

```javascript
// Trong OrderDetail component
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
        headers: { 'Authorization': `Bearer ${token}` }
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

  const handleRatingSuccess = () => {
    setCanRate(false);
    checkRatingStatus(); // Refresh để lấy rating mới
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
              <div className="rating-display">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={`star ${existingRating.rating >= star ? 'active' : ''}`}>
                      ⭐
                    </span>
                  ))}
                </div>
                <p>{existingRating.comment}</p>
                <div className="prompts-display">
                  {existingRating.selected_prompts.map(prompt => (
                    <span key={prompt} className="prompt-tag">{prompt}</span>
                  ))}
                </div>
                <button onClick={() => setShowRatingModal(true)}>
                  Chỉnh sửa đánh giá
                </button>
              </div>
            </div>
          ) : canRate ? (
            <div className="rate-section">
              <h4>Đánh giá shipper</h4>
              <p>Hãy chia sẻ trải nghiệm của bạn về shipper</p>
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
          existingRating={existingRating}
          onClose={() => setShowRatingModal(false)}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
};
```

## 🧪 Test Script

Tôi sẽ tạo file test riêng cho chức năng đánh giá shipper:

```javascript
// test-shipper-rating.js
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_TOKEN = process.env.USER_TOKEN || 'your_user_token';
const ORDER_ID = process.env.ORDER_ID || 'your_order_id';

async function testShipperRating() {
  console.log('🧪 Testing Shipper Rating System...\n');

  try {
    // 1. Lấy prompts đánh giá
    console.log('1️⃣ Lấy danh sách prompts đánh giá');
    const promptsResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/prompts`);
    console.log('✅ Prompts:', promptsResponse.data.data.length, 'items');
    console.log('Sample prompts:', promptsResponse.data.data.slice(0, 3).map(p => p.text));

    // 2. Kiểm tra trạng thái đánh giá
    console.log('\n2️⃣ Kiểm tra trạng thái đánh giá');
    const statusResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Status response:', statusResponse.data.success);
    if (statusResponse.data.data) {
      console.log('📝 Đã có đánh giá:', statusResponse.data.data.rating, 'sao');
    } else {
      console.log('📝 Chưa có đánh giá');
    }

    // 3. Tạo đánh giá mới
    console.log('\n3️⃣ Tạo đánh giá shipper');
    const ratingData = {
      order_id: ORDER_ID,
      rating: 4.5,
      selected_prompts: ['Giao hàng nhanh chóng', 'Thái độ phục vụ tốt'],
      comment: 'Shipper rất nhiệt tình và giao hàng đúng giờ. Rất hài lòng với dịch vụ!',
      is_anonymous: false
    };

    const createResponse = await axios.post(`${BASE_URL}/api/shipper-ratings/rate`, ratingData, {
      headers: { 
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Tạo đánh giá thành công:', createResponse.data.message);
    console.log('📊 Rating ID:', createResponse.data.data._id);

    // 4. Cập nhật đánh giá
    console.log('\n4️⃣ Cập nhật đánh giá');
    const updateData = {
      rating: 5.0,
      selected_prompts: ['Giao hàng nhanh chóng', 'Thái độ phục vụ tốt', 'Đóng gói cẩn thận'],
      comment: 'Cập nhật: Shipper rất xuất sắc! Giao hàng nhanh và cẩn thận.',
      is_anonymous: false
    };

    const updateResponse = await axios.put(`${BASE_URL}/api/shipper-ratings/update/${ORDER_ID}`, updateData, {
      headers: { 
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Cập nhật đánh giá thành công:', updateResponse.data.message);
    console.log('📊 Rating mới:', updateResponse.data.data.rating, 'sao');

    // 5. Kiểm tra lại trạng thái
    console.log('\n5️⃣ Kiểm tra lại trạng thái đánh giá');
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/shipper-ratings/order/${ORDER_ID}`, {
      headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
    });
    console.log('✅ Final status:', finalStatusResponse.data.data ? 'Có đánh giá' : 'Không có đánh giá');
    if (finalStatusResponse.data.data) {
      console.log('📊 Rating cuối:', finalStatusResponse.data.data.rating, 'sao');
      console.log('💬 Comment:', finalStatusResponse.data.data.comment);
    }

    console.log('\n🎉 Tất cả test đánh giá shipper thành công!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Chạy test
testShipperRating();
```

## 🚀 Deployment Checklist

- [x] **Backend:** API endpoints đã sẵn sàng
- [x] **Model:** ShipperRating schema đã có
- [ ] **Frontend:** Implement UI đánh giá
- [ ] **Frontend:** Integration với Order Detail
- [ ] **Testing:** Test script đánh giá
- [ ] **Validation:** Kiểm tra business rules
- [ ] **Error handling:** Xử lý lỗi đầy đủ
- [ ] **UX:** Loading states và feedback

## 📊 Business Rules

1. **Chỉ đánh giá đơn đã giao:** `order_status = 'Delivered'`
2. **Mỗi đơn chỉ đánh giá 1 lần:** Unique constraint trên `order_id`
3. **Chỉ user mua mới đánh giá:** Kiểm tra `order.user_id`
4. **Cập nhật trong 24h:** Time limit cho edit/delete
5. **Rating từ 1-5:** Validation range
6. **Anonymous option:** User có thể ẩn danh
