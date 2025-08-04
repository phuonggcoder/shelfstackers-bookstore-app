# 🔥 Hướng dẫn tích hợp FCM Token từ Frontend

## 📋 **Tổng quan**

Frontend sẽ gửi FCM token lên Backend để đăng ký nhận thông báo đẩy (push notification) cho từng user và device.

## 🚀 **Khi nào FE gửi FCM token?**

### **1. Sau khi đăng nhập thành công**
- User đăng nhập bằng email/password
- User đăng nhập bằng Google OAuth
- User đăng nhập bằng SMS OTP

### **2. Khi app khởi động (nếu đã đăng nhập)**
- App restart với user đã login
- Token refresh từ Firebase

## 📤 **Dữ liệu FE gửi lên BE**

### **Endpoint:** `POST /auth/register-device-token`

```json
{
  "deviceToken": "eZNziuCvR9m2VCxyhqsKXu:APA91bFKAp__9GQOQ0f9segiXEy5ls8tWjmgcIbiYNWK8Lm4KU5xgULMJmafVeFjCy4hFIZ9atf-ZZhCftZTC8WxFnGHKQziQM6QDDcAhBcVqCpwjYARPRM",
  "deviceId": "android_1753870155743_lurmj17vf"
}
```

### **Headers:**
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

## 🔧 **Yêu cầu Backend**

### **1. Xác thực**
- Validate JWT token trong header `Authorization`
- Trích xuất `userId` từ JWT token

### **2. Validation**
- Kiểm tra `deviceToken` không null/empty
- Kiểm tra `deviceId` không null/empty
- Validate format FCM token (bắt đầu với project ID)

### **3. Lưu trữ**
- Lưu `deviceToken` gắn với `userId` và `deviceId`
- Cập nhật nếu device đã tồn tại
- Có thể lưu thêm metadata: `platform`, `appVersion`, `lastSyncTime`

### **4. Response**
```json
// Success (200)
{
  "success": true,
  "message": "Device token registered successfully",
  "deviceToken": "eZNziuCvR9m2VCxyhqsKXu:APA91bFKAp__9GQOQ0f9segiXEy5ls8tWjmgcIbiYNWK8Lm4KU5xgULMJmafVeFjCy4hFIZ9atf-ZZhCftZTC8WxFnGHKQziQM6QDDcAhBcVqCpwjYARPRM",
  "deviceId": "android_1753870155743_lurmj17vf"
}

// Error (400)
{
  "success": false,
  "message": "Invalid device token",
  "error": "DEVICE_TOKEN_INVALID"
}

// Error (401)
{
  "success": false,
  "message": "Unauthorized",
  "error": "INVALID_TOKEN"
}
```

## 🗑️ **Xóa FCM Token**

### **Endpoint:** `DELETE /auth/unregister-device-token`

```json
{
  "deviceToken": "eZNziuCvR9m2VCxyhqsKXu:APA91bFKAp__9GQOQ0f9segiXEy5ls8tWjmgcIbiYNWK8Lm4KU5xgULMJmafVeFjCy4hFIZ9atf-ZZhCftZTC8WxFnGHKQziQM6QDDcAhBcVqCpwjYARPRM"
}
```

## 📊 **Database Schema (Gợi ý)**

```sql
CREATE TABLE device_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_token TEXT NOT NULL,
  platform VARCHAR(50) DEFAULT 'android',
  app_version VARCHAR(50),
  last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_device (user_id, device_id),
  INDEX idx_device_token (device_token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔄 **Retry Logic**

### **Frontend sẽ retry 3 lần:**
1. **Lần 1:** Ngay sau khi đăng nhập
2. **Lần 2:** Sau 1 giây (nếu FCM token chưa sẵn sàng)
3. **Lần 3:** Sau 2 giây (nếu vẫn chưa sẵn sàng)

### **Backend nên handle:**
- Duplicate device token (upsert)
- Invalid/expired FCM token
- Rate limiting cho API calls

## 🚨 **Error Handling**

### **Common Errors:**
- `DEVICE_TOKEN_INVALID`: FCM token format không đúng
- `DEVICE_ID_MISSING`: Thiếu device ID
- `USER_NOT_FOUND`: User không tồn tại
- `TOKEN_EXPIRED`: JWT token hết hạn
- `RATE_LIMIT_EXCEEDED`: Quá nhiều request

### **Logging:**
- Log tất cả FCM token registration attempts
- Log errors với context (userId, deviceId, error message)
- Monitor failed registrations

## 📱 **Testing**

### **Test Cases:**
1. **Đăng nhập lần đầu** → FCM token được register
2. **Đăng nhập lại** → FCM token được update
3. **Đăng xuất** → FCM token được unregister
4. **App restart** → FCM token được re-register
5. **Token refresh** → FCM token được update

### **Test Data:**
```json
{
  "deviceToken": "test_fcm_token_123",
  "deviceId": "test_device_android_001"
}
```

## 🔗 **Related Endpoints**

- `POST /session` - Tạo session khi login
- `POST /session/fcm` - Update FCM token vào session
- `DELETE /session` - Xóa session khi logout

---

## 📞 **Support**

Nếu có vấn đề gì, hãy liên hệ Frontend team! 🚀 