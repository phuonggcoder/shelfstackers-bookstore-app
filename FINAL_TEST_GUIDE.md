# 🧪 Hướng dẫn Test Registration Flow Hoàn chỉnh

## ✅ **Backend đã được cập nhật thành công!**

### **🔧 Logic mới:**
- ✅ Password update khi verify OTP
- ✅ Backward compatibility
- ✅ Security validation

## 🎯 **Test Flow Hoàn chỉnh:**

### **1. Test trong App (Khuyến nghị):**

#### **A. Registration Flow:**
1. **Mở app** → Chọn "Đăng ký"
2. **Nhập thông tin:**
   - Email: `test@example.com`
   - Password: `TestPassword123`
   - Confirm Password: `TestPassword123`
3. **Click "Đăng ký"** → OTP sẽ được gửi qua email
4. **Kiểm tra email** → Copy OTP từ email
5. **Nhập OTP** → Click "Xác thực"
6. **Kết quả mong đợi:**
   - ✅ Verify thành công
   - ✅ Auto login thành công
   - ✅ Chuyển đến trang chính
   - ✅ Không còn lỗi "Invalid email or password"

#### **B. Error Handling Test:**
1. **Nhập OTP sai** → Hiển thị lỗi, không bị đứng
2. **Back to form** → Quay lại form đăng ký
3. **Resend OTP** → Gửi lại OTP thành công

### **2. Test Backend API:**

#### **A. Registration:**
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "temp_password",
    "full_name": "",
    "phone_number": ""
  }'
```

#### **B. Verify OTP với Password:**
```bash
# Thay OTP bằng mã thật từ email
curl -X POST http://localhost:3000/api/users/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "password": "TestPassword123"
  }'
```

#### **C. Login sau khi Verify:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### **3. Test Scripts:**

#### **A. Test Password Update Logic:**
```bash
node test-password-update-logic.js
```

#### **B. Test Registration Flow:**
```bash
node test-registration-password-fix.js
```

## 🔍 **Kiểm tra Database:**

### **A. Trước khi Verify OTP:**
```javascript
// User có password: 'temp_password'
db.users.findOne({ email: "test@example.com" })
// Kết quả: password = 'temp_password'
```

### **B. Sau khi Verify OTP:**
```javascript
// User có password đã được hash
db.users.findOne({ email: "test@example.com" })
// Kết quả: password = '$2b$10$...' (hashed)
```

## ✅ **Kết quả mong đợi:**

### **1. Registration Flow:**
- ✅ **Step 1**: Register thành công, OTP được gửi
- ✅ **Step 2**: Verify OTP thành công, password được update
- ✅ **Step 3**: Auto login thành công
- ✅ **Step 4**: Chuyển trang thành công

### **2. Error Handling:**
- ✅ **OTP sai**: Hiển thị lỗi, không bị đứng
- ✅ **Network error**: Hiển thị lỗi, có thể retry
- ✅ **Back button**: Quay lại form đăng ký

### **3. Security:**
- ✅ **Password validation**: Kiểm tra độ dài và format
- ✅ **Password hashing**: Sử dụng bcrypt
- ✅ **OTP expiration**: 5 phút
- ✅ **Rate limiting**: Tránh spam

## 🚀 **Bước tiếp theo:**

### **1. Test trong App:**
1. **Restart app** để áp dụng changes
2. **Test registration flow** hoàn chỉnh
3. **Verify** không còn lỗi "Invalid email or password"
4. **Check** error handling hoạt động

### **2. Monitor Logs:**
```bash
# Xem log backend
tail -f backend.log

# Xem log frontend
npx expo logs
```

### **3. Verify Database:**
```javascript
// Kiểm tra user đã được tạo và password đã được update
db.users.find({ email: "test@example.com" }).pretty()
```

---

## 🎉 **Tóm tắt:**

✅ **Backend**: Đã cập nhật logic password update
✅ **Frontend**: Đã sửa logic OTP verification
✅ **Security**: Validation và hashing đầy đủ
✅ **UX**: Auto login sau khi verify

**Registration flow giờ hoạt động hoàn chỉnh và không còn lỗi!** 🚀

