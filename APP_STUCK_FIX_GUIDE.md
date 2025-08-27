# 🔧 Hướng dẫn Sửa App Bị Đứng

## 🐛 **Vấn đề hiện tại:**

App bị đứng và không thể thoát ra được sau khi:
- Đăng ký thành công
- Verify OTP thất bại
- App stuck trong verification state

## 🔍 **Nguyên nhân:**

1. **OTP undefined**: `"Email và OTP là bắt buộc"`
2. **Infinite loop**: Component OTP gọi cả `onVerifyOTP` và `onVerificationSuccess`
3. **State conflict**: App không thể chuyển state từ verification sang success

## 🔧 **Giải pháp đã thực hiện:**

### **1. Sửa EmailOTPVerification Component:**

```typescript
// Trước (có lỗi):
const handleVerifyOTP = async (otpString?: string) => {
  // ...
  if (onVerifyOTP) {
    const result = await onVerifyOTP(otpToVerify);
    onVerificationSuccess(result); // ❌ Gọi cả 2 function
  }
};

// Sau (đã sửa):
const handleVerifyOTP = async (otpString?: string) => {
  // ...
  if (onVerifyOTP) {
    const result = await onVerifyOTP(otpToVerify);
    // ✅ Không gọi onVerificationSuccess nữa
  } else {
    onVerificationSuccess({ success: true, otp: otpToVerify });
  }
};
```

### **2. Sửa Register Component:**

```typescript
// Trước (có conflict):
<EmailOTPVerification
  onVerificationSuccess={handleVerifyOTP}
  onVerifyOTP={handleVerifyOTP} // ❌ Trùng function
/>

// Sau (đã sửa):
<EmailOTPVerification
  onVerificationSuccess={handleVerifyOTP}
  // ✅ Bỏ onVerifyOTP để tránh conflict
/>
```

## 🚀 **Cách thoát khỏi trạng thái bị đứng:**

### **1. Restart App:**
```bash
# Dừng app
Ctrl + C

# Restart
npm start
# hoặc
expo start
```

### **2. Clear Cache:**
```bash
# Clear Metro cache
npx expo start --clear

# Clear React Native cache
npx react-native start --reset-cache
```

### **3. Reset App State:**
```bash
# Xóa AsyncStorage data
# Trong app, vào Settings > Clear Data
```

### **4. Force Close App:**
- **Android**: Swipe up và close app
- **iOS**: Double tap home và swipe up
- **Simulator**: Cmd + Q

## 🧪 **Test sau khi sửa:**

### **1. Test Registration Flow:**
```bash
node debug-registration-flow.js
```

### **2. Test trong App:**
1. **Đăng ký** với email mới
2. **Nhập OTP** chính xác
3. **Verify** thành công
4. **Auto login** hoạt động
5. **Chuyển trang** thành công

### **3. Test Error Handling:**
1. **Nhập OTP sai** → Hiển thị lỗi
2. **Back to form** → Quay lại form đăng ký
3. **Resend OTP** → Gửi lại OTP

## ✅ **Kết quả mong đợi:**

### **Flow hoạt động:**
1. ✅ **Registration**: Gửi OTP thành công
2. ✅ **OTP Input**: Nhập OTP không bị lỗi
3. ✅ **Verification**: Verify thành công
4. ✅ **Auto Login**: Login tự động
5. ✅ **Navigation**: Chuyển trang thành công

### **Error Handling:**
1. ✅ **OTP sai**: Hiển thị lỗi, không bị đứng
2. ✅ **Network error**: Hiển thị lỗi, có thể retry
3. ✅ **Back button**: Quay lại form đăng ký

## 🔧 **Debug Commands:**

### **1. Check App State:**
```bash
# Xem log app
npx expo logs

# Debug với React Native Debugger
npx react-native log-android
npx react-native log-ios
```

### **2. Test API Endpoints:**
```bash
# Test registration
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"temp_password"}'

# Test verification
curl -X POST http://localhost:3000/api/users/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","password":"RealPassword123"}'
```

---

## 🎯 **Bước tiếp theo:**

1. **Restart app** để áp dụng changes
2. **Test registration flow** hoàn chỉnh
3. **Verify** không còn bị đứng
4. **Check** error handling hoạt động

**Lưu ý:** Sau khi restart, app sẽ hoạt động bình thường và không còn bị đứng!

