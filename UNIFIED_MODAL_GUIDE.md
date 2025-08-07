# Unified Modal Component - Hướng dẫn sử dụng

## 🎯 Tổng quan

`UnifiedCustomComponent` là một component React Native thống nhất có thể hiển thị 4 loại UI khác nhau:
- **Toast** - Thông báo nổi ngắn gọn
- **Alert** - Hộp thoại cảnh báo đơn giản  
- **Dialog** - Hộp thoại có 2 nút (Xác nhận/Hủy)
- **Popup** - Modal popup với nhiều tùy chọn

## 🚀 Cách sử dụng

### 1. Import hook
```typescript
import { useUnifiedModal } from '../context/UnifiedModalContext';
```

### 2. Sử dụng trong component
```typescript
const { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast,
  showAlert,
  showDialog,
  showPopup,
  showLoginPopup,
  showDeleteDialog 
} = useUnifiedModal();
```

## 📝 Các hàm có sẵn

### Toast Functions
```typescript
// Success Toast
showSuccessToast('Thành công!', 'Dữ liệu đã được lưu');

// Error Toast  
showErrorToast('Lỗi!', 'Có lỗi xảy ra');

// Warning Toast
showWarningToast('Cảnh báo!', 'Vui lòng kiểm tra lại');

// Custom Toast
showToast('Tiêu đề', 'Nội dung', 'success', 'bottom', 3000);
```

### Alert Functions
```typescript
// Basic Alert
showAlert('Thông báo', 'Đây là một thông báo');

// Success Alert
showAlert('Thành công', 'Thao tác đã hoàn tất', 'Đồng ý', 'success');

// Custom Alert
showAlert('Tiêu đề', 'Mô tả', 'Nút bấm', 'info', () => {
  // Callback khi bấm nút
});
```

### Dialog Functions
```typescript
// Confirm Dialog
showDialog(
  'Xác nhận',
  'Bạn có chắc chắn muốn thực hiện?',
  'Xác nhận',
  'Hủy',
  'info',
  () => console.log('Đã xác nhận'),
  () => console.log('Đã hủy')
);

// Delete Dialog (có sẵn)
showDeleteDialog(
  () => console.log('Đã xóa'),
  () => console.log('Đã hủy xóa')
);
```

### Popup Functions
```typescript
// Custom Popup
showPopup(
  'Tùy chọn',
  'Bạn muốn làm gì?',
  'Tiếp tục',
  'Dừng lại',
  'info',
  () => console.log('Tiếp tục'),
  () => console.log('Dừng lại')
);

// Login Popup (có sẵn)
showLoginPopup(
  () => console.log('Đăng nhập'),
  () => console.log('Bỏ qua')
);
```

## 🎨 Các mode có sẵn

- `success` - Màu xanh lá (#3255FB)
- `error` - Màu đỏ (#F44336)  
- `warning` - Màu cam (#FF9800)
- `info` - Màu xanh dương (#2196F3)
- `login` - Màu tím (#5E5CE6)
- `delete` - Màu đỏ đậm (#DC3545)
- `update` - Màu xanh ngọc (#17A2B8)
- `download` - Màu xanh lá đậm (#28A745)

## 📱 Toast Positions

- `top` - Hiển thị ở đầu màn hình
- `bottom` - Hiển thị ở cuối màn hình (mặc định)
- `center` - Hiển thị ở giữa màn hình

## 🔧 Tích hợp vào codebase

### 1. Thay thế Alert.alert
```typescript
// Cũ
Alert.alert('Lỗi', 'Có lỗi xảy ra');

// Mới
showErrorToast('Lỗi', 'Có lỗi xảy ra');
```

### 2. Thay thế Toast
```typescript
// Cũ (react-native-toast-message)
Toast.show({
  type: 'success',
  text1: 'Thành công'
});

// Mới
showSuccessToast('Thành công');
```

### 3. Thay thế Modal tùy chỉnh
```typescript
// Cũ - Modal phức tạp
<Modal visible={visible}>
  <View>
    <Text>Xác nhận xóa?</Text>
    <Button onPress={onConfirm}>Xóa</Button>
    <Button onPress={onCancel}>Hủy</Button>
  </View>
</Modal>

// Mới
showDeleteDialog(onConfirm, onCancel);
```

## 🧪 Test Demo

Truy cập `/test-unified-modal` để xem demo tất cả các loại modal.

## 📋 Checklist tích hợp

- [ ] Thay thế tất cả `Alert.alert` bằng `showErrorToast`/`showSuccessToast`
- [ ] Thay thế `Toast.show` bằng các hàm toast tương ứng
- [ ] Thay thế Modal tùy chỉnh bằng `showDialog`/`showPopup`
- [ ] Test tất cả các trường hợp sử dụng
- [ ] Xóa import không cần thiết (`Alert`, `Toast`)

## 🎯 Lợi ích

1. **Consistent Design** - Tất cả modal có cùng style
2. **Easy to use** - API đơn giản, dễ nhớ
3. **Flexible** - Hỗ trợ nhiều tùy chỉnh
4. **Maintainable** - Chỉ cần sửa 1 chỗ cho tất cả
5. **Performance** - Sử dụng native driver cho animation
