# Email Verification và Messaging System Setup Guide

## Tổng quan

Hệ thống này đã được tích hợp vào frontend app với các tính năng:
1. **Email Verification System**: Xác thực email bằng OTP
2. **Messaging System**: Hệ thống nhắn tin hỗ trợ khách hàng

## 1. Cấu trúc Files đã tạo

### Services
- `services/emailService.ts` - Service cho email verification
- `services/messageService.ts` - Service cho messaging system

### Components
- `components/EmailVerificationModal.tsx` - Modal xác thực email
- `components/SupportChat.tsx` - Component chat hỗ trợ

### Hooks
- `hooks/useEmailVerification.ts` - Custom hook cho email verification
- `hooks/useMessaging.ts` - Custom hook cho messaging

### Config
- `config/api.ts` - Cập nhật API endpoints

### Translations
- `app/locales/en/en.json` - English translations
- `app/locales/vi/vi.json` - Vietnamese translations

## 2. Cách sử dụng Email Verification

### 2.1 Sử dụng EmailVerificationModal

```tsx
import EmailVerificationModal from '../components/EmailVerificationModal';

const YourComponent = () => {
  const [showVerification, setShowVerification] = useState(false);
  const [email, setEmail] = useState('');

  const handleVerificationSuccess = (data: any) => {
    console.log('Email verified successfully:', data);
    // Xử lý sau khi xác thực thành công
  };

  return (
    <EmailVerificationModal
      visible={showVerification}
      email={email}
      onClose={() => setShowVerification(false)}
      onSuccess={handleVerificationSuccess}
      type="registration" // 'registration' | 'forgot-password' | 'email-change'
    />
  );
};
```

### 2.2 Sử dụng useEmailVerification Hook

```tsx
import { useEmailVerification } from '../hooks/useEmailVerification';

const YourComponent = () => {
  const { loading, error, sendOTP, verifyOTP, resendOTP, clearError } = useEmailVerification();

  const handleSendOTP = async () => {
    const success = await sendOTP('user@example.com');
    if (success) {
      console.log('OTP sent successfully');
    }
  };

  const handleVerifyOTP = async () => {
    const success = await verifyOTP('user@example.com', '123456');
    if (success) {
      console.log('OTP verified successfully');
    }
  };

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
        <Text>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2.3 Sử dụng emailService trực tiếp

```tsx
import emailService from '../services/emailService';

const handleEmailVerification = async () => {
  try {
    // Gửi OTP
    const sendResponse = await emailService.sendRegistrationOTP('user@example.com');
    
    // Xác thực OTP
    const verifyResponse = await emailService.verifyEmailOTP('user@example.com', '123456');
    
    // Kiểm tra trạng thái xác thực
    const statusResponse = await emailService.getVerificationStatus();
    
    console.log('Verification status:', statusResponse.isVerified);
  } catch (error) {
    console.error('Verification error:', error);
  }
};
```

## 3. Cách sử dụng Messaging System

### 3.1 Sử dụng SupportChat Component

```tsx
import SupportChat from '../components/SupportChat';

const YourComponent = () => {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <Modal visible={showSupport} animationType="slide">
      <SupportChat onClose={() => setShowSupport(false)} />
    </Modal>
  );
};
```

### 3.2 Sử dụng useMessaging Hook

```tsx
import { useMessaging } from '../hooks/useMessaging';

const YourComponent = () => {
  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    createConversation,
  } = useMessaging();

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSendMessage = async () => {
    if (selectedConversation) {
      const success = await sendMessage(selectedConversation.conversationId, {
        content: 'Hello, I need help!',
        type: 'text',
      });
      
      if (success) {
        console.log('Message sent successfully');
      }
    }
  };

  const handleCreateTicket = async () => {
    const success = await createConversation({
      subject: 'Order Issue',
      category: 'order',
      description: 'I have a problem with my order',
      priority: 'medium',
    });
    
    if (success) {
      console.log('Ticket created successfully');
    }
  };

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      
      {/* Hiển thị danh sách conversations */}
      {conversations.map(conversation => (
        <TouchableOpacity
          key={conversation.conversationId}
          onPress={() => selectConversation(conversation)}
        >
          <Text>{conversation.ticket.subject}</Text>
        </TouchableOpacity>
      ))}
      
      {/* Hiển thị messages */}
      {selectedConversation && messages.map(message => (
        <View key={message._id}>
          <Text>{message.content}</Text>
        </View>
      ))}
    </View>
  );
};
```

### 3.3 Sử dụng messageService trực tiếp

```tsx
import messageService from '../services/messageService';

