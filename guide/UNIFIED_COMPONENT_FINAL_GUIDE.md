# UnifiedCustomComponent - Hướng Dẫn Hoàn Chỉnh

## 📋 Tổng Quan

`UnifiedCustomComponent` là một component thống nhất cho tất cả UI patterns trong ứng dụng, bao gồm Alert, Dialog, Popup, và Toast. Component này được thiết kế để dễ sử dụng, linh hoạt và nhất quán.

## 🎯 Tính Năng Chính

### ✅ **4 Loại Component**
- **Alert**: Thông báo đơn giản với 1 nút
- **Dialog**: Hộp thoại xác nhận với 2 nút
- **Popup**: Popup phức tạp với nhiều tùy chọn
- **Toast**: Thông báo tạm thời

### ✅ **8 Mode Hỗ Trợ**
- `success`: Xanh lá (#4CAF50) - Thành công
- `error`: Đỏ (#F44336) - Lỗi
- `warning`: Cam (#FF9800) - Cảnh báo
- `info`: Xanh dương (#2196F3) - Thông tin
- `login`: Tím (#5E5CE6) - Đăng nhập
- `delete`: Đỏ đậm (#DC3545) - Xóa
- `update`: Xanh dương nhạt (#17A2B8) - Cập nhật
- `download`: Xanh lá đậm (#28A745) - Tải xuống

### ✅ **Animation & UX**
- Animation mượt mà cho tất cả loại
- Tự động ẩn cho Toast
- Responsive design
- Type-safe với TypeScript

## 🚀 Cách Sử Dụng

### **1. Sử Dụng Trực Tiếp**

```typescript
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';

// Alert
<UnifiedCustomComponent
  type="alert"
  mode="success"
  visible={showAlert}
  title="Thành công!"
  description="Thao tác đã hoàn tất"
  buttonText="Đóng"
  onButtonPress={() => setShowAlert(false)}
/>

// Dialog
<UnifiedCustomComponent
  type="dialog"
  mode="warning"
  visible={showDialog}
  title="Xác nhận xóa"
  message="Bạn có chắc muốn xóa?"
  confirmText="Xóa"
  cancelText="Hủy"
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>

// Popup
<UnifiedCustomComponent
  type="popup"
  mode="login"
  visible={showPopup}
  title="Đăng nhập"
  message="Vui lòng đăng nhập để tiếp tục"
  primaryButtonText="Đăng nhập"
  secondaryButtonText="Hủy"
  onPrimaryPress={handleLogin}
  onSecondaryPress={() => setShowPopup(false)}
  onClose={() => setShowPopup(false)}
/>

// Toast
<UnifiedCustomComponent
  type="toast"
  mode="success"
  visible={showToast}
  text1="Thành công!"
  text2="Đã lưu thông tin"
  position="bottom"
  duration={3000}
  onClose={() => setShowToast(false)}
/>
```

### **2. Sử Dụng Hook (Khuyến Nghị)**

```typescript
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';

function MyComponent() {
  const { showAlert, showDialog, showPopup, showToast } = useUnifiedComponent();

  const handleSuccess = () => {
    showAlert('Thành công!', 'Thao tác hoàn tất', 'success');
  };

  const handleDelete = () => {
    showDialog('Xác nhận xóa', 'Bạn có chắc?', 'delete', 'Xóa', 'Hủy');
  };

  const handleLogin = () => {
    showPopup('Đăng nhập', 'Vui lòng đăng nhập', 'login', 'Đăng nhập', 'Hủy');
  };

  const handleSave = () => {
    showToast('Thành công!', 'Đã lưu', 'success');
  };

  return (
    // Your component JSX
  );
}
```

## 📱 Demo Screens

### **1. Demo Component (`/unified-component-demo`)**
- Demo đầy đủ với hướng dẫn chi tiết
- Hiển thị code example cho từng loại
- 4 nút test: Alert, Dialog, Popup, Toast

### **2. Test Component (`/test-unified-component`)**
- Demo đơn giản để test nhanh
- 4 nút test cơ bản
- Giao diện đơn giản

### **3. Hook Demo (`/hook-demo`)**
- Demo sử dụng hook `useUnifiedComponent`
- Các ví dụ với mode mới (delete, update, download)
- Hướng dẫn sử dụng hook

## 🎨 Props Interface

```typescript
interface UnifiedCustomComponentProps {
  // Common props
  visible: boolean;
  type?: 'alert' | 'dialog' | 'popup' | 'toast';
  mode?: 'success' | 'error' | 'warning' | 'info' | 'login' | 'delete' | 'update' | 'download';
  
  // Text content
  title?: string;
  message?: string;
  text1?: string;
  text2?: string;
  description?: string;
  
  // Buttons
  buttonText?: string;
  confirmText?: string;
  cancelText?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  
  // Actions
  onButtonPress?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
  
  // Icons
  icon?: string;
  
  // Toast specific
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  
  // Custom styling
  customStyle?: any;
}
```

## 🔧 Hook Interface

```typescript
interface UseUnifiedComponentReturn {
  // Alert
  showAlert: (title: string, description: string, mode?: string, buttonText?: string) => void;
  hideAlert: () => void;
  alertVisible: boolean;
  alertConfig: { title: string; description: string; mode: string; buttonText: string; };

  // Dialog
  showDialog: (title: string, message: string, mode?: string, confirmText?: string, cancelText?: string) => void;
  hideDialog: () => void;
  dialogVisible: boolean;
  dialogConfig: { title: string; message: string; mode: string; confirmText: string; cancelText: string; };

  // Popup
  showPopup: (title: string, message: string, mode?: string, primaryText?: string, secondaryText?: string) => void;
  hidePopup: () => void;
  popupVisible: boolean;
  popupConfig: { title: string; message: string; mode: string; primaryText: string; secondaryText: string; };

  // Toast
  showToast: (text1: string, text2?: string, mode?: string, duration?: number) => void;
  hideToast: () => void;
  toastVisible: boolean;
  toastConfig: { text1: string; text2?: string; mode: string; duration: number; };
}
```

## 🎯 Best Practices

### **1. Sử dụng Hook thay vì component trực tiếp**
```typescript
// ✅ Tốt
const { showAlert } = useUnifiedComponent();
showAlert('Thành công!', 'Đã lưu', 'success');

// ❌ Không tốt
const [showAlert, setShowAlert] = useState(false);
// Phải quản lý nhiều state
```

### **2. Chọn mode phù hợp**
```typescript
// ✅ Đúng ngữ cảnh
showAlert('Xóa thành công!', 'Đã xóa item', 'success');
showDialog('Xác nhận xóa', 'Bạn có chắc?', 'delete');

// ❌ Không phù hợp
showAlert('Xóa thành công!', 'Đã xóa item', 'error'); // Sai mode
```

### **3. Sử dụng text ngắn gọn**
```typescript
// ✅ Ngắn gọn
showToast('Đã lưu', 'Thông tin đã được cập nhật');

// ❌ Quá dài
showToast('Thông báo thành công: Thông tin cá nhân của bạn đã được cập nhật thành công trong hệ thống');
```

## 🔄 Migration từ Component Cũ

### **Từ CustomAlert:**
```typescript
// Cũ
<CustomAlert
  type="success"
  title="Thành công"
  description="Đã lưu"
  buttonText="OK"
  onButtonPress={handleClose}
/>

// Mới
showAlert('Thành công', 'Đã lưu', 'success', 'OK');
```

### **Từ CustomDialog:**
```typescript
// Cũ
<CustomDialog
  visible={showDialog}
  title="Xác nhận"
  message="Bạn có chắc?"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>

// Mới
showDialog('Xác nhận', 'Bạn có chắc?', 'warning');
```

## 📁 File Structure

```
components/
├── UnifiedCustomComponent.tsx    # Component chính
hooks/
├── useUnifiedComponent.ts        # Custom hook
app/
├── unified-component-demo.tsx    # Demo đầy đủ
├── test-unified-component.tsx    # Test đơn giản
├── hook-demo.tsx                 # Demo hook
guide/
├── UNIFIED_COMPONENT_FINAL_GUIDE.md  # Hướng dẫn này
```

## 🎉 Kết Luận

`UnifiedCustomComponent` đã được tối ưu hóa hoàn toàn với:

- ✅ **4 loại component** trong 1 file
- ✅ **8 mode** với màu sắc và icon phù hợp
- ✅ **Custom hook** để dễ sử dụng
- ✅ **Type-safe** với TypeScript
- ✅ **Animation** mượt mà
- ✅ **Demo screens** đầy đủ
- ✅ **Documentation** chi tiết

Component sẵn sàng để sử dụng trong toàn bộ ứng dụng! 🚀 