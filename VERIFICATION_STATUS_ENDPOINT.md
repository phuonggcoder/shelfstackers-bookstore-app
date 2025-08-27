# 🔧 Thêm Endpoint Verification Status

## 📋 **Endpoint cần thêm vào backend:**

Thêm endpoint sau vào file `userRouter` (trong file backend của bạn):

```javascript
// Kiểm tra trạng thái verification của user
userRouter.get("/verification-status", async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email là bắt buộc' 
            });
        }

        // Tìm user theo email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy tài khoản với email này' 
            });
        }

        console.log('🔧 Verification status check for:', email);

        res.json({
            success: true,
            verification: {
                is_verified: user.is_verified || false,
                status: user.is_verified ? 'verified' : 'pending',
                email: user.email,
                attempts: user.email_verification_attempts || 0,
                last_sent: user.last_verification_sent || null,
                user_id: user._id
            }
        });

    } catch (error) {
        console.error('❌ Error checking verification status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái verification',
            error: error.message
        });
    }
});
```

## 📍 **Vị trí thêm:**

Thêm endpoint này vào cuối file `userRouter`, trước dòng `module.exports = userRouter;`

## 🔄 **Cách sử dụng:**

### **Frontend gọi API:**
```javascript
// Trong authService.checkUserVerification()
const response = await axios.get(`${USER_URL}/verification-status`, {
  params: { email }
});
```

### **Response format:**
```json
{
  "success": true,
  "verification": {
    "is_verified": false,
    "status": "pending",
    "email": "user@example.com",
    "attempts": 0,
    "last_sent": null,
    "user_id": "507f1f77bcf86cd799439011"
  }
}
```

## 🧪 **Test endpoint:**

Sau khi thêm endpoint, chạy test:

```bash
node test-verification-status.js
```

## ✅ **Kết quả mong đợi:**

- Endpoint trả về trạng thái verification của user
- Frontend có thể kiểm tra `is_verified` để quyết định có hiển thị form OTP hay không
- User chưa verified sẽ được chuyển sang màn hình email verification
- User đã verified sẽ đăng nhập bình thường

---

**Lưu ý:** Đảm bảo thêm endpoint này vào đúng vị trí trong file backend và restart server sau khi thêm.
