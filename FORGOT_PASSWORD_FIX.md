# 🔧 Sửa Forgot Password Endpoint

## 📋 **Vấn đề hiện tại:**

Frontend gửi request với format cũ:
```json
{
  "email": "y2mtlath@gmail.com"
}
```

Nhưng backend yêu cầu format mới:
```json
{
  "identifier": "y2mtlath@gmail.com",
  "method": "email"
}
```

## 🔧 **Giải pháp - Sửa backend endpoint:**

Thay thế logic trong endpoint `/forgot-password`:

```javascript
// Quên mật khẩu - Hỗ trợ cả Email và SMS
userRouter.post("/forgot-password", async (req, res) => {
    try {
        // Hỗ trợ cả format cũ và mới
        let { identifier, method, email } = req.body;
        
        // Backward compatibility: nếu có email nhưng không có identifier
        if (email && !identifier) {
            identifier = email;
            method = 'email';
        }
        
        if (!identifier || !method) {
            return res.status(400).json({ 
                success: false,
                message: 'Thông tin tài khoản và phương thức xác thực là bắt buộc' 
            });
        }

        if (!['email', 'sms'].includes(method)) {
            return res.status(400).json({ 
                success: false,
                message: 'Phương thức xác thực phải là "email" hoặc "sms"' 
            });
        }

        // Find user by identifier (email, phone, or username)
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone_number: identifier },
                { username: identifier }
            ]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy tài khoản với thông tin đã cung cấp' 
            });
        }

        // Check if user has the required verification method
        if (method === 'email' && !user.email) {
            return res.status(400).json({ 
                success: false,
                message: 'Tài khoản không có email để xác thực' 
            });
        }

        if (method === 'sms' && !user.phone_number) {
            return res.status(400).json({ 
                success: false,
                message: 'Tài khoản không có số điện thoại để xác thực' 
            });
        }

        // Generate reset token
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to user
        user.password_reset_token = resetToken;
        user.password_reset_expires = resetTokenExpires;
        await user.save();

        if (method === 'email') {
            // Send password reset email
            const emailService = require('../services/emailService');
            try {
                await emailService.sendPasswordResetEmail(user.email, resetToken);
                console.log('✅ Password reset email sent successfully to:', user.email);
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
                return res.status(500).json({ 
                    success: false,
                    message: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.' 
                });
            }

            res.json({
                success: true,
                message: 'Email đặt lại mật khẩu đã được gửi',
                method: 'email',
                email: user.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : null
            });
        } else if (method === 'sms') {
            // Send SMS OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Save OTP to user
            user.sms_otp = otp;
            user.sms_otp_expires = otpExpires;
            await user.save();

            // Send SMS
            const { sendOtpSms } = require('../services/esms.service');
            const smsResult = await sendOtpSms(user.phone_number, otp);
            
            if (smsResult.CodeResult !== '100') {
                console.error('SMS sending failed:', smsResult);
                return res.status(500).json({ 
                    success: false,
                    message: 'Không thể gửi SMS. Vui lòng thử lại sau.' 
                });
            }

            console.log('✅ Password reset SMS sent successfully to:', user.phone_number);

            res.json({
                success: true,
                message: 'SMS đặt lại mật khẩu đã được gửi',
                method: 'sms',
                phone: user.phone_number ? `***${user.phone_number.slice(-4)}` : null
            });
        }
    } catch (error) {
        console.error('❌ Error in forgot password:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi khi xử lý yêu cầu quên mật khẩu',
            error: error.message
        });
    }
});
```

## 🧪 **Test sau khi sửa:**

```bash
# Test với format cũ (email)
Invoke-WebRequest -Uri "http://localhost:3000/api/users/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"y2mtlath@gmail.com"}'

# Test với format mới (identifier + method)
Invoke-WebRequest -Uri "http://localhost:3000/api/users/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"identifier":"y2mtlath@gmail.com","method":"email"}'
```

## ✅ **Kết quả mong đợi:**

- ✅ Hỗ trợ format cũ: `{ email: "..." }`
- ✅ Hỗ trợ format mới: `{ identifier: "...", method: "email" }`
- ✅ Backward compatibility
- ✅ Email đặt lại mật khẩu được gửi thành công

---

**Lưu ý:** Sau khi sửa backend, restart server và test lại!

