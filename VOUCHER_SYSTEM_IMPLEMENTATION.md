# 🎫 Hệ Thống Voucher Đa Loại - Hướng Dẫn Triển Khai

## **📋 Tổng Quan**

Hệ thống voucher mới hỗ trợ **2 loại voucher** và **áp dụng đồng thời**:

### **🔸 Loại Voucher:**
1. **Discount Voucher** - Giảm giá sản phẩm
2. **Shipping Voucher** - Giảm phí vận chuyển

### **🔸 Tính Năng Chính:**
- ✅ Áp dụng đồng thời cả 2 loại voucher
- ✅ Validation chặt chẽ với transaction
- ✅ Tính toán discount chính xác
- ✅ Quản lý usage limit và user limit
- ✅ API đầy đủ cho admin và user

---

## **🏗️ Cấu Trúc Database**

### **Voucher Schema:**
```javascript
{
  voucher_id: String,           // Mã voucher (unique)
  voucher_type: String,         // 'discount' | 'shipping'
  discount_type: String,        // 'fixed' | 'percentage' (chỉ cho discount)
  discount_value: Number,       // Giá trị giảm (chỉ cho discount)
  shipping_discount: Number,    // Giảm phí ship (chỉ cho shipping)
  min_order_value: Number,      // Giá trị đơn hàng tối thiểu
  max_discount_value: Number,   // Giảm tối đa (chỉ cho percentage)
  usage_limit: Number,          // Tổng số lần sử dụng
  usage_count: Number,          // Số lần đã sử dụng
  max_per_user: Number,         // Số lần tối đa mỗi user
  start_date: Date,             // Ngày bắt đầu hiệu lực
  end_date: Date,               // Ngày kết thúc hiệu lực
  used_by: [{                   // Lịch sử sử dụng
    user: ObjectId,
    order: ObjectId,
    used_at: Date,
    discount_amount: Number
  }],
  is_active: Boolean,           // Trạng thái active
  is_deleted: Boolean,          // Soft delete
  description: String           // Mô tả voucher
}
```

---

## **👨‍💼 ADMIN - Quản Lý Voucher**

### **1. Tạo Voucher Mới**

#### **A. Discount Voucher (Giảm Giá)**
```javascript
POST /api/vouchers
{
  "voucher_id": "SUMMER2024",
  "voucher_type": "discount",
  "discount_type": "percentage",     // "fixed" hoặc "percentage"
  "discount_value": 20,              // 20% hoặc 50000 VND
  "min_order_value": 100000,
  "max_discount_value": 50000,       // Chỉ cho percentage
  "usage_limit": 100,
  "max_per_user": 1,
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-12-31T23:59:59.000Z",
  "description": "Giảm 20% tối đa 50k"
}
```

#### **B. Shipping Voucher (Giảm Phí Ship)**
```javascript
POST /api/vouchers
{
  "voucher_id": "FREESHIP",
  "voucher_type": "shipping",
  "shipping_discount": 25000,        // Giảm 25k phí ship
  "min_order_value": 200000,
  "usage_limit": 200,
  "max_per_user": 2,
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-12-31T23:59:59.000Z",
  "description": "Miễn phí ship 25k"
}
```

### **2. Quản Lý Voucher**
```javascript
// Lấy danh sách voucher
GET /api/vouchers?page=1&limit=10&voucher_type=discount&status=active

// Xem chi tiết voucher
GET /api/vouchers/:id

// Cập nhật voucher
PUT /api/vouchers/:id

// Xóa voucher (soft delete)
DELETE /api/vouchers/:id
```

---

## **👤 USER - Sử Dụng Voucher**

### **1. Xem Voucher Khả Dụng**

```javascript
// Lấy tất cả voucher
GET /api/vouchers/available

// Lọc theo loại
GET /api/vouchers/available?voucher_type=discount
GET /api/vouchers/available?voucher_type=shipping

// Sắp xếp theo giá trị giảm
GET /api/vouchers/available?sort=discount_value
GET /api/vouchers/available?sort=shipping_discount
```

