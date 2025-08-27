# 🎫 Voucher System Integration Guide

## **📋 Tổng Quan**

Hướng dẫn tích hợp hệ thống voucher đa loại vào ứng dụng hiện tại.

---

## **🏗️ Backend Integration**

### **1. Database Setup**

#### **A. Voucher Model**
```javascript
// server/models/voucher.js
const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
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
}, {
  timestamps: true
});
```

#### **B. Routes Setup**
```javascript
// server/routes/voucher.js
const express = require('express');
const router = express.Router();
const Voucher = require('../models/voucher');
const auth = require('../middleware/auth');

// Admin routes
router.post('/', auth, isAdmin, createVoucher);
router.get('/', auth, isAdmin, getVouchers);
router.get('/:id', auth, isAdmin, getVoucherById);
router.put('/:id', auth, isAdmin, updateVoucher);
router.delete('/:id', auth, isAdmin, deleteVoucher);

// User routes
router.get('/available', getAvailableVouchers);
router.post('/validate', validateVoucher);
router.post('/validate-multiple', validateMultipleVouchers);
router.post('/use', useVoucher);
router.post('/use-multiple', useMultipleVouchers);
router.get('/my-usage/:user_id', getUserVoucherUsage);
```

#### **C. Server Integration**
```javascript
// server/index.js
const voucherRoutes = require('./routes/voucher');

// Add voucher routes
app.use('/api/vouchers', voucherRoutes);
```

### **2. API Endpoints**

#### **Admin Endpoints:**
- `POST /api/vouchers` - Tạo voucher mới
- `GET /api/vouchers` - Lấy danh sách voucher
- `GET /api/vouchers/:id` - Xem chi tiết voucher
- `PUT /api/vouchers/:id` - Cập nhật voucher
- `DELETE /api/vouchers/:id` - Xóa voucher

#### **User Endpoints:**
- `GET /api/vouchers/available` - Lấy voucher khả dụng
- `POST /api/vouchers/validate` - Validate voucher đơn lẻ
- `POST /api/vouchers/validate-multiple` - Validate nhiều voucher
- `POST /api/vouchers/use` - Sử dụng voucher đơn lẻ
- `POST /api/vouchers/use-multiple` - Sử dụng nhiều voucher
- `GET /api/vouchers/my-usage/:user_id` - Lịch sử sử dụng

---

## **📱 Frontend Integration**

### **1. Service Layer**

#### **A. Voucher Service**
```typescript
// services/voucherService.ts
import axios from 'axios';
import { getApiUrl, getAuthHeaders } from '../config/api';

export type VoucherType = 'discount' | 'shipping';
export type DiscountType = 'fixed' | 'percentage';

export interface Voucher {
  _id: string;
  voucher_id: string;
  voucher_type: VoucherType;
  discount_type?: DiscountType;
  discount_value?: number;
  shipping_discount?: number;
  min_order_value: number;
  max_discount_value?: number;
  usage_limit: number;
  usage_count: number;
  max_per_user: number;
  start_date: string;
  end_date: string;
  used_by: Array<{
    user: string;
    order: string;
    used_at: string;
    discount_amount: number;
  }>;
  is_active: boolean;
  is_deleted: boolean;
  description: string;
  isValid?: boolean;
  remainingUsage?: number;
}

// API functions
export const getAvailableVouchers = async (token: string, minOrderValue?: number) => {
  // Implementation
};

export const validateMultipleVouchers = async (token: string, request: MultipleVoucherValidationRequest) => {
  // Implementation
};

export const useMultipleVouchers = async (token: string, request: MultipleVoucherUsageRequest) => {
  // Implementation
};
```

### **2. Components Integration**

#### **A. Voucher Selector**
```typescript
// components/VoucherSelector.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvailableVouchers, validateMultipleVouchers } from '../services/voucherService';

interface VoucherSelectorProps {
  orderValue: number;
  shippingCost: number;
  onVouchersSelected: (result: MultipleVoucherValidationResponse) => void;
  onClose: () => void;
  visible: boolean;
}

const VoucherSelector: React.FC<VoucherSelectorProps> = ({
  orderValue,
  shippingCost,
  onVouchersSelected,
  onClose,
  visible,
}) => {
  const { user, token } = useAuth();
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<SelectedVoucher[]>([]);

  useEffect(() => {
    if (visible && token) {
      fetchAvailableVouchers();
    }
  }, [visible, orderValue, token]);

  const fetchAvailableVouchers = async () => {
    if (!token) return;
    
    try {
      const result = await getAvailableVouchers(token, orderValue);
      setAvailableVouchers(result.vouchers || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  const applyVouchers = async () => {
    if (selectedVouchers.length === 0) return;

    if (!user?._id || !token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để sử dụng voucher');
      return;
    }

    try {
      const request: MultipleVoucherValidationRequest = {
        vouchers: selectedVouchers,
        user_id: user._id,
        order_value: orderValue,
        shipping_cost: shippingCost,
      };

      const result = await validateMultipleVouchers(token, request);
      
      if (result.success) {
        onVouchersSelected(result);
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể áp dụng voucher');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {/* Voucher selection UI */}
    </Modal>
  );
};
```

