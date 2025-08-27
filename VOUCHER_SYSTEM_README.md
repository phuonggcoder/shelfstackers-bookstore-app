# 🎫 Hệ Thống Voucher Đa Loại - Frontend Integration

## 📋 Tổng Quan

Hệ thống voucher mới hỗ trợ **2 loại voucher** và **áp dụng đồng thời**:

- **Discount Voucher** - Giảm giá sản phẩm (percentage/fixed)
- **Shipping Voucher** - Giảm phí vận chuyển

## 🏗️ Cấu Trúc Components

### 1. **VoucherSelector** (`components/VoucherSelector.tsx`)
- Modal chọn voucher với giao diện đẹp
- Hỗ trợ chọn nhiều voucher cùng lúc
- Validation real-time
- Phân loại voucher theo type

### 2. **VoucherSummary** (`components/VoucherSummary.tsx`)
- Hiển thị tổng quan voucher đã áp dụng
- Tính toán discount và final amount
- Giao diện responsive với voucher tags

### 3. **VoucherCard** (`components/VoucherCard.tsx`)
- Component hiển thị từng voucher
- Thông tin chi tiết và trạng thái
- Animation và visual feedback

### 4. **VoucherUsageHistory** (`components/VoucherUsageHistory.tsx`)
- Lịch sử sử dụng voucher của user
- Pagination và refresh
- Chi tiết từng lần sử dụng

### 5. **VoucherDemo** (`components/VoucherDemo.tsx`)
- Component demo đầy đủ tính năng
- Test các trường hợp khác nhau
- Giao diện tương tác

## 🔧 Services & Hooks

### **VoucherService** (`services/voucherService.ts`)
```typescript
// Các API chính
getAvailableVouchers(token, minOrderValue?, voucherType?)
validateVoucher(token, request)
validateMultipleVouchers(token, request)
useVoucher(token, request)
useMultipleVouchers(token, request)
getUserVoucherUsage(token, userId, page, limit)
```

### **useVoucher Hook** (`hooks/useVoucher.ts`)
```typescript
const {
  voucherResult,
  isApplying,
  isUsing,
  applyVouchers,
  useVouchers,
  clearVouchers,
  getTotalDiscount,
  getFinalAmount,
  getAppliedVouchersCount,
} = useVoucher({ orderValue, shippingCost });
```

## 🚀 Cách Sử Dụng

### 1. **Tích Hợp Vào Checkout**

```typescript
import VoucherSelector from '../components/VoucherSelector';
import VoucherSummary from '../components/VoucherSummary';
import { useVoucher } from '../hooks/useVoucher';

const CheckoutScreen = () => {
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const orderValue = 250000;
  const shippingCost = 30000;

  const {
    voucherResult,
    applyVouchers,
    useVouchers,
    clearVouchers,
    getFinalAmount,
  } = useVoucher({ orderValue, shippingCost });

  const handleVouchersSelected = (result) => {
    console.log('Vouchers applied:', result);
  };

  const handlePlaceOrder = async () => {
    // Tạo order trước
    const order = await createOrder(orderData);
    
    // Sử dụng voucher
    if (voucherResult) {
      await useVouchers(order.id);
    }
  };

  return (
    <View>
      {/* Order Summary */}
      <VoucherSummary
        voucherResult={voucherResult}
        orderValue={orderValue}
        shippingCost={shippingCost}
        onRemoveVouchers={clearVouchers}
        onEditVouchers={() => setShowVoucherSelector(true)}
      />

      {/* Voucher Selector Modal */}
      <VoucherSelector
        visible={showVoucherSelector}
        orderValue={orderValue}
        shippingCost={shippingCost}
        onVouchersSelected={handleVouchersSelected}
        onClose={() => setShowVoucherSelector(false)}
      />

      {/* Place Order Button */}
      <TouchableOpacity onPress={handlePlaceOrder}>
        <Text>Đặt hàng: {getFinalAmount().toLocaleString('vi-VN')} VNĐ</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. **Sử Dụng Trong Cart**

```typescript
const CartScreen = () => {
  const { voucherResult, getTotalDiscount } = useVoucher({ 
    orderValue: cartTotal, 
    shippingCost 
  });

  return (
    <View>
      <Text>Giỏ hàng: {cartTotal.toLocaleString('vi-VN')} VNĐ</Text>
      <Text>Phí ship: {shippingCost.toLocaleString('vi-VN')} VNĐ</Text>
      
      {voucherResult && (
        <Text>Giảm giá: -{getTotalDiscount().toLocaleString('vi-VN')} VNĐ</Text>
      )}
      
      <Text>Tổng: {getFinalAmount().toLocaleString('vi-VN')} VNĐ</Text>
    </View>
  );
};
```

## 🎨 UI/UX Features

### **Visual Design**
- ✅ Consistent với theme app (aqua/blue-green)
- ✅ Modern card design với shadows
- ✅ Smooth animations và transitions
- ✅ Responsive layout
- ✅ Loading states và error handling

### **User Experience**
- ✅ Intuitive voucher selection
- ✅ Real-time validation feedback
- ✅ Clear discount calculation
- ✅ Easy voucher management
- ✅ Usage history tracking

## 🔄 State Management

### **Voucher State Flow**
```
1. User opens voucher selector
2. System loads available vouchers
3. User selects vouchers
4. System validates selections
5. Vouchers applied to order
6. Final amount calculated
7. User places order
8. Vouchers consumed
```

### **Error Handling**
- Network errors
- Validation errors
- Usage limit exceeded
- Invalid voucher codes
- Expired vouchers

## 📱 Responsive Design

### **Mobile Optimizations**
- Touch-friendly buttons
- Swipe gestures
- Modal presentations
- Optimized for small screens
- Fast loading times

### **Tablet Support**
- Larger touch targets
- Multi-column layouts
- Enhanced visual hierarchy
- Better use of screen space

## 🧪 Testing

### **Demo Component**
```typescript
import VoucherDemo from '../components/VoucherDemo';

