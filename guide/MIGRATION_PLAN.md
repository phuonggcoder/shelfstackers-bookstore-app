# Migration Plan - Thay Thế Alert.alert bằng UnifiedCustomComponent

## 📋 Tổng Quan

Kế hoạch thay thế tất cả `Alert.alert()` trong ứng dụng bằng `UnifiedCustomComponent` để có UI nhất quán và trải nghiệm người dùng tốt hơn.

## 🎯 Mục Tiêu

- ✅ Thay thế tất cả `Alert.alert()` bằng `UnifiedCustomComponent`
- ✅ Sử dụng hook `useUnifiedComponent` để dễ quản lý
- ✅ Phân loại theo loại thông báo (success, error, warning, info)
- ✅ Cải thiện UX với animation và design đẹp hơn

## 📊 Thống Kê Alert.alert Hiện Tại

### **File có nhiều Alert.alert nhất:**
1. `app/order-review.tsx` - 15+ alerts
2. `app/(auth)/login.tsx` - 8+ alerts  
3. `app/(auth)/register.tsx` - 6+ alerts
4. `components/ReviewForm.tsx` - 10+ alerts
5. `app/edit-address.tsx` - 8+ alerts
6. `app/ChangePassword.tsx` - 5+ alerts
7. `app/cart.tsx` - 4+ alerts
8. `app/book/[id].tsx` - 3+ alerts

### **Tổng cộng: ~80+ Alert.alert cần thay thế**

## 🔄 Chiến Lược Migration

### **Phase 1: Files Ưu Tiên Cao**
1. **Authentication** (`login.tsx`, `register.tsx`)
2. **Core Features** (`cart.tsx`, `book/[id].tsx`)
3. **User Profile** (`ChangePassword.tsx`, `edit-address.tsx`)

### **Phase 2: Files Ưu Tiên Trung Bình**
1. **Order Management** (`order-review.tsx`, `order-detail.tsx`)
2. **Review System** (`ReviewForm.tsx`, `product-reviews.tsx`)
3. **Payment** (`zalo-pay.tsx`, `order-success.tsx`)

### **Phase 3: Files Còn Lại**
1. **Components** (`GoogleSignInButton.tsx`, `OTPLogin.tsx`)
2. **Context** (`AuthContext.tsx`)
3. **Screens** (`CartScreen.tsx`, `OrderPaymentScreen.tsx`)

## 🎨 Phân Loại Alert Types

### **Success Alerts** → `showAlert(..., 'success')`
```typescript
// Cũ
Alert.alert('Thành công', 'Đăng nhập thành công!');

// Mới  
showAlert('Thành công', 'Đăng nhập thành công!', 'success');
```

### **Error Alerts** → `showAlert(..., 'error')`
```typescript
// Cũ
Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');

// Mới
showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'error');
```

### **Warning Alerts** → `showDialog(..., 'warning')`
```typescript
// Cũ
Alert.alert('Xác nhận', 'Bạn có chắc muốn hủy đơn hàng?', [
  { text: 'Hủy', style: 'cancel' },
  { text: 'Xác nhận', onPress: handleCancel }
]);

// Mới
showDialog('Xác nhận', 'Bạn có chắc muốn hủy đơn hàng?', 'warning', 'Xác nhận', 'Hủy');
```

### **Info Alerts** → `showAlert(..., 'info')`
```typescript
// Cũ
Alert.alert('Thông báo', 'Mã OTP đã được gửi');

// Mới
showAlert('Thông báo', 'Mã OTP đã được gửi', 'info');
```

## 🚀 Implementation Steps

### **Step 1: Import Hook**
```typescript
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';

function MyComponent() {
  const { showAlert, showDialog, showToast } = useUnifiedComponent();
  // ...
}
```

### **Step 2: Replace Alert.alert**
```typescript
// Cũ
Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');

// Mới
showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'error');
```

### **Step 3: Add Component to JSX**
```typescript
return (
  <View>
    {/* Your existing JSX */}
    
    {/* Add Unified Components */}
    <UnifiedCustomComponent
      type="alert"
      mode={alertConfig.mode as any}
      visible={alertVisible}
      title={alertConfig.title}
      description={alertConfig.description}
      buttonText={alertConfig.buttonText}
      onButtonPress={hideAlert}
    />
    
    <UnifiedCustomComponent
      type="dialog"
      mode={dialogConfig.mode as any}
      visible={dialogVisible}
      title={dialogConfig.title}
      message={dialogConfig.message}
      confirmText={dialogConfig.confirmText}
      cancelText={dialogConfig.cancelText}
      onConfirm={handleConfirm}
      onCancel={hideDialog}
    />
  </View>
);
```

## 📝 Migration Checklist

### **Phase 1 - Authentication**
- [ ] `app/(auth)/login.tsx`
- [ ] `app/(auth)/register.tsx`
- [ ] `context/AuthContext.tsx`

### **Phase 2 - Core Features**
- [ ] `app/cart.tsx`
- [ ] `app/book/[id].tsx`
- [ ] `app/ChangePassword.tsx`
- [ ] `app/edit-address.tsx`

### **Phase 3 - Order Management**
- [ ] `app/order-review.tsx`
- [ ] `app/order-detail.tsx`
- [ ] `app/order-success.tsx`
- [ ] `app/zalo-pay.tsx`

### **Phase 4 - Review System**
- [ ] `components/ReviewForm.tsx`
- [ ] `app/product-reviews.tsx`
- [ ] `app/my-reviews.tsx`

### **Phase 5 - Components**
- [ ] `components/GoogleSignInButton.tsx`
- [ ] `components/OTPLogin.tsx`
- [ ] `components/AddressSelector.tsx`

### **Phase 6 - Screens**
- [ ] `screens/CartScreen.tsx`
- [ ] `screens/OrderPaymentScreen.tsx`

## 🎯 Benefits After Migration

### **UX Improvements**
- ✅ Animation mượt mà
- ✅ Design nhất quán
- ✅ 8 mode với màu sắc phù hợp
- ✅ Responsive design

### **Developer Experience**
- ✅ Type-safe với TypeScript
- ✅ Hook-based API dễ sử dụng
- ✅ Code ít hơn, dễ maintain
- ✅ Reusable components

### **Performance**
- ✅ Native animations
- ✅ Optimized rendering
- ✅ Memory efficient

## 🔧 Testing Strategy

### **Unit Testing**
- Test từng loại alert/dialog/popup
- Test các mode khác nhau
- Test edge cases

### **Integration Testing**
- Test flow đăng nhập/đăng ký
- Test flow đặt hàng
- Test flow review

### **User Testing**
- Test trên các device khác nhau
- Test với các kích thước màn hình
- Test accessibility

## 📈 Success Metrics

- ✅ 0 Alert.alert() còn lại trong codebase
- ✅ 100% components sử dụng UnifiedCustomComponent
- ✅ User feedback tích cực về UI/UX
- ✅ Reduced development time cho UI components

## 🎉 Kết Luận

Migration này sẽ cải thiện đáng kể trải nghiệm người dùng và developer experience. Bắt đầu với Phase 1 và tiến hành từng bước một cách có hệ thống. 