**Response:**
```javascript
{
  "success": true,
  "vouchers": [
    {
      "id": "...",
      "voucher_id": "SUMMER2024",
      "voucher_type": "discount",
      "discount_type": "percentage",
      "discount_value": 20,
      "min_order_value": 100000,
      "max_discount_value": 50000,
      "description": "Giảm 20% tối đa 50k",
      "isValid": true,
      "remainingUsage": 95
    },
    {
      "id": "...",
      "voucher_id": "FREESHIP",
      "voucher_type": "shipping",
      "shipping_discount": 25000,
      "min_order_value": 200000,
      "description": "Miễn phí ship 25k",
      "isValid": true,
      "remainingUsage": 150
    }
  ]
}
```

### **2. Validate Voucher Đơn Lẻ**

```javascript
POST /api/vouchers/validate
{
  "voucher_id": "SUMMER2024",
  "user_id": "user123",
  "order_value": 250000
}
```

**Response:**
```javascript
{
  "success": true,
  "valid": true,
  "voucher": {
    "voucher_id": "SUMMER2024",
    "voucher_type": "discount",
    "discount_type": "percentage",
    "discount_value": 20,
    "min_order_value": 100000,
    "max_discount_value": 50000
  },
  "discount_amount": 50000,    // 20% của 250k = 50k (max)
  "final_amount": 200000,      // 250k - 50k
  "message": "Voucher hợp lệ"
}
```

### **3. Validate Nhiều Voucher Cùng Lúc**

```javascript
POST /api/vouchers/validate-multiple
{
  "vouchers": [
    { "voucher_id": "SUMMER2024", "voucher_type": "discount" },
    { "voucher_id": "FREESHIP", "voucher_type": "shipping" }
  ],
  "user_id": "user123",
  "order_value": 250000,
  "shipping_cost": 30000
}
```

**Response:**
```javascript
{
  "success": true,
  "results": [
    {
      "voucher_id": "SUMMER2024",
      "voucher_type": "discount",
      "valid": true,
      "discount_amount": 50000,
      "message": "Voucher hợp lệ"
    },
    {
      "voucher_id": "FREESHIP",
      "voucher_type": "shipping",
      "valid": true,
      "discount_amount": 25000,
      "message": "Voucher hợp lệ"
    }
  ],
  "summary": {
    "order_value": 250000,
    "total_discount": 75000,      // 50k + 25k
    "final_amount": 175000,       // 250k - 75k
    "vouchers_applied": 2
  }
}
```

### **4. Sử Dụng Voucher Đơn Lẻ**

```javascript
POST /api/vouchers/use
{
  "voucher_id": "SUMMER2024",
  "user_id": "user123",
  "order_id": "order456",
  "order_value": 250000
}
```

### **5. Sử Dụng Nhiều Voucher Cùng Lúc**

```javascript
POST /api/vouchers/use-multiple
{
  "vouchers": [
    { "voucher_id": "SUMMER2024", "voucher_type": "discount" },
    { "voucher_id": "FREESHIP", "voucher_type": "shipping" }
  ],
  "user_id": "user123",
  "order_id": "order456",
  "order_value": 250000,
  "shipping_cost": 30000
}
```

**Response:**
```javascript
{
  "success": true,
  "vouchers_used": [
    {
      "voucher_id": "SUMMER2024",
      "voucher_type": "discount",
      "discount_amount": 50000
    },
    {
      "voucher_id": "FREESHIP",
      "voucher_type": "shipping",
      "discount_amount": 25000
    }
  ],
  "order": {
    "id": "order456",
    "total_amount": 250000,
    "total_discount": 75000,
    "final_amount": 175000,
    "vouchers_applied": ["SUMMER2024", "FREESHIP"]
  },
  "message": "Các voucher đã được áp dụng thành công"
}
```

