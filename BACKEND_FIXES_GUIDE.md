# 🔧 Backend Fixes Guide

## 🚨 **Các lỗi cần sửa trên Backend**

### **1. Order Creation Error - Location Type Validation**

**Lỗi:** `Order validation failed: shipping_address_snapshot.location.type: Cast to Object failed for value "Point" (type string)`

**Nguyên nhân:** Backend schema mong đợi `location.type` là object `{ type: "Point" }` nhưng frontend gửi string `"Point"`.

**File cần sửa:** `models/Order.js` hoặc `schemas/Order.js`

**Giải pháp:**

```javascript
// Trước khi sửa (schema hiện tại)
shipping_address_snapshot: {
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  }
}

// Sau khi sửa (schema mới)
shipping_address_snapshot: {
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  }
}
```

**Middleware để fix data trước khi save:**

```javascript
// Thêm vào Order schema
OrderSchema.pre('save', function(next) {
  // Fix location type if it's a string
  if (this.shipping_address_snapshot && 
      this.shipping_address_snapshot.location && 
      typeof this.shipping_address_snapshot.location.type === 'string') {
    this.shipping_address_snapshot.location.type = this.shipping_address_snapshot.location.type;
  }
  next();
});
```

### **2. Shipping API Endpoint Missing**

**Lỗi:** `Error calling shipping API: [AxiosError: Request failed with status code 400]` với message "Address ID is required"

**Nguyên nhân:** Endpoint `/api/orders/calculate-shipping` không tồn tại hoặc format request sai.

**File cần tạo:** `routes/shipping.js` hoặc thêm vào `routes/orders.js`

**Giải pháp:**

```javascript
// routes/shipping.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// POST /api/orders/calculate-shipping
router.post('/calculate-shipping', auth, async (req, res) => {
  try {
    const { fromAddress, toAddress, weight, carrier } = req.body;
    
    // Validate required fields
    if (!toAddress || !toAddress.address_id) {
      return res.status(400).json({ 
        success: false, 
        msg: "Address ID is required" 
      });
    }
    
    // Get address details from database
    const address = await Address.findById(toAddress.address_id);
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        msg: "Address not found" 
      });
    }
    
    // Calculate shipping fee (implement your logic here)
    const shippingFee = calculateShippingFee(fromAddress, address, weight, carrier);
    
    res.json({
      success: true,
      fees: [
        {
          carrier: carrier || 'GHN',
          service: 'Standard',
          fee: shippingFee,
          estimated_days: 2
        }
      ]
    });
    
  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({ 
      success: false, 
      msg: "Internal server error" 
    });
  }
});

// Helper function to calculate shipping fee
function calculateShippingFee(fromAddress, toAddress, weight, carrier) {
  // Implement your shipping calculation logic here
  // This is a simple example
  const baseFee = 30000; // 30,000 VND base fee
  const weightFee = Math.ceil(weight / 500) * 5000; // 5,000 VND per 500g
  return baseFee + weightFee;
}

module.exports = router;
```

**Thêm route vào app.js:**

```javascript
// app.js hoặc server.js
const shippingRoutes = require('./routes/shipping');
app.use('/api/orders', shippingRoutes);
```

### **3. Address Schema Fix**

**File cần sửa:** `models/Address.js`

**Giải pháp:**

```javascript
// models/Address.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String },
  phone: { type: String },
  street: { type: String },
  province: { type: Object },
  district: { type: Object },
  ward: { type: Object },
  
  // Fix location schema
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },
  
  osm: {
    lat: Number,
    lng: Number,
    displayName: String,
    raw: Object
  },
  
  fullAddress: { type: String },
  isDefault: { type: Boolean, default: false },
  adminType: { type: String, default: 'new' },
  autocomplete34: { type: Object },
  note: { type: String },
}, { timestamps: true });

// Pre-save middleware to fix location type
AddressSchema.pre('save', function(next) {
  // Fix location type if it's a string
  if (this.location && typeof this.location.type === 'string') {
    this.location.type = this.location.type;
  }
  
  // Set location from OSM if not set
  if (this.osm && (this.osm.lat || this.osm.lng) && 
      (!this.location || !this.location.coordinates || this.location.coordinates.length !== 2)) {
    const lat = Number(this.osm.lat);
    const lng = Number(this.osm.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      this.location = { 
        type: 'Point', 
        coordinates: [lng, lat] 
      };
    }
  }
  
  next();
});

module.exports = mongoose.model('Address', AddressSchema);
```

## 🚀 **Các bước thực hiện**

### **Bước 1: Sửa Order Schema**
1. Tìm file `models/Order.js` hoặc `schemas/Order.js`
2. Thêm middleware để fix location type
3. Test tạo order mới

### **Bước 2: Tạo Shipping API Endpoint**
1. Tạo file `routes/shipping.js`
2. Implement endpoint `/api/orders/calculate-shipping`
3. Thêm route vào app.js
4. Test shipping calculation

### **Bước 3: Sửa Address Schema**
1. Tìm file `models/Address.js`
2. Thêm middleware để fix location type
3. Test tạo address mới

### **Bước 4: Test Integration**
1. Test tạo order với address có location
2. Test shipping calculation
3. Kiểm tra không còn lỗi validation

## 📝 **Notes**

- Các fix đều backward compatible
- Không ảnh hưởng đến existing data
- Có thể rollback nếu cần thiết
- Test kỹ trước khi deploy production

## 🔍 **Debug Tips**

1. **Log address data trước khi save:**
```javascript
console.log('Address before save:', JSON.stringify(this, null, 2));
```

2. **Log order data trước khi save:**
```javascript
console.log('Order before save:', JSON.stringify(this, null, 2));
```

3. **Test với Postman:**
```json
POST /api/orders
{
  "address_id": "address_id_here",
  "payment_method": "PAYOS",
  "subtotal": 300000,
  "shipping_fee": 52000,
  "total": 352000
}
```