#### **B. Checkout Integration**
```typescript
// screens/CheckoutScreen.tsx
import React, { useState } from 'react';
import VoucherSelector from '../components/VoucherSelector';
import { useMultipleVouchers } from '../services/voucherService';

const CheckoutScreen: React.FC = () => {
  const [selectedVouchers, setSelectedVouchers] = useState<MultipleVoucherValidationResponse | null>(null);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const { user, token } = useAuth();

  const handleVouchersSelected = (result: MultipleVoucherValidationResponse) => {
    setSelectedVouchers(result);
  };

  const handleCheckout = async () => {
    if (!selectedVouchers || !user?._id || !token) return;

    try {
      const request: MultipleVoucherUsageRequest = {
        vouchers: selectedVouchers.results
          .filter(r => r.valid)
          .map(r => ({ voucher_id: r.voucher_id, voucher_type: r.voucher_type })),
        user_id: user._id,
        order_id: orderId,
        order_value: orderValue,
        shipping_cost: shippingCost,
      };

      const result = await useMultipleVouchers(token, request);
      
      if (result.success) {
        // Proceed with checkout
        navigation.navigate('Payment', { 
          orderData: result.order,
          vouchersApplied: result.vouchers_used 
        });
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể hoàn tất đơn hàng');
    }
  };

  return (
    <View style={styles.container}>
      {/* Order summary */}
      <View style={styles.orderSummary}>
        <Text style={styles.sectionTitle}>Tổng đơn hàng</Text>
        
        <View style={styles.priceRow}>
          <Text>Giá sản phẩm:</Text>
          <Text>{orderValue.toLocaleString('vi-VN')} VNĐ</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text>Phí vận chuyển:</Text>
          <Text>{shippingCost.toLocaleString('vi-VN')} VNĐ</Text>
        </View>
        
        {selectedVouchers && (
          <View style={styles.priceRow}>
            <Text>Giảm giá:</Text>
            <Text style={styles.discountText}>
              -{selectedVouchers.summary.total_discount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        )}
        
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>
            {(selectedVouchers ? selectedVouchers.summary.final_amount : orderValue + shippingCost).toLocaleString('vi-VN')} VNĐ
          </Text>
        </View>
      </View>

      {/* Voucher section */}
      <TouchableOpacity 
        style={styles.voucherButton}
        onPress={() => setShowVoucherSelector(true)}
      >
        <Ionicons name="ticket" size={20} color="#3255FB" />
        <Text style={styles.voucherButtonText}>
          {selectedVouchers ? 'Thay đổi voucher' : 'Chọn voucher'}
        </Text>
      </TouchableOpacity>

      {selectedVouchers && (
        <View style={styles.appliedVouchers}>
          <Text style={styles.appliedTitle}>Voucher đã áp dụng:</Text>
          {selectedVouchers.results
            .filter(r => r.valid)
            .map((result, index) => (
              <Text key={index} style={styles.appliedVoucher}>
                • {result.voucher_id} (-{result.discount_amount.toLocaleString('vi-VN')} VNĐ)
              </Text>
            ))}
        </View>
      )}

      {/* Checkout button */}
      <TouchableOpacity 
        style={styles.checkoutButton}
        onPress={handleCheckout}
      >
        <Text style={styles.checkoutButtonText}>Thanh toán</Text>
      </TouchableOpacity>

      {/* Voucher Selector Modal */}
      <VoucherSelector
        orderValue={orderValue}
        shippingCost={shippingCost}
        onVouchersSelected={handleVouchersSelected}
        onClose={() => setShowVoucherSelector(false)}
        visible={showVoucherSelector}
      />
    </View>
  );
};
```

### **3. Order Model Update**

#### **A. Update Order Schema**
```javascript
// server/models/order.js
const orderSchema = new mongoose.Schema({
  // ... existing fields
  
  // Add voucher fields
  vouchers_applied: [{
    voucher_id: String,
    voucher_type: String,
    discount_amount: Number
  }],
  
  total_discount: {
    type: Number,
    default: 0
  },
  
  final_amount: {
    type: Number,
    required: true
  }
});
```

