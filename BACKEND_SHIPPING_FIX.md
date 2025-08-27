# 🔧 Backend Shipping API Fix Guide

## ❌ **Vấn đề hiện tại:**

Backend vẫn báo lỗi "Address ID is required" mặc dù frontend đã gửi đúng format.

## 🔍 **Nguyên nhân:**

1. **Address ID extraction logic** chưa handle đúng format `toAddress.address_id`
2. **Backend debug logs** chưa đủ chi tiết để track request format
3. **Address lookup** chưa hoạt động đúng khi chỉ có `address_id`

## 🛠️ **Giải pháp:**

### **1. Cập nhật Backend Shipping Router**

**File:** `router/shipping.js`

**Thêm debug logs chi tiết:**

```javascript
router.post('/calculate-shipping', async (req, res) => {
  try {
    console.log('🚀 Shipping API Request Received:');
    console.log('  - Request body:', JSON.stringify(req.body, null, 2));
    console.log('  - Headers:', JSON.stringify(req.headers, null, 2));
    
    const { fromAddress, toAddress, weight, carrier } = req.body;
    
    console.log('📦 Request Parameters:');
    console.log('  - fromAddress:', JSON.stringify(fromAddress, null, 2));
    console.log('  - toAddress:', JSON.stringify(toAddress, null, 2));
    console.log('  - weight:', weight);
    console.log('  - carrier:', carrier);
    
    // Enhanced address_id extraction
    let addressId = null;
    
    // Check multiple possible locations for address_id
    if (toAddress && toAddress.address_id) {
      addressId = toAddress.address_id;
      console.log('✅ Found address_id in toAddress.address_id:', addressId);
    } else if (req.body.address_id) {
      addressId = req.body.address_id;
      console.log('✅ Found address_id in req.body.address_id:', addressId);
    } else if (toAddress && toAddress._id) {
      addressId = toAddress._id;
      console.log('✅ Found address_id in toAddress._id:', addressId);
    } else {
      console.log('❌ No address_id found in any location');
      return res.status(400).json({ msg: "Address ID is required" });
    }
    
    console.log('📍 Final address_id:', addressId);
    
    // Fetch address from database
    const address = await Address.findById(addressId);
    if (!address) {
      console.log('❌ Address not found in database:', addressId);
      return res.status(404).json({ msg: "Address not found" });
    }
    
    console.log('✅ Address found:', {
      id: address._id,
      fullAddress: address.fullAddress,
      coordinates: address.location?.coordinates,
      osm: address.osm
    });
    
    // Continue with shipping calculation...
    
  } catch (error) {
    console.error('❌ Shipping API Error:', error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
```

### **2. Cập nhật Address Model**

**File:** `model/address.js`

**Đảm bảo address có đầy đủ thông tin:**

```javascript
// Pre-save middleware to ensure coordinates
addressSchema.pre('save', function(next) {
  // Ensure location type is object
  if (this.location && typeof this.location.type === 'string') {
    this.location.type = { type: this.location.type };
  }
  
  // Ensure coordinates are available
  if (!this.location || !this.location.coordinates) {
    // Set default coordinates if not available
    this.location = {
      type: { type: 'Point' },
      coordinates: [105.8542, 21.0285] // Hà Nội coordinates
    };
  }
  
  next();
});
```

### **3. Test Backend Fixes**

**Tạo test script:**

```javascript
// test/test-shipping-api.js
const axios = require('axios');

const testShippingAPI = async () => {
  try {
    const request = {
      fromAddress: {
        street: "ShelfStackers Store",
        ward: "Phường Bách Khoa",
        district: "Quận Hai Bà Trưng",
        province: "Hà Nội",
        latitude: 21.0285,
        longitude: 105.8542
      },
      toAddress: {
        address_id: "68ac36af597d6c37cb3f9c5b" // Use real address ID
      },
      weight: 0.5,
      carrier: "GHN"
    };
    
    console.log('🧪 Testing Shipping API...');
    console.log('Request:', JSON.stringify(request, null, 2));
    
    const response = await axios.post(
      'https://server-shelf-stacker-w1ds.onrender.com/api/orders/calculate-shipping',
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

testShippingAPI();
```

## 🎯 **Kết quả mong đợi:**

### **✅ Backend Logs:**
```
🚀 Shipping API Request Received:
  - Request body: { "fromAddress": {...}, "toAddress": {"address_id": "68ac36af597d6c37cb3f9c5b"}, "weight": 0.5, "carrier": "GHN" }
  - Headers: {...}

📦 Request Parameters:
  - fromAddress: {...}
  - toAddress: {"address_id": "68ac36af597d6c37cb3f9c5b"}
  - weight: 0.5
  - carrier: GHN

✅ Found address_id in toAddress.address_id: 68ac36af597d6c37cb3f9c5b
📍 Final address_id: 68ac36af597d6c37cb3f9c5b

✅ Address found: {
  id: "68ac36af597d6c37cb3f9c5b",
  fullAddress: "gggggg, Phường Tân Thới Hiệp, Quận 12, Thành phố Hồ Chí Minh",
  coordinates: [106.63419663906097, 10.872930110135044],
  osm: {...}
}
```

### **✅ API Response:**
```json
{
  "success": true,
  "fees": [
    {
      "carrier": "GHN",
      "service": "Giao hàng nhanh",
      "fee": 30000,
      "estimatedDays": 2,
      "note": "Giao hàng nhanh"
    }
  ]
}
```

## 📋 **Checklist:**

- [ ] Cập nhật backend shipping router với debug logs
- [ ] Test address_id extraction logic
- [ ] Verify address lookup từ database
- [ ] Test shipping calculation với real coordinates
- [ ] Deploy backend fixes
- [ ] Test lại từ frontend

## 🚨 **Lưu ý:**

1. **Backend logs** sẽ hiển thị chi tiết request format
2. **Address lookup** sẽ fetch đầy đủ address data từ database
3. **Shipping calculation** sẽ sử dụng real coordinates thay vì fallback
4. **Frontend** không cần thay đổi gì thêm

**Vấn đề chính là ở backend - cần cập nhật address_id extraction logic!**