### **6. Xem Lịch Sử Sử Dụng**

```javascript
GET /api/vouchers/my-usage/user123?page=1&limit=10
```

---

## **🧮 Logic Tính Toán Discount**

### **1. Discount Voucher**

#### **A. Percentage Discount:**
```javascript
// Ví dụ: 20% tối đa 50k
discount_amount = Math.min(
  (order_value * discount_value) / 100,  // 20% của order
  max_discount_value                      // Tối đa 50k
);
```

#### **B. Fixed Discount:**
```javascript
// Ví dụ: Giảm cố định 30k
discount_amount = discount_value; // 30k
```

### **2. Shipping Voucher**
```javascript
// Ví dụ: Giảm ship 25k
discount_amount = Math.min(
  shipping_discount,  // 25k
  shipping_cost       // Phí ship thực tế
);
```

### **3. Áp Dụng Nhiều Voucher**
```javascript
total_discount = discount_voucher_amount + shipping_voucher_amount;
final_amount = order_value - total_discount;
```

---

## **✅ Validation Rules**

### **1. Điều Kiện Chung:**
- ✅ Voucher phải active và chưa bị xóa
- ✅ Trong thời gian hiệu lực (start_date ≤ now ≤ end_date)
- ✅ Chưa hết lượt sử dụng (usage_count < usage_limit)
- ✅ Đơn hàng đạt giá trị tối thiểu (order_value ≥ min_order_value)

### **2. Điều Kiện User:**
- ✅ User chưa sử dụng hết lượt (user_usage < max_per_user)
- ✅ User đã đăng nhập (có user_id)

### **3. Điều Kiện Áp Dụng Đồng Thời:**
- ✅ Có thể áp dụng 1 discount + 1 shipping voucher
- ✅ Không thể áp dụng 2 discount hoặc 2 shipping cùng lúc
- ✅ Tất cả voucher phải hợp lệ

---

## **🔧 Frontend Integration**

### **1. Component Voucher Selection**

```javascript
const VoucherSelector = ({ orderValue, onVouchersSelected }) => {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  
  // Lấy voucher khả dụng
  useEffect(() => {
    fetchAvailableVouchers();
  }, [orderValue]);
  
  // Validate và áp dụng voucher
  const applyVouchers = async () => {
    if (selectedVouchers.length === 0) return;
    
    const result = await validateMultipleVouchers(selectedVouchers, orderValue);
    if (result.success) {
      onVouchersSelected(result.data);
    }
  };
  
  return (
    <div>
      <h3>Chọn Voucher</h3>
      
      {/* Discount Vouchers */}
      <div>
        <h4>Giảm Giá Sản Phẩm</h4>
        {availableVouchers
          .filter(v => v.voucher_type === 'discount')
          .map(voucher => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              onSelect={() => selectVoucher(voucher)}
            />
          ))}
      </div>
      
      {/* Shipping Vouchers */}
      <div>
        <h4>Giảm Phí Vận Chuyển</h4>
        {availableVouchers
          .filter(v => v.voucher_type === 'shipping')
          .map(voucher => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              onSelect={() => selectVoucher(voucher)}
            />
          ))}
      </div>
      
      <button onClick={applyVouchers}>Áp Dụng Voucher</button>
    </div>
  );
};
```

### **2. Checkout Summary**

