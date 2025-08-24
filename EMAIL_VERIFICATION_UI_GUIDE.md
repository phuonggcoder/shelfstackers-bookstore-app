# Email Verification UI/UX System

## Tổng quan

Hệ thống xác thực email với UI/UX hiện đại cho ứng dụng React Native, hỗ trợ đầy đủ các tính năng:

- ✅ Đăng ký tài khoản với xác thực email
- ✅ Thay đổi email với xác thực 2 bước
- ✅ Đặt lại mật khẩu qua email
- ✅ UI/UX hiện đại với animations
- ✅ Responsive design
- ✅ Accessibility support

## Các Component Chính

### 1. EmailOTPVerification.tsx
Component chính cho xác thực OTP qua email với các tính năng:

**Props:**
```typescript
interface EmailOTPVerificationProps {
  email: string;                                    // Email cần xác thực
  onVerificationSuccess: (data: any) => void;      // Callback khi xác thực thành công
  onBack: () => void;                              // Callback khi quay lại
  type?: 'registration' | 'email-change' | 'password-reset'; // Loại xác thực
  onResendOTP?: () => Promise<void>;               // Custom function gửi lại OTP
  onVerifyOTP?: (otp: string) => Promise<any>;     // Custom function xác thực OTP
}
```

**Tính năng:**
- 🎨 UI hiện đại với gradient background
- 📱 Responsive design cho mobile
- ⚡ Auto-focus và auto-advance input
- ⏱️ Countdown timer cho resend OTP
- 🔄 Auto-verify khi nhập đủ 6 số
- 🎭 Smooth animations
- 🚨 Error handling và validation

### 2. EmailChangeVerification.tsx
Component cho việc thay đổi email với xác thực 2 bước:

**Props:**
```typescript
interface EmailChangeVerificationProps {
  currentEmail: string;                             // Email hiện tại
  onEmailChangeSuccess: (newEmail: string) => void; // Callback khi thay đổi thành công
  onBack: () => void;                              // Callback khi quay lại
  onSendOTP?: (email: string, type: 'current' | 'new') => Promise<void>;
  onVerifyOTP?: (email: string, otp: string, type: 'current' | 'new') => Promise<any>;
}
```

**Quy trình:**
1. Nhập email mới
2. Xác thực email hiện tại
3. Xác thực email mới
4. Hiển thị thành công

### 3. EmailVerificationDemo.tsx
Component demo để test tất cả tính năng:

**Tính năng demo:**
- 🎯 Menu chọn loại xác thực
- 📧 Demo đăng ký tài khoản
- 🔄 Demo thay đổi email
- 🔑 Demo đặt lại mật khẩu
- 📱 Responsive và interactive

## Cách Sử Dụng

### 1. Cài đặt Dependencies

```bash
npm install expo-linear-gradient @expo/vector-icons
```

### 2. Import Components

```typescript
import EmailOTPVerification from './components/EmailOTPVerification';
import EmailChangeVerification from './components/EmailChangeVerification';
import EmailVerificationDemo from './components/EmailVerificationDemo';
```

### 3. Sử dụng trong Registration

```typescript
import React, { useState } from 'react';
import EmailOTPVerification from './components/EmailOTPVerification';

const Register = () => {
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [email, setEmail] = useState('');

  const handleEmailVerificationSuccess = (data: any) => {
    // Xử lý khi xác thực thành công
    console.log('Email verified:', data);
    // Chuyển đến bước tiếp theo
  };

  const handleSendOTP = async () => {
    // Gọi API gửi OTP
    await emailService.sendOTP(email);
  };

  const handleVerifyOTP = async (otp: string) => {
    // Gọi API xác thực OTP
    return await emailService.verifyOTP(email, otp);
  };

  if (step === 'verification') {
    return (
      <EmailOTPVerification
        email={email}
        onVerificationSuccess={handleEmailVerificationSuccess}
        onBack={() => setStep('form')}
        type="registration"
        onResendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
      />
    );
  }

  // Render registration form
  return <RegistrationForm onNext={() => setStep('verification')} />;
};
```

### 4. Sử dụng cho Email Change

```typescript
import React from 'react';
import EmailChangeVerification from './components/EmailChangeVerification';

const EmailChangeScreen = () => {
  const currentEmail = 'user@example.com';

  const handleEmailChangeSuccess = (newEmail: string) => {
    // Cập nhật email trong database
    console.log('Email changed to:', newEmail);
  };

  const handleSendOTP = async (email: string, type: 'current' | 'new') => {
    // Gọi API gửi OTP cho email cũ hoặc mới
    await emailService.sendOTP(email, type);
  };

  const handleVerifyOTP = async (email: string, otp: string, type: 'current' | 'new') => {
    // Gọi API xác thực OTP
    return await emailService.verifyOTP(email, otp, type);
  };

  return (
    <EmailChangeVerification
      currentEmail={currentEmail}
      onEmailChangeSuccess={handleEmailChangeSuccess}
      onBack={() => navigation.goBack()}
      onSendOTP={handleSendOTP}
      onVerifyOTP={handleVerifyOTP}
    />
  );
};
```

### 5. Chạy Demo

```typescript
import React from 'react';
import EmailVerificationDemo from './components/EmailVerificationDemo';

const DemoScreen = () => {
  return <EmailVerificationDemo />;
};
```

## API Integration

### 1. Email Service Interface

```typescript
interface EmailService {
  sendOTP(email: string, type?: 'registration' | 'email-change' | 'password-reset'): Promise<void>;
  verifyOTP(email: string, otp: string, type?: 'current' | 'new'): Promise<any>;
  resendOTP(email: string): Promise<void>;
}
```

