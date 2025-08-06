# ⚡ Hướng Dẫn Test Nhanh

## 🎯 **Test Demo Screens**

### 1. Test Unified Component Demo
**Đường dẫn:** `app/unified-component-demo.tsx`

**Cách test:**
1. Vào Profile → Nhấn "Unified Component Demo"
2. Test từng loại component:
   - **Alert:** Nhấn các nút "Show Alert"
   - **Dialog:** Nhấn các nút "Show Dialog"
   - **Popup:** Nhấn các nút "Show Popup"
   - **Toast:** Nhấn các nút "Show Toast"

### 2. Test Hook Demo
**Đường dẫn:** `app/hook-demo.tsx`

**Cách test:**
1. Vào Profile → Nhấn "Hook Demo"
2. Test các hook functions:
   - `showAlert()` - Hiển thị alert
   - `showDialog()` - Hiển thị dialog
   - `showPopup()` - Hiển thị popup
   - `showToast()` - Hiển thị toast

---

## 🔧 **Test Individual Components**

### 1. Test UnifiedCustomComponent
**File:** `components/UnifiedCustomComponent.tsx`

**Các props cần test:**
```jsx
// Alert
<UnifiedCustomComponent
  type="alert"
  visible={true}
  title="Thông báo"
  description="Nội dung thông báo"
  mode="success"
  buttonText="OK"
  onClose={() => {}}
/>

// Dialog
<UnifiedCustomComponent
  type="dialog"
  visible={true}
  title="Xác nhận"
  description="Bạn có chắc chắn?"
  mode="warning"
  buttonText="Đồng ý"
  cancelText="Hủy"
  onConfirm={() => {}}
  onCancel={() => {}}
/>

// Popup
<UnifiedCustomComponent
  type="popup"
  visible={true}
  title="Thông báo"
  description="Nội dung popup"
  mode="info"
  buttonText="Đóng"
  onClose={() => {}}
/>

// Toast
<UnifiedCustomComponent
  type="toast"
  visible={true}
  title="Thông báo"
  description="Nội dung toast"
  mode="success"
  position="top"
  onClose={() => {}}
/>
```

### 2. Test useUnifiedComponent Hook
**File:** `hooks/useUnifiedComponent.ts`

**Cách test:**
```jsx
const {
  showAlert,
  showDialog,
  showPopup,
  showToast,
  alertVisible,
  dialogVisible,
  popupVisible,
  toastVisible,
  alertConfig,
  dialogConfig,
  popupConfig,
  toastConfig,
  hideAlert,
  hideDialog,
  hidePopup,
  hideToast
} = useUnifiedComponent();

// Test showAlert
showAlert('Thành công', 'Thao tác thành công', 'success');

// Test showDialog
showDialog('Xác nhận', 'Bạn có chắc chắn?', 'delete', 'Xóa', 'Hủy');

// Test showPopup
showPopup('Thông báo', 'Nội dung popup', 'info');

// Test showToast
showToast('Thông báo', 'Nội dung toast', 'success', 'top');
```

---

## 🎨 **Test Visual Modes**

### Test Success Mode:
```jsx
showAlert('Thành công', 'Thao tác thành công', 'success');
```
**Kết quả mong đợi:** Màu xanh lá, icon ✓

### Test Error Mode:
```jsx
showAlert('Lỗi', 'Có lỗi xảy ra', 'error');
```
**Kết quả mong đợi:** Màu đỏ, icon ✗

### Test Warning Mode:
```jsx
showAlert('Cảnh báo', 'Vui lòng kiểm tra lại', 'warning');
```
**Kết quả mong đợi:** Màu cam, icon ⚠

### Test Info Mode:
```jsx
showAlert('Thông tin', 'Thông tin chi tiết', 'info');
```
**Kết quả mong đợi:** Màu xanh dương, icon ℹ

---

## 📱 **Test Responsive**