#### **B. Update Order Creation**
```javascript
// server/routes/orders.js
router.post('/', auth, async (req, res) => {
  try {
    const { items, vouchers, shipping_address, payment_method } = req.body;
    
    // Calculate order value
    const orderValue = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = calculateShippingCost(shipping_address);
    
    let finalAmount = orderValue + shippingCost;
    let appliedVouchers = [];
    
    // Apply vouchers if provided
    if (vouchers && vouchers.length > 0) {
      const voucherRequest = {
        vouchers: vouchers,
        user_id: req.user._id,
        order_value: orderValue,
        shipping_cost: shippingCost
      };
      
      const voucherResult = await validateMultipleVouchers(voucherRequest);
      
      if (voucherResult.success) {
        finalAmount = voucherResult.summary.final_amount;
        appliedVouchers = voucherResult.results
          .filter(r => r.valid)
          .map(r => ({
            voucher_id: r.voucher_id,
            voucher_type: r.voucher_type,
            discount_amount: r.discount_amount
          }));
      }
    }
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items,
      shipping_address,
      payment_method,
      total_amount: orderValue,
      shipping_cost: shippingCost,
      total_discount: orderValue + shippingCost - finalAmount,
      final_amount: finalAmount,
      vouchers_applied: appliedVouchers,
      status: 'pending'
    });
    
    await order.save();
    
    // Use vouchers if applied
    if (appliedVouchers.length > 0) {
      await useMultipleVouchers({
        vouchers: vouchers,
        user_id: req.user._id,
        order_id: order._id,
        order_value: orderValue,
        shipping_cost: shippingCost
      });
    }
    
    res.status(201).json({
      success: true,
      order,
      message: 'Đơn hàng đã được tạo thành công'
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo đơn hàng'
    });
  }
});
```

---

## **🔧 Configuration**

### **1. Environment Variables**
```env
# .env
VOUCHER_ENABLED=true
VOUCHER_MAX_DISCOUNT_PERCENTAGE=50
VOUCHER_MAX_SHIPPING_DISCOUNT=50000
```

### **2. API Configuration**
```javascript
// config/api.js
export const API_ENDPOINTS = {
  // ... existing endpoints
  
  // Voucher endpoints
  VOUCHERS: {
    AVAILABLE: '/api/vouchers/available',
    VALIDATE: '/api/vouchers/validate',
    VALIDATE_MULTIPLE: '/api/vouchers/validate-multiple',
    USE: '/api/vouchers/use',
    USE_MULTIPLE: '/api/vouchers/use-multiple',
    MY_USAGE: '/api/vouchers/my-usage',
  }
};
```

---

## **🧪 Testing**

### **1. Unit Tests**
```javascript
// tests/voucher.test.js
describe('Voucher System', () => {
  test('should create discount voucher', async () => {
    // Test implementation
  });
  
  test('should validate voucher correctly', async () => {
    // Test implementation
  });
  
  test('should apply multiple vouchers', async () => {
    // Test implementation
  });
});
```

### **2. Integration Tests**
```javascript
// tests/voucher.integration.test.js
describe('Voucher Integration', () => {
  test('should integrate with checkout flow', async () => {
    // Test implementation
  });
  
  test('should handle voucher errors gracefully', async () => {
    // Test implementation
  });
});
```

---

## **📊 Monitoring**

### **1. Logging**
```javascript
// middleware/voucherLogger.js
const voucherLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      user: req.user?._id,
      voucherIds: req.body?.vouchers?.map(v => v.voucher_id)
    });
  });
  
  next();
};
```

### **2. Analytics**
```javascript
// services/voucherAnalytics.js
export const trackVoucherUsage = async (voucherId, userId, orderId, discountAmount) => {
  // Track voucher usage for analytics
  await analytics.track('voucher_used', {
    voucher_id: voucherId,
    user_id: userId,
    order_id: orderId,
    discount_amount: discountAmount,
    timestamp: new Date().toISOString()
  });
};
```

---

## **🚀 Deployment**

### **1. Database Migration**
```javascript
// migrations/add_voucher_system.js
const addVoucherSystem = async () => {
  // Create voucher collection
  await db.createCollection('vouchers');
  
  // Create indexes
  await db.collection('vouchers').createIndex({ voucher_id: 1 }, { unique: true });
  await db.collection('vouchers').createIndex({ is_active: 1, is_deleted: 1 });
  await db.collection('vouchers').createIndex({ voucher_type: 1 });
  await db.collection('vouchers').createIndex({ start_date: 1, end_date: 1 });
  
  // Update orders collection
  await db.collection('orders').updateMany({}, {
    $set: {
      vouchers_applied: [],
      total_discount: 0
    }
  });
};
```

### **2. Feature Flags**
```javascript
// config/features.js
export const FEATURES = {
  VOUCHER_SYSTEM: process.env.VOUCHER_ENABLED === 'true',
  MULTIPLE_VOUCHERS: true,
  VOUCHER_ANALYTICS: true
};
```

---

## **📚 Documentation**

### **1. API Documentation**
- Complete API reference
- Request/response examples
- Error codes and messages
- Rate limiting information

### **2. User Guide**
- How to use vouchers
- Voucher types and conditions
- Troubleshooting guide

### **3. Admin Guide**
- How to create and manage vouchers
- Voucher analytics and reporting
- Best practices

---

**🎉 Hệ thống voucher đã được tích hợp thành công!**
