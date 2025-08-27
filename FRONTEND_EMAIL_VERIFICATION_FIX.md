# 🔧 Hướng Dẫn Sửa Lỗi Xác Thực OTP Đổi Email

## 🚨 **Vấn đề hiện tại:**
- ❌ Lỗi: "Cả hai mã OTP đều bắt buộc"
- ❌ Frontend không gửi đúng format OTP

## 🔧 **Giải pháp nhanh:**

### **React Native:**
```javascript
const verifyEmailChange = async (oldEmailOtp, newEmailOtp) => {
  const token = await AsyncStorage.getItem('access_token');
  
  const response = await axios.post(
    'https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change',
    {
      oldEmailOtp: oldEmailOtp.trim(),
      newEmailOtp: newEmailOtp.trim()
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};
```

### **Web:**
```javascript
const verifyEmailChange = async (oldEmailOtp, newEmailOtp) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(
    'https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldEmailOtp: oldEmailOtp.trim(),
        newEmailOtp: newEmailOtp.trim()
      })
    }
  );
  
  return response.json();
};
```

## ✅ **Đúng Format:**
```json
{
  "oldEmailOtp": "123456",
  "newEmailOtp": "789012"
}
```

## 🎯 **Tóm Tắt Vấn Đề và Giải Pháp:**

### ✅ **Backend đã hoạt động hoàn hảo:**
1. **Đổi email thành công**: OTP đã được gửi đến cả 2 email
2. **Endpoint verify-email-change hoạt động đúng**: Yêu cầu cả `oldEmailOtp` và `newEmailOtp`

### ❌ **Vấn đề ở Frontend:**
Lỗi "Cả hai mã OTP đều bắt buộc" có nghĩa là frontend không gửi đúng format.

### 🔧 **Giải pháp cho Frontend:**

#### **React Native:**
```javascript
// Thay thế đoạn code gọi API hiện tại bằng:
const response = await axios.post(
  'https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change',
  {
    oldEmailOtp: oldEmailOtp.trim(),
    newEmailOtp: newEmailOtp.trim()
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

#### **Web:**
```javascript
const response = await fetch(
  'https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      oldEmailOtp: oldEmailOtp.trim(),
      newEmailOtp: newEmailOtp.trim()
    })
  }
);
```

### 📋 **Checklist cho Frontend Developer:**

1. **✅ Đảm bảo field names đúng**: `oldEmailOtp` và `newEmailOtp`
2. **✅ Đảm bảo OTP không rỗng**: Sử dụng `.trim()` để loại bỏ khoảng trắng
3. **✅ Đảm bảo có authentication token**
4. **✅ Đảm bảo Content-Type header đúng**

### 🎯 **Expected Success Response:**
```json
{
  "success": true,
  "message": "Email đã được đổi thành công",
  "old_email": "y2mtlath@gmail.com",
  "new_email": "nguyenchaungan2020pd@gmail.com"
}
```

## 🔧 **Chi tiết sửa lỗi:**

### **1. Kiểm tra field names:**
```javascript
// ❌ Sai
{
  "old_email_otp": "123456",
  "new_email_otp": "789012"
}

// ✅ Đúng
{
  "oldEmailOtp": "123456",
  "newEmailOtp": "789012"
}
```

### **2. Kiểm tra OTP format:**
```javascript
// ❌ Có thể có spaces
const oldOtp = "123 456";
const newOtp = "789 012";

// ✅ Clean OTP
const oldOtp = "123456";
const newOtp = "789012";
```

### **3. Kiểm tra authentication:**
```javascript
// ❌ Thiếu token
const response = await fetch('/api/users/verify-email-change', {
  method: 'POST',
  body: JSON.stringify({ oldEmailOtp, newEmailOtp })
});

// ✅ Có token
const response = await fetch('/api/users/verify-email-change', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ oldEmailOtp, newEmailOtp })
});
```

## 🧪 **Test Cases:**

### **Test 1: Valid OTPs**
```javascript
const testData = {
  oldEmailOtp: "123456",
  newEmailOtp: "789012"
};
// Expected: Success
```

### **Test 2: Empty OTPs**
```javascript
const testData = {
  oldEmailOtp: "",
  newEmailOtp: ""
};
// Expected: "Cả hai mã OTP đều bắt buộc"
```

### **Test 3: Partial OTPs**
```javascript
const testData = {
  oldEmailOtp: "123456",
  newEmailOtp: ""
};
// Expected: "Cả hai mã OTP đều bắt buộc"
```

### **Test 4: Invalid Token**
```javascript
const headers = {
  'Authorization': 'Bearer invalid_token',
  'Content-Type': 'application/json'
};
// Expected: "Invalid token"
```

## 🚀 **Quick Fix Template:**

### **React Native Component:**
```javascript
const handleVerifyOTPs = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showErrorToast('Lỗi', 'Không tìm thấy token đăng nhập');
      return;
    }

    const response = await fetch(
      'https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldEmailOtp: currentEmailOtp.trim(),
          newEmailOtp: newEmailOtp.trim()
        })
      }
    );

    const data = await response.json();
    if (data.success) {
      showSuccessToast('Thành công', 'Email đã được đổi thành công');
    } else {
      showErrorToast('Lỗi', data.message);
    }
  } catch (error) {
    showErrorToast('Lỗi', error.message);
  }
};
```

### **Web Component:**
```javascript
const handleVerifyOTPs = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Không tìm thấy token đăng nhập');
      return;
    }

    const response = await fetch(
      'https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldEmailOtp: currentEmailOtp.trim(),
          newEmailOtp: newEmailOtp.trim()
        })
      }
    );

    const data = await response.json();
    if (data.success) {
      alert('Email đã được đổi thành công');
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert(error.message);
  }
};
```

## 📞 **Hỗ trợ:**

Nếu vẫn gặp lỗi sau khi áp dụng các fix trên, hãy:

1. **Kiểm tra console logs** để xem chi tiết lỗi
2. **Verify token** có hợp lệ không
3. **Kiểm tra network tab** để xem request/response
4. **Test với Postman** để verify endpoint

**Hãy sử dụng hướng dẫn này để sửa lỗi frontend!** 🚀
