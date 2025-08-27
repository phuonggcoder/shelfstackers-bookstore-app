# 🚨 HƯỚNG DẪN KHẨN CẤP - SỬA LỖI OTP NGAY LẬP TỨC

## 🚨 **VẤN ĐỀ KHẨN CẤP:**
- ❌ User đang gặp lỗi "Cả hai mã OTP đều bắt buộc"
- ❌ OTP có spaces: "7 4 8 3 3 8" và "7 0 8 2 3 3"
- ❌ Frontend không clean OTP trước khi gửi

## 🔧 **GIẢI PHÁP KHẨN CẤP:**

### **Bước 1: Kiểm tra file hiện tại**
```bash
# Kiểm tra xem file có đúng không
cat components/ChangeEmailVerification.tsx
```

### **Bước 2: Nếu file đã đúng, rebuild app**
```bash
# Clean và rebuild
npx expo start --clear
# Hoặc
npm run android
npm run ios
```

### **Bước 3: Nếu file chưa đúng, apply fix ngay**

#### **Fix 1: Thêm OTP cleaning trong handleVerifyOTPs**
```javascript
const handleVerifyOTPs = async () => {
  if (!currentEmailOtp || !newEmailOtp) {
    showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
    return;
  }

  try {
    setIsLoading(true);
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('Lỗi', 'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }
    
    // 🚨 KHẨN CẤP: Clean OTP values - remove spaces and trim
    const cleanOldOtp = currentEmailOtp.replace(/\s/g, '').trim();
    const cleanNewOtp = newEmailOtp.replace(/\s/g, '').trim();
    
    console.log('🔧 Sending OTPs:', {
      oldEmailOtp: cleanOldOtp,
      newEmailOtp: cleanNewOtp,
      oldLength: cleanOldOtp.length,
      newLength: cleanNewOtp.length
    });
    
    const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldEmailOtp: cleanOldOtp,  // 🚨 Sử dụng cleaned OTP
        newEmailOtp: cleanNewOtp,  // 🚨 Sử dụng cleaned OTP
      }),
    });
    
    // ... rest of the code
  } catch (error: any) {
    console.error('❌ Verification error:', error);
    showErrorToast('Lỗi', error.message || 'Xác thực thất bại');
  } finally {
    setIsLoading(false);
  }
};
```

#### **Fix 2: Thêm auto-formatting trong TextInput**
```javascript
<TextInput
  style={styles.otpInput}
  placeholder="Nhập OTP từ email hiện tại"
  value={currentEmailOtp}
  onChangeText={(text) => {
    // 🚨 KHẨN CẤP: Remove spaces and limit to 6 digits
    const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 6);
    setCurrentEmailOtp(cleaned);
  }}
  keyboardType="numeric"
  maxLength={6}
/>

<TextInput
  style={styles.otpInput}
  placeholder="Nhập OTP từ email mới"
  value={newEmailOtp}
  onChangeText={(text) => {
    // 🚨 KHẨN CẤP: Remove spaces and limit to 6 digits
    const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 6);
    setNewEmailOtp(cleaned);
  }}
  keyboardType="numeric"
  maxLength={6}
/>
```

## 🚀 **QUICK FIX TEMPLATE:**

### **Copy và paste ngay vào file:**
```javascript
// Thay thế toàn bộ hàm handleVerifyOTPs
const handleVerifyOTPs = async () => {
  if (!currentEmailOtp || !newEmailOtp) {
    showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
    return;
  }

  try {
    setIsLoading(true);
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('Lỗi', 'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }
    
    // 🚨 KHẨN CẤP: Clean OTP values
    const cleanOldOtp = currentEmailOtp.replace(/\s/g, '').trim();
    const cleanNewOtp = newEmailOtp.replace(/\s/g, '').trim();
    
    console.log('🔧 Sending OTPs:', {
      oldEmailOtp: cleanOldOtp,
      newEmailOtp: cleanNewOtp,
      oldLength: cleanOldOtp.length,
      newLength: cleanNewOtp.length
    });
    
    const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldEmailOtp: cleanOldOtp,
        newEmailOtp: cleanNewOtp,
      }),
    });
    
    if (!response.ok) {
      let errorMessage = 'Xác thực thất bại';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('🔧 Error response:', errorData);
      } catch (parseError) {
        const errorText = await response.text();
        console.error('❌ Server returned non-JSON response:', errorText.substring(0, 200));
        errorMessage = `Server error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
      console.log('🔧 Success response:', data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      const responseText = await response.text();
      console.error('❌ Raw response:', responseText.substring(0, 200));
      throw new Error('Invalid server response format');
    }
    
    if (data.success) {
      showSuccessToast('Thành công', 'Email đã được thay đổi thành công');
      onSuccess();
    } else {
      throw new Error(data.message || 'Xác thực thất bại');
    }
  } catch (error: any) {
    console.error('❌ Verification error:', error);
    showErrorToast('Lỗi', error.message || 'Xác thực thất bại');
  } finally {
    setIsLoading(false);
  }
};
```

## 📋 **CHECKLIST KHẨN CẤP:**

1. **✅ Kiểm tra file `components/ChangeEmailVerification.tsx`**
2. **✅ Thêm OTP cleaning logic trong `handleVerifyOTPs`**
3. **✅ Thêm auto-formatting trong TextInput `onChangeText`**
4. **✅ Rebuild app**
5. **✅ Test với OTP có spaces**

## 🧪 **TEST NGAY LẬP TỨC:**

```bash
# Test OTP cleaning
node test-otp-verification-debug.js
```

**Expected output:**
```
OTP 1: "7 4 8 3 3 8" -> "748338" (length: 6)
OTP 2: "7 0 8 2 3 3" -> "708233" (length: 6)
```

## 🚨 **LƯU Ý KHẨN CẤP:**

- **User đang gặp lỗi ngay bây giờ**
- **Cần fix ngay lập tức**
- **Backend đã hoạt động đúng**
- **Vấn đề chỉ ở frontend**

**Hãy áp dụng fix này ngay lập tức!** 🚀
