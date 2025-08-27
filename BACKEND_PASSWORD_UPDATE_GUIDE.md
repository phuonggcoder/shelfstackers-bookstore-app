# 🔧 Backend: Hỗ trợ Cập nhật Password khi Verify OTP

## 📋 **Vấn đề hiện tại:**

Frontend gửi registration với `password: 'temp_password'` nhưng khi verify OTP, password không được cập nhật thành password thật.

## 🔍 **Nguyên nhân:**

1. **Registration step**: Tạo user với `password: 'temp_password'`
2. **OTP verification step**: Chỉ verify email, không cập nhật password
3. **Login step**: User cố gắng login với password thật nhưng backend vẫn lưu `temp_password`

## 🔧 **Giải pháp cho Backend:**

### **1. Sửa endpoint `/verify-email-otp`:**

```javascript
// Xác thực OTP email
userRouter.post("/verify-email-otp", async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email và OTP là bắt buộc"
            });
        }

        // Tìm user theo email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        // Kiểm tra OTP
        if (user.email_verification_otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP không đúng"
            });
        }

        // Kiểm tra OTP hết hạn
        if (user.email_verification_expires < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Mã OTP đã hết hạn"
            });
        }

        // ✅ MỚI: Cập nhật password nếu có
        if (password && password !== 'temp_password') {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            user.password = hashedPassword;
            console.log('🔧 Password updated during OTP verification');
        }

        // Cập nhật trạng thái verification
        user.is_verified = true;
        user.email_verification_otp = null;
        user.email_verification_expires = null;
        user.verified_at = new Date();

        await user.save();

        console.log('✅ Email verification successful for:', email);

        res.json({
            success: true,
            message: "Email đã được xác thực thành công",
            user: {
                id: user._id,
                email: user.email,
                is_verified: user.is_verified
            }
        });

    } catch (error) {
        console.error('❌ Error in verify-email-otp:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xác thực email",
            error: error.message
        });
    }
});
```

### **2. Cập nhật interface cho Frontend:**

```typescript
// Frontend sẽ gửi:
{
  email: "user@example.com",
  otp: "123456",
  password: "RealPassword123" // Optional - chỉ gửi khi verify registration
}
```

### **3. Logic xử lý:**

```javascript
// Kiểm tra và cập nhật password
if (password && password !== 'temp_password') {
    // Đây là registration verification
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;
    console.log('🔧 Registration: Password updated');
} else {
    // Đây là email verification thông thường (không đổi password)
    console.log('🔧 Email verification: No password update');
}
```

## ✅ **Kết quả mong đợi:**

### **Flow hoạt động:**
1. ✅ **Registration**: Tạo user với `temp_password`
2. ✅ **OTP Verification**: Verify email + cập nhật password thật
3. ✅ **Auto Login**: Login thành công với password thật
4. ✅ **User Experience**: Không cần đăng nhập lại

### **Test Cases:**
```bash
# Test 1: Registration với password update
curl -X POST http://localhost:3000/api/users/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","password":"RealPassword123"}'

# Test 2: Email verification thông thường (không có password)
curl -X POST http://localhost:3000/api/users/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

## 🔒 **Bảo mật:**

1. ✅ **Password validation**: Kiểm tra password hợp lệ
2. ✅ **Hashing**: Luôn hash password trước khi lưu
3. ✅ **Backward compatibility**: Vẫn hỗ trợ verify không có password
4. ✅ **Logging**: Ghi log khi cập nhật password

---

**Lưu ý:** Sau khi cập nhật backend, registration flow sẽ hoạt động hoàn chỉnh!