### Test trên các kích thước màn hình:
1. **iPhone SE (375x667)**
2. **iPhone 12 (390x844)**
3. **iPhone 12 Pro Max (428x926)**
4. **Android (360x640)**
5. **Tablet (768x1024)**

### Kiểm tra:
- [ ] Component hiển thị đúng vị trí
- [ ] Text không bị tràn
- [ ] Button có thể nhấn được
- [ ] Animation mượt mà

---

## ⚡ **Test Performance**

### Kiểm tra Memory Leak:
1. Mở/đóng component nhiều lần
2. Chuyển đổi giữa các màn hình
3. Kiểm tra console log có lỗi
4. Kiểm tra memory usage

### Kiểm tra Animation:
1. Test animation hiển thị
2. Test animation ẩn
3. Test animation khi chuyển đổi mode
4. Kiểm tra không bị lag

---

## 🧪 **Test Edge Cases**

### Test với dữ liệu dài:
```jsx
showAlert(
  'Tiêu đề rất dài có thể gây ra vấn đề về layout và hiển thị trên màn hình nhỏ',
  'Nội dung thông báo cũng rất dài và có thể chứa nhiều dòng text với các ký tự đặc biệt như: !@#$%^&*()_+-=[]{}|;:,.<>?',
  'success'
);
```

### Test với dữ liệu rỗng:
```jsx
showAlert('', '', 'success');
showAlert('Tiêu đề', '', 'success');
showAlert('', 'Nội dung', 'success');
```

### Test với ký tự đặc biệt:
```jsx
showAlert('Test & Special <Characters>', 'Content with "quotes" and \'apostrophes\'', 'warning');
```

---

## 📋 **Quick Test Checklist**

### ✅ **Basic Functionality:**
- [ ] Component hiển thị khi visible=true
- [ ] Component ẩn khi visible=false
- [ ] onClose được gọi khi nhấn nút đóng
- [ ] onConfirm được gọi khi nhấn nút xác nhận
- [ ] onCancel được gọi khi nhấn nút hủy

### ✅ **Visual Appearance:**
- [ ] Màu sắc đúng với mode
- [ ] Icon hiển thị đúng
- [ ] Text hiển thị đúng
- [ ] Button có style phù hợp
- [ ] Animation mượt mà

### ✅ **Accessibility:**
- [ ] Có thể đọc được bằng screen reader
- [ ] Có thể điều hướng bằng keyboard
- [ ] Contrast ratio đủ cao
- [ ] Touch target đủ lớn

### ✅ **Cross-platform:**
- [ ] Hoạt động trên iOS
- [ ] Hoạt động trên Android
- [ ] Không có lỗi platform-specific
- [ ] Performance tốt trên cả hai platform

---

## 🚨 **Common Issues & Solutions**

### Issue 1: Component không hiển thị
**Nguyên nhân:** `visible={false}` hoặc thiếu props bắt buộc
**Giải pháp:** Kiểm tra `visible` prop và đảm bảo đủ props

### Issue 2: Animation không mượt
**Nguyên nhân:** Thiếu `useCallback` hoặc re-render không cần thiết
**Giải pháp:** Wrap handlers trong `useCallback`

### Issue 3: Text bị tràn
**Nguyên nhân:** Text quá dài cho container
**Giải pháp:** Thêm `numberOfLines` hoặc `flexWrap`

### Issue 4: Memory leak
**Nguyên nhân:** Không cleanup timers hoặc listeners
**Giải pháp:** Sử dụng `useEffect` cleanup

---

## 📞 **Troubleshooting**

### Nếu gặp lỗi:
1. **Kiểm tra console log**
2. **Kiểm tra props truyền vào**
3. **Kiểm tra state management**
4. **Kiểm tra platform-specific code**

### Debug tips:
```jsx
// Thêm console.log để debug
console.log('Component props:', { visible, title, description, mode });
console.log('Component state:', { alertVisible, alertConfig });

// Kiểm tra re-render
console.log('Component rendered');
```

**Chúc bạn test thành công! 🎉** 