const handleMessaging = async () => {
  try {
    // Tạo conversation mới
    const createResponse = await messageService.createConversation({
      subject: 'Technical Issue',
      category: 'technical',
      description: 'App is not working properly',
      priority: 'high',
    });
    
    // Gửi tin nhắn
    const messageResponse = await messageService.sendMessage(
      createResponse.conversation.conversationId,
      {
        content: 'Can you help me?',
        type: 'text',
      }
    );
    
    // Upload file đính kèm
    const uploadResponse = await messageService.uploadAttachment({
      uri: 'file://path/to/image.jpg',
      name: 'screenshot.jpg',
      type: 'image/jpeg',
      size: 1024000,
    });
    
    console.log('Upload successful:', uploadResponse.url);
  } catch (error) {
    console.error('Messaging error:', error);
  }
};
```

## 4. Tích hợp vào Register/Login Flow

### 4.1 Cập nhật Register Screen

```tsx
// app/(auth)/register.tsx
import EmailVerificationModal from '../../components/EmailVerificationModal';

const RegisterScreen = () => {
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');

  const handleRegister = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      
      if (response.requiresVerification) {
        setRegistrationEmail(userData.email);
        setShowEmailVerification(true);
      } else {
        // Đăng ký thành công, chuyển hướng
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleVerificationSuccess = (data: any) => {
    // Xác thực thành công, chuyển hướng
    router.replace('/(tabs)');
  };

  return (
    <View>
      {/* Form đăng ký */}
      
      <EmailVerificationModal
        visible={showEmailVerification}
        email={registrationEmail}
        onClose={() => setShowEmailVerification(false)}
        onSuccess={handleVerificationSuccess}
        type="registration"
      />
    </View>
  );
};
```

### 4.2 Cập nhật Login Screen

```tsx
// app/(auth)/login.tsx
import EmailVerificationModal from '../../components/EmailVerificationModal';

const LoginScreen = () => {
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  const handleLogin = async (credentials: any) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.requiresVerification) {
        setLoginEmail(credentials.email);
        setShowEmailVerification(true);
      } else {
        // Đăng nhập thành công, chuyển hướng
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <View>
      {/* Form đăng nhập */}
      
      <EmailVerificationModal
        visible={showEmailVerification}
        email={loginEmail}
        onClose={() => setShowEmailVerification(false)}
        onSuccess={(data) => {
          // Xác thực thành công, chuyển hướng
          router.replace('/(tabs)');
        }}
        type="registration"
      />
    </View>
  );
};
```

## 5. Tích hợp Support Chat vào Profile

### 5.1 Cập nhật Profile Screen

```tsx
// app/(tabs)/profile.tsx
import SupportChat from '../../components/SupportChat';

const ProfileScreen = () => {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Profile content */}
      
      <TouchableOpacity onPress={() => setShowSupport(true)}>
        <Text>Customer Support</Text>
      </TouchableOpacity>
      
      <Modal visible={showSupport} animationType="slide">
        <SupportChat onClose={() => setShowSupport(false)} />
      </Modal>
    </View>
  );
};
```

## 6. Cấu hình Environment Variables

### 6.1 Tạo file .env (nếu chưa có)

```env
# Email Configuration (Backend)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=https://your-frontend-url.com
JWT_SECRET=your-jwt-secret

# Frontend Configuration
API_BASE_URL=https://server-shelf-stacker-w1ds.onrender.com
```

## 7. Testing

### 7.1 Test Email Verification

```tsx
// Test component
const TestEmailVerification = () => {
  const [email, setEmail] = useState('test@example.com');
  const [showModal, setShowModal] = useState(false);

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
      />
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Text>Test Email Verification</Text>
      </TouchableOpacity>
      
      <EmailVerificationModal
        visible={showModal}
        email={email}
        onClose={() => setShowModal(false)}
        onSuccess={(data) => console.log('Success:', data)}
        type="registration"
      />
    </View>
  );
};
```

### 7.2 Test Messaging

```tsx
// Test component
const TestMessaging = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setShowChat(true)}>
        <Text>Test Support Chat</Text>
      </TouchableOpacity>
      
      <Modal visible={showChat} animationType="slide">
        <SupportChat onClose={() => setShowChat(false)} />
      </Modal>
    </View>
  );
};
```

## 8. Troubleshooting

### 8.1 Email không gửi được
- Kiểm tra cấu hình EMAIL_USER và EMAIL_PASSWORD trên backend
- Đảm bảo 2FA đã bật cho Gmail
- Kiểm tra App Password

### 8.2 Messaging không hoạt động
- Kiểm tra authentication token
- Đảm bảo user có quyền truy cập
- Kiểm tra database connection

### 8.3 Translation không hiển thị
- Kiểm tra file locales đã được cập nhật
- Đảm bảo i18n đã được khởi tạo đúng cách

## 9. Performance Optimization

### 9.1 Email Verification
- Sử dụng debounce cho input OTP
- Cache email verification status
- Rate limiting cho OTP requests

### 9.2 Messaging
- Pagination cho messages
- Lazy loading cho conversations
- Optimistic updates cho messages

## 10. Security Considerations

### 10.1 Email Security
- OTP có thời hạn 5 phút
- Giới hạn số lần gửi OTP
- Validation cho email format

### 10.2 Messaging Security
- Authentication required cho tất cả endpoints
- Validation cho tất cả input
- File upload size limits

---

**Lưu ý**: Đảm bảo backend đã được cấu hình đúng cách trước khi test frontend features.