### 2. Example Implementation

```typescript
class EmailService {
  async sendOTP(email: string, type = 'registration') {
    const response = await fetch('/api/email/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send OTP');
    }
    
    return response.json();
  }

  async verifyOTP(email: string, otp: string, type?: 'current' | 'new') {
    const response = await fetch('/api/email/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type })
    });
    
    if (!response.ok) {
      throw new Error('Invalid OTP');
    }
    
    return response.json();
  }
}
```

## UI/UX Features

### 1. Visual Design
- 🎨 **Gradient Backgrounds**: Sử dụng LinearGradient cho hiệu ứng đẹp mắt
- 🎯 **Modern Icons**: Ionicons cho consistency
- 📱 **Responsive Layout**: Tự động điều chỉnh theo kích thước màn hình
- 🎭 **Smooth Animations**: Fade-in, slide-up animations

### 2. User Experience
- ⚡ **Auto-focus**: Tự động focus vào input đầu tiên
- 🔄 **Auto-advance**: Tự động chuyển sang input tiếp theo
- ⏱️ **Countdown Timer**: Hiển thị thời gian chờ gửi lại OTP
- 🚨 **Real-time Validation**: Kiểm tra lỗi ngay lập tức
- 🎯 **Auto-verify**: Tự động xác thực khi nhập đủ 6 số

### 3. Accessibility
- ♿ **Screen Reader Support**: Proper labels và descriptions
- 🎨 **High Contrast**: Màu sắc tương phản tốt
- 📏 **Touch Targets**: Kích thước button phù hợp (44px minimum)
- 🔤 **Readable Fonts**: Font size và weight phù hợp

## Customization

### 1. Theme Colors

```typescript
const theme = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4CAF50',
  error: '#ff6b6b',
  background: 'rgba(255, 255, 255, 0.1)',
  text: '#fff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
};
```

### 2. Custom Styles

```typescript
const customStyles = StyleSheet.create({
  container: {
    // Custom container styles
  },
  input: {
    // Custom input styles
  },
  button: {
    // Custom button styles
  },
});
```

### 3. Localization

```typescript
const translations = {
  vi: {
    'emailVerification.title': 'Xác thực email',
    'emailVerification.description': 'Nhập mã OTP đã được gửi đến email của bạn',
    'emailVerification.verify': 'Xác thực',
    'emailVerification.resend': 'Gửi lại',
  },
  en: {
    'emailVerification.title': 'Email Verification',
    'emailVerification.description': 'Enter the OTP sent to your email',
    'emailVerification.verify': 'Verify',
    'emailVerification.resend': 'Resend',
  },
};
```

## Best Practices

### 1. Security
- 🔒 **Rate Limiting**: Giới hạn số lần gửi OTP
- ⏱️ **OTP Expiration**: OTP có thời hạn (5-10 phút)
- 🔄 **OTP Regeneration**: Tạo OTP mới mỗi lần gửi
- 🛡️ **Input Validation**: Validate OTP format

### 2. Performance
- ⚡ **Lazy Loading**: Load components khi cần
- 🎯 **Memoization**: Sử dụng React.memo cho optimization
- 📱 **Platform Specific**: Tối ưu cho iOS và Android
- 🎨 **Animation Optimization**: Sử dụng useNativeDriver

### 3. Error Handling
- 🚨 **User-friendly Messages**: Thông báo lỗi dễ hiểu
- 🔄 **Retry Mechanisms**: Cho phép thử lại khi lỗi
- 📱 **Offline Support**: Xử lý khi không có internet
- 🎯 **Graceful Degradation**: Fallback khi component lỗi

## Testing

### 1. Unit Tests

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmailOTPVerification from './EmailOTPVerification';

describe('EmailOTPVerification', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <EmailOTPVerification
        email="test@example.com"
        onVerificationSuccess={jest.fn()}
        onBack={jest.fn()}
      />
    );
    
    expect(getByText('Xác thực đăng ký')).toBeTruthy();
  });

  it('should handle OTP input correctly', () => {
    // Test OTP input functionality
  });

  it('should call onVerificationSuccess when OTP is valid', () => {
    // Test verification success
  });
});
```

### 2. Integration Tests

```typescript
describe('Email Verification Flow', () => {
  it('should complete registration flow', async () => {
    // Test complete registration flow
  });

  it('should handle email change flow', async () => {
    // Test email change flow
  });
});
```

## Troubleshooting

### 1. Common Issues

**OTP không nhận được:**
- Kiểm tra spam folder
- Verify email address
- Check API configuration

**Animation không mượt:**
- Enable useNativeDriver
- Check device performance
- Reduce animation complexity

**Layout bị vỡ:**
- Check responsive design
- Test on different screen sizes
- Verify flex properties

### 2. Debug Tips

```typescript
// Enable debug mode
const DEBUG = __DEV__;

// Add console logs
if (DEBUG) {
  console.log('OTP Verification:', { email, otp });
}

// Use React DevTools
// Install react-devtools for debugging
```

## Conclusion

Hệ thống xác thực email này cung cấp:

- ✅ **Complete Solution**: Đầy đủ tính năng xác thực email
- ✅ **Modern UI/UX**: Thiết kế hiện đại và user-friendly
- ✅ **Flexible**: Dễ dàng customize và extend
- ✅ **Secure**: Implement security best practices
- ✅ **Performant**: Optimized cho performance
- ✅ **Accessible**: Support accessibility standards

Với hệ thống này, bạn có thể dễ dàng tích hợp xác thực email vào ứng dụng React Native của mình với trải nghiệm người dùng tốt nhất.
