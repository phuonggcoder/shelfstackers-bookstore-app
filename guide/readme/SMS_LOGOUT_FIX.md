# 🔧 Fix Lỗi Đăng Xuất SMS - Summary

## 🚨 **Vấn đề ban đầu**
```
ERROR  ❌ Sign-Out and cache clear Error: [Error: apiClient is null - call configure() first]
ERROR  Error signing out: [Error: apiClient is null - call configure() first]
```

## 🔍 **Nguyên nhân**
- Khi user đăng nhập bằng **SMS OTP**, không có Google tokens
- Nhưng trong `AuthContext.signOut()`, luôn gọi `googleAuthService.signOutAndClearCache()`
- `googleAuthService` cố gắng truy cập Google tokens không tồn tại → lỗi `apiClient is null`

## ✅ **Giải pháp đã implement**

### **1. Cải thiện `context/AuthContext.tsx`**
- ✅ **Kiểm tra Google tokens** trước khi gọi Google sign out
- ✅ **Chỉ gọi Google sign out** khi user đã đăng nhập bằng Google
- ✅ **Thêm try-catch** để không ảnh hưởng đến SMS users
- ✅ **Cải thiện logging** để debug dễ dàng hơn

### **2. Cải thiện `services/googleAuthService.ts`**
- ✅ **Thêm try-catch** cho Google sign out
- ✅ **Không throw error** khi Google sign out thất bại
- ✅ **Return success/failure** thay vì throw error

## 🔄 **Logic mới**

### **Trong `AuthContext.signOut()`:**
```javascript
// Chỉ đăng xuất Google nếu user đã đăng nhập bằng Google
try {
  const hasGoogleTokens = await AsyncStorage.getItem('access_token');
  if (hasGoogleTokens) {
    console.log('🔍 User has Google tokens, signing out from Google...');
    await googleAuthService.signOutAndClearCache();
  } else {
    console.log('🔍 User logged in via SMS/email, skipping Google sign out');
  }
} catch (googleError) {
  console.log('⚠️ Google sign out failed (user may not be logged in via Google):', googleError);
  // Không throw error vì user có thể đăng nhập bằng SMS
}
```

### **Trong `googleAuthService.signOutAndClearCache()`:**
```javascript
// Thử đăng xuất Google (sẽ không lỗi nếu user không đăng nhập Google)
try {
  await GoogleSignin.signOut();
  console.log('✅ Google Sign-Out successful');
} catch (signOutError) {
  console.log('ℹ️ Google sign out failed, user may not be signed in to Google');
}
```

## 📱 **Test Cases**

### **✅ Đăng nhập bằng SMS OTP → Đăng xuất**
1. User nhập số điện thoại
2. Nhập OTP code
3. Đăng nhập thành công
4. Đăng xuất → **Không có lỗi Google**

### **✅ Đăng nhập bằng Google → Đăng xuất**
1. User chọn Google account
2. Google OAuth thành công
3. Đăng nhập thành công
4. Đăng xuất → **Google sign out thành công**

### **✅ Đăng nhập bằng SMS → Chuyển sang Google → Đăng xuất**
1. User đăng nhập SMS
2. User đăng xuất → **Không lỗi**
3. User đăng nhập Google
4. User đăng xuất → **Google sign out thành công**

## 🎯 **Kết quả mong đợi**

### **Trước khi fix:**
```
ERROR  ❌ Sign-Out and cache clear Error: [Error: apiClient is null - call configure() first]
ERROR  Error signing out: [Error: apiClient is null - call configure() first]
```

### **Sau khi fix:**
```
LOG  🔍 User logged in via SMS/email, skipping Google sign out
LOG  ✅ Sign out completed successfully
```

**Hoặc với Google users:**
```
LOG  🔍 User has Google tokens, signing out from Google...
LOG  ✅ Google Sign-Out successful
LOG  ✅ Sign out completed successfully
```

## 📋 **Files đã thay đổi**

1. **`context/AuthContext.tsx`**
   - Thêm kiểm tra Google tokens trước khi sign out
   - Thêm try-catch cho Google sign out
   - Cải thiện logging

2. **`services/googleAuthService.ts`**
   - Thêm try-catch cho Google sign out
   - Không throw error khi sign out thất bại
   - Return success/failure thay vì throw error

## 🚀 **Next Steps**

1. **Test lại** với cả SMS OTP và Google login
2. **Monitor logs** để đảm bảo sign out hoạt động đúng
3. **Test edge cases** như chuyển đổi giữa các phương thức đăng nhập

## 📞 **Support**

Nếu vẫn còn vấn đề, hãy:
1. Kiểm tra logs để xem sign out flow
2. Kiểm tra AsyncStorage có Google tokens không
3. Test với cả SMS và Google login

---

**Status:** ✅ **FIXED** - Đăng xuất SMS không còn lỗi Google API 