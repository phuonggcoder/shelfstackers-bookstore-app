# Unified Custom Component Guide

## Tổng Quan

`UnifiedCustomComponent` là một component duy nhất có thể hiển thị 4 loại UI patterns khác nhau:
- **Alert**: Thông báo đơn giản với một nút
- **Dialog**: Hộp thoại xác nhận với hai nút
- **Popup**: Popup phức tạp với nhiều tùy chọn
- **Toast**: Thông báo tạm thời

## Cách Sử Dụng

### 1. Import Component

```typescript
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';
```

### 2. Các Props Chính

#### Props Chung
- `visible: boolean` - Hiển thị/ẩn component
- `type: 'alert' | 'dialog' | 'popup' | 'toast'` - Loại component
- `mode: 'success' | 'error' | 'warning' | 'info' | 'login'` - Chế độ hiển thị

#### Props Nội Dung
- `title?: string` - Tiêu đề (cho Alert, Dialog, Popup)
- `message?: string` - Nội dung chính (cho Dialog, Popup)
- `text1?: string` - Văn bản chính (cho Toast)
- `text2?: string` - Văn bản phụ (cho Toast)
- `description?: string` - Mô tả (cho Alert)

#### Props Nút
- `buttonText?: string` - Text nút (Alert)
- `confirmText?: string` - Text nút xác nhận (Dialog)
- `cancelText?: string` - Text nút hủy (Dialog)
- `primaryButtonText?: string` - Text nút chính (Popup)
- `secondaryButtonText?: string` - Text nút phụ (Popup)

#### Props Hành Động
- `onButtonPress?: () => void` - Sự kiện nút (Alert)
- `onConfirm?: () => void` - Sự kiện xác nhận (Dialog)
- `onCancel?: () => void` - Sự kiện hủy (Dialog)
- `onPrimaryPress?: () => void` - Sự kiện nút chính (Popup)
- `onSecondaryPress?: () => void` - Sự kiện nút phụ (Popup)
- `onClose?: () => void` - Sự kiện đóng (Popup, Toast)

#### Props Khác
- `icon?: string` - Icon tùy chỉnh
- `duration?: number` - Thời gian hiển thị (Toast, mặc định: 3000ms)
- `position?: 'top' | 'bottom' | 'center'` - Vị trí (Toast, mặc định: 'bottom')
- `customStyle?: any` - Style tùy chỉnh

## Ví Dụ Sử Dụng

### 1. Alert Component

```typescript
const [showAlert, setShowAlert] = useState(false);

<UnifiedCustomComponent
  type="alert"
  mode="success"
  visible={showAlert}
  title="Thành công!"
  description="Thao tác đã được thực hiện thành công"
  buttonText="Đóng"
  onButtonPress={() => setShowAlert(false)}
/>
```

### 2. Dialog Component

```typescript
const [showDialog, setShowDialog] = useState(false);

<UnifiedCustomComponent
  type="dialog"
  mode="warning"
  visible={showDialog}
  title="Xác nhận xóa"
  message="Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác."
  confirmText="Xóa"
  cancelText="Hủy"
  onConfirm={() => {
    // Xử lý xóa
    setShowDialog(false);
  }}
  onCancel={() => setShowDialog(false)}
/>
```

### 3. Popup Component

```typescript
const [showPopup, setShowPopup] = useState(false);

<UnifiedCustomComponent
  type="popup"
  mode="login"
  visible={showPopup}
  title="Đăng nhập để tiếp tục"
  message="Vui lòng đăng nhập để sử dụng đầy đủ tính năng của ứng dụng"
  primaryButtonText="Đăng nhập"
  secondaryButtonText="Để sau"
  onPrimaryPress={() => {
    // Chuyển đến trang đăng nhập
    setShowPopup(false);
  }}
  onSecondaryPress={() => setShowPopup(false)}
  onClose={() => setShowPopup(false)}
/>
```

### 4. Toast Component

```typescript
const [showToast, setShowToast] = useState(false);

<UnifiedCustomComponent
  type="toast"
  mode="success"
  visible={showToast}
  text1="Thành công!"
  text2="Thông tin đã được lưu"
  position="bottom"
  duration={3000}
  onClose={() => setShowToast(false)}
/>
```

## Các Mode Hỗ Trợ

### Success Mode
- Màu: Xanh lá (#4CAF50)
- Icon: checkmark-circle
- Dùng cho: Thông báo thành công

### Error Mode
- Màu: Đỏ (#F44336)
- Icon: close-circle
- Dùng cho: Thông báo lỗi

### Warning Mode
- Màu: Cam (#FF9800)
- Icon: warning
- Dùng cho: Cảnh báo

### Info Mode
- Màu: Xanh dương (#2196F3)
- Icon: information-circle
- Dùng cho: Thông tin

### Login Mode
- Màu: Tím (#5E5CE6)
- Icon: log-in
- Dùng cho: Popup đăng nhập

## Tích Hợp Vào App Hiện Tại

### Thay Thế Alert Cũ

```typescript
// Trước
Alert.alert(
  'Xác nhận',
  'Bạn có chắc muốn xóa?',
  [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: handleDelete }
  ]
);

// Sau
const [showDeleteDialog, setShowDeleteDialog] = useState(false);

<UnifiedCustomComponent
  type="dialog"
  mode="warning"
  visible={showDeleteDialog}
  title="Xác nhận xóa"
  message="Bạn có chắc muốn xóa?"
  confirmText="Xóa"
  cancelText="Hủy"
  onConfirm={() => {
    handleDelete();
    setShowDeleteDialog(false);
  }}
  onCancel={() => setShowDeleteDialog(false)}
/>
```

### Thay Thế Toast Cũ

```typescript
// Trước
const [toast, setToast] = useState({ visible: false, message: '' });

{toast.visible && (
  <View style={styles.toastContainer}>
    <Text>{toast.message}</Text>
  </View>
)}

// Sau
const [showToast, setShowToast] = useState(false);

<UnifiedCustomComponent
  type="toast"
  mode="success"
  visible={showToast}
  text1="Thành công!"
  text2="Đã lưu thông tin"
  onClose={() => setShowToast(false)}
/>
```

## Lợi Ích

1. **Tính nhất quán**: Tất cả UI patterns có cùng style và behavior
2. **Dễ bảo trì**: Chỉ cần sửa một file để thay đổi tất cả
3. **Linh hoạt**: Có thể tùy chỉnh từng loại riêng biệt
4. **Type-safe**: TypeScript hỗ trợ đầy đủ
5. **Animation**: Có sẵn animation mượt mà
6. **Responsive**: Tự động điều chỉnh theo kích thước màn hình

## Lưu Ý

- Component sử dụng `Ionicons` cho icons
- Toast tự động ẩn sau `duration` milliseconds
- Tất cả components đều có animation mượt mà
- Có thể tùy chỉnh style thông qua `customStyle` prop
- Position của Toast chỉ áp dụng cho type="toast"

## Demo

Xem file `app/unified-component-demo.tsx` để có ví dụ đầy đủ về cách sử dụng tất cả các loại component. 