// Trong development
<VoucherDemo />
```

### **Test Cases**
- ✅ Chọn 1 discount voucher
- ✅ Chọn 1 shipping voucher
- ✅ Chọn cả 2 loại voucher
- ✅ Validation với order value thấp
- ✅ Validation với order value cao
- ✅ Sử dụng voucher hết hạn
- ✅ Sử dụng voucher hết lượt
- ✅ Network error handling

## 🔧 Configuration

### **API Endpoints**
```typescript
// config/api.ts
VOUCHERS_AVAILABLE: '/api/vouchers/available',
VALIDATE_VOUCHER: '/api/vouchers/validate',
VALIDATE_MULTIPLE: '/api/vouchers/validate-multiple',
USE_VOUCHER: '/api/vouchers/use',
USE_MULTIPLE: '/api/vouchers/use-multiple',
USER_USAGE: '/api/vouchers/my-usage/:userId',
```

### **Environment Variables**
```typescript
API_BASE_URL: 'https://server-shelf-stacker-w1ds.onrender.com'
```

## 📊 Analytics & Monitoring

### **Events to Track**
- Voucher selection
- Voucher application
- Voucher usage
- Validation errors
- User behavior patterns

### **Metrics**
- Voucher usage rate
- Popular voucher types
- Conversion impact
- Error rates
- Performance metrics

## 🚀 Deployment

### **Build Process**
```bash
# Install dependencies
npm install

# Build for production
expo build:android
expo build:ios

# Or for development
expo start
```

### **Environment Setup**
1. Ensure API endpoints are correct
2. Test with real voucher data
3. Verify authentication flow
4. Check error handling
5. Test on different devices

## 🎯 Best Practices

### **Performance**
- Lazy load voucher data
- Cache voucher information
- Optimize API calls
- Minimize re-renders

### **Security**
- Validate all inputs
- Sanitize voucher codes
- Secure API communication
- Handle sensitive data properly

### **Accessibility**
- Screen reader support
- Keyboard navigation
- High contrast mode
- Voice commands

## 🔮 Future Enhancements

### **Planned Features**
- Push notifications for new vouchers
- Voucher sharing functionality
- Advanced filtering options
- Bulk voucher operations
- Analytics dashboard

### **Technical Improvements**
- Offline support
- Advanced caching
- Performance optimizations
- Enhanced animations

---

## 📞 Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ:
- **Email**: support@shelfstackers.com
- **Documentation**: [API Docs](https://server-shelf-stacker-w1ds.onrender.com/docs)
- **GitHub**: [Repository](https://github.com/shelfstackers/bookstore-app)

---

**🎉 Hệ thống voucher đã sẵn sàng sử dụng!**