```javascript
const CheckoutSummary = ({ orderValue, selectedVouchers, shippingCost }) => {
  const [summary, setSummary] = useState(null);
  
  useEffect(() => {
    if (selectedVouchers.length > 0) {
      calculateVoucherSummary();
    }
  }, [selectedVouchers, orderValue, shippingCost]);
  
  return (
    <div className="checkout-summary">
      <h3>Tổng Đơn Hàng</h3>
      
      <div className="price-breakdown">
        <p>Giá sản phẩm: {orderValue.toLocaleString()} VND</p>
        <p>Phí vận chuyển: {shippingCost.toLocaleString()} VND</p>
        
        {summary && (
          <>
            <p>Giảm giá: -{summary.total_discount.toLocaleString()} VND</p>
            <p className="total">
              Tổng cộng: {summary.final_amount.toLocaleString()} VND
            </p>
          </>
        )}
      </div>
      
      {selectedVouchers.length > 0 && (
        <div className="applied-vouchers">
          <h4>Voucher đã áp dụng:</h4>
          {selectedVouchers.map(voucher => (
            <span key={voucher.voucher_id} className="voucher-tag">
              {voucher.voucher_id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## **🚀 Deployment Checklist**

### **1. Database Migration:**
- [ ] Backup database hiện tại
- [ ] Cập nhật voucher schema
- [ ] Tạo indexes mới
- [ ] Test với dữ liệu thực

### **2. API Testing:**
- [ ] Test tạo voucher mới
- [ ] Test validate voucher
- [ ] Test sử dụng voucher
- [ ] Test áp dụng nhiều voucher
- [ ] Test các trường hợp lỗi

### **3. Frontend Integration:**
- [ ] Cập nhật voucher selector
- [ ] Cập nhật checkout flow
- [ ] Test UI/UX
- [ ] Test responsive design

### **4. Production:**
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor logs
- [ ] Test end-to-end

---

## **📊 Monitoring & Analytics**

### **1. Metrics Cần Theo Dõi:**
- Số lượng voucher được tạo
- Tỷ lệ voucher được sử dụng
- Tổng giá trị giảm giá
- Voucher nào hiệu quả nhất
- User behavior với voucher

### **2. Logs Cần Monitor:**
- Voucher validation errors
- Transaction failures
- Performance metrics
- User complaints

---

## **🎯 Best Practices**

### **1. Admin:**
- Tạo voucher với thời gian hợp lý
- Đặt usage limit phù hợp
- Monitor hiệu quả voucher
- Clean up voucher cũ

### **2. User:**
- Kiểm tra điều kiện trước khi chọn
- Sử dụng voucher đúng thời điểm
- Không spam voucher
- Báo cáo lỗi nếu có

### **3. Developer:**
- Validate input chặt chẽ
- Sử dụng transaction cho consistency
- Log đầy đủ cho debugging
- Test edge cases

---

## **🔧 API Endpoints Summary**

### **Admin Endpoints:**
- `POST /api/vouchers` - Tạo voucher mới
- `GET /api/vouchers` - Lấy danh sách voucher
- `GET /api/vouchers/:id` - Xem chi tiết voucher
- `PUT /api/vouchers/:id` - Cập nhật voucher
- `DELETE /api/vouchers/:id` - Xóa voucher

### **User Endpoints:**
- `GET /api/vouchers/available` - Lấy voucher khả dụng
- `POST /api/vouchers/validate` - Validate voucher đơn lẻ
- `POST /api/vouchers/validate-multiple` - Validate nhiều voucher
- `POST /api/vouchers/use` - Sử dụng voucher đơn lẻ
- `POST /api/vouchers/use-multiple` - Sử dụng nhiều voucher
- `GET /api/vouchers/my-usage/:user_id` - Lịch sử sử dụng

---

## **📱 Frontend Components**

### **Components Available:**
- `VoucherSelector.tsx` - Chọn voucher
- `VoucherCard.tsx` - Hiển thị voucher
- `VoucherSummary.tsx` - Tóm tắt voucher
- `VoucherUsageHistory.tsx` - Lịch sử sử dụng
- `VoucherValidationPopup.tsx` - Popup validation

### **Services Available:**
- `voucherService.ts` - API calls
- Validation functions
- Type definitions

---

**🎉 Hệ thống voucher mới đã sẵn sàng sử dụng với khả năng áp dụng đồng thời nhiều loại voucher!**
