# Email Verification UI/UX System - Hướng Dẫn Thông Báo & Push Notifications

## Tổng quan

Hệ thống xác thực email với UI/UX hiện đại cho ứng dụng React Native, bao gồm hệ thống thông báo hoàn chỉnh và push notifications:

- ✅ Đăng ký tài khoản với xác thực email
- ✅ Thay đổi email với xác thực 2 bước  
- ✅ Đặt lại mật khẩu qua email
- ✅ Hệ thống thông báo đa dạng (Toast, Modal, Alert)
- ✅ Push notifications với Notifee
- ✅ Firebase Cloud Messaging integration
- ✅ UI/UX hiện đại với animations
- ✅ Responsive design

## Hệ Thống Thông Báo

### 1. Các Loại Thông Báo

#### **Alert Dialogs (Alert.alert)**
```typescript
// Thông báo thành công
Alert.alert(
  'Thành công',
  'Mã OTP đã được gửi đến email của bạn',
  [{ text: 'OK' }]
);

// Thông báo lỗi
Alert.alert(
  'Lỗi',
  'Mã OTP không đúng. Vui lòng thử lại',
  [{ text: 'OK' }]
);

// Thông báo với callback
Alert.alert(
  'Đăng ký thành công!',
  'Tài khoản đã được tạo và xác thực email thành công.',
  [
    {
      text: 'OK',
      onPress: () => setCurrentStep('menu'),
    },
  ]
);
```

#### **Toast Messages**
```typescript
// Sử dụng react-native-toast-message
import Toast from 'react-native-toast-message';

// Success toast
Toast.show({
  type: 'success',
  text1: 'Thành công',
  text2: 'Email đã được xác thực',
  position: 'top',
  visibilityTime: 3000,
});

// Error toast
Toast.show({
  type: 'error',
  text1: 'Lỗi',
  text2: 'Mã OTP không đúng',
  position: 'top',
  visibilityTime: 4000,
});

// Info toast
Toast.show({
  type: 'info',
  text1: 'Thông báo',
  text2: 'Đang gửi mã OTP...',
  position: 'top',
  visibilityTime: 2000,
});
```

#### **Custom Toast Component**
```typescript
// components/CustomToast.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  visible: boolean;
  onHide: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  type,
  title,
  message,
  visible,
  onHide,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after 3 seconds
      setTimeout(() => {
        hideToast();
      }, 3000);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, backgroundColor: getColor() },
      ]}
    >
      <Ionicons name={getIcon()} size={24} color="#fff" />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <Ionicons
        name="close"
        size={20}
        color="#fff"
        onPress={hideToast}
        style={styles.closeButton}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
  },
});

export default CustomToast;
```

### 2. Context Provider cho Toast

```typescript
// context/ToastContext.tsx
import React, { createContext, useContext, useState } from 'react';
import CustomToast from '../components/CustomToast';

interface ToastContextType {
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    setToast({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <CustomToast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
```

### 3. Sử Dụng Toast trong Components

```typescript
// Trong EmailOTPVerification.tsx
import { useToast } from '../context/ToastContext';

const EmailOTPVerification: React.FC<EmailOTPVerificationProps> = ({ ... }) => {
  const { showToast } = useToast();

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      if (onResendOTP) {
        await onResendOTP();
      }
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
      
      // Hiển thị toast thành công
      showToast('success', 'Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
    } catch (error: any) {
      setError(error.message || 'Không thể gửi lại OTP. Vui lòng thử lại');
      // Hiển thị toast lỗi
      showToast('error', 'Lỗi', error.message || 'Không thể gửi lại OTP. Vui lòng thử lại');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (otpString?: string) => {
    const otpToVerify = otpString || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      showToast('warning', 'Cảnh báo', 'Vui lòng nhập đủ 6 số OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (onVerifyOTP) {
        const result = await onVerifyOTP(otpToVerify);
        showToast('success', 'Thành công', 'Xác thực email thành công!');
        onVerificationSuccess(result);
      } else {
        onVerificationSuccess({ success: true, otp: otpToVerify });
      }
    } catch (error: any) {
      setError(error.message || 'Mã OTP không đúng. Vui lòng thử lại');
      showToast('error', 'Lỗi', error.message || 'Mã OTP không đúng. Vui lòng thử lại');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

### 4. Modal Thông Báo

```typescript
// components/NotificationModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NotificationModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const { width, height } = Dimensions.get('window');

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return ['#4CAF50', '#45a049'];
      case 'error':
        return ['#f44336', '#d32f2f'];
      case 'warning':
        return ['#ff9800', '#f57c00'];
      case 'info':
        return ['#2196F3', '#1976D2'];
      default:
        return ['#2196F3', '#1976D2'];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={getColors()}
            style={styles.gradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={getIcon()} size={60} color="#fff" />
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              {onConfirm && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm || onClose}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationModal;
```

### 5. Sử Dụng Modal Thông Báo

```typescript
// Trong component
import NotificationModal from './NotificationModal';

const EmailChangeVerification: React.FC<EmailChangeVerificationProps> = ({ ... }) => {
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    setNotification({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  const handleEmailChangeSuccess = async (newEmail: string) => {
    setNewEmailVerified(true);
    setStep('success');
    
    showNotification(
      'success',
      'Thay đổi email thành công!',
      `Email đã được thay đổi thành: ${newEmail}`
    );
    
    setTimeout(() => {
      onEmailChangeSuccess(newEmail);
    }, 2000);
  };

  return (
    <>
      {/* Component content */}
      
      <NotificationModal
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
    </>
  );
};
```

### 6. Setup App với Toast Provider

```typescript
// App.tsx
import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { NavigationContainer } from '@react-navigation/native';

const App = () => {
  return (
    <ToastProvider>
      <NavigationContainer>
        {/* Your app content */}
      </NavigationContainer>
    </ToastProvider>
  );
};

export default App;
```

### 7. Best Practices cho Thông Báo

#### **1. Timing**
```typescript
// Toast ngắn cho thông báo nhanh
showToast('success', 'Đã gửi', 'OTP đã được gửi');

// Modal cho thông báo quan trọng
showNotification('success', 'Thành công', 'Email đã được xác thực');

// Alert cho lỗi nghiêm trọng
Alert.alert('Lỗi', 'Không thể kết nối server');
```

#### **2. Content**
```typescript
// Tốt
showToast('success', 'Thành công', 'Email đã được xác thực');

// Không tốt
showToast('success', 'OK', 'Done');
```

#### **3. Accessibility**
```typescript
// Thêm accessibility props
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Đóng thông báo"
  accessibilityHint="Nhấn để đóng thông báo"
  onPress={onClose}
>
  <Text>Đóng</Text>
</TouchableOpacity>
```

### 8. Customization

#### **Theme Colors**
```typescript
const notificationTheme = {
  success: {
    primary: '#4CAF50',
    secondary: '#45a049',
    text: '#fff',
  },
  error: {
    primary: '#f44336',
    secondary: '#d32f2f',
    text: '#fff',
  },
  warning: {
    primary: '#ff9800',
    secondary: '#f57c00',
    text: '#fff',
  },
  info: {
    primary: '#2196F3',
    secondary: '#1976D2',
    text: '#fff',
  },
};
```

#### **Animation**
```typescript
// Slide animation
const slideAnim = useRef(new Animated.Value(-100)).current;

useEffect(() => {
  if (visible) {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }
}, [visible]);
```

## 🔔 Push Notifications với Notifee

### 1. Cài đặt Dependencies

```bash
# React Native
npm install @notifee/react-native

# iOS (nếu cần)
cd ios && pod install

# Android (nếu cần)
# Thêm vào android/app/build.gradle
```

### 2. Import Notifee

```javascript
// App.js hoặc index.js
import notifee, { 
  EventType, 
  AndroidImportance,
  AndroidStyle,
  AndroidColor,
  AndroidCategory
} from '@notifee/react-native';
```

### 3. Request Permissions

```javascript
// Request notification permissions
async function requestUserPermission() {
  const authStatus = await notifee.requestPermission();
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  
  return false;
}
```

### 4. Create Notification Channel (Android)

```javascript
// Tạo notification channels cho Android
async function createNotificationChannels() {
  // Channel cho đơn hàng
  await notifee.createChannel({
    id: 'orders',
    name: 'Đơn hàng',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500],
    lights: [AndroidColor.BLUE, 300, 600],
  });

  // Channel cho thanh toán
  await notifee.createChannel({
    id: 'payments',
    name: 'Thanh toán',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  // Channel cho giao hàng
  await notifee.createChannel({
    id: 'delivery',
    name: 'Giao hàng',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });

  // Channel cho khuyến mãi
  await notifee.createChannel({
    id: 'promotions',
    name: 'Khuyến mãi',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });

  // Channel cho thông báo chung
  await notifee.createChannel({
    id: 'general',
    name: 'Thông báo chung',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
}
```

### 5. Notification Event Handlers

```javascript
// Foreground Event Handler
notifee.onForegroundEvent(({ type, detail }) => {
  switch (type) {
    case EventType.DELIVERED:
      console.log('Notification delivered in foreground:', detail.notification);
      // Hiển thị toast thông báo
      showToast('info', 'Thông báo mới', detail.notification.body);
      break;
    case EventType.PRESS:
      console.log('User pressed notification:', detail.notification);
      handleNotificationPress(detail.notification);
      break;
  }
});

// Background Event Handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  switch (type) {
    case EventType.PRESS:
      console.log('User pressed notification in background:', detail.notification);
      handleNotificationPress(detail.notification);
      break;
  }
});
```

### 6. Notification Press Handler

```javascript
// Xử lý khi user tap notification
function handleNotificationPress(notification) {
  const { data } = notification;
  
  if (!data) return;

  switch (data.type) {
    case 'order_success':
      // Navigate to order details
      navigation.navigate('OrderDetails', { 
        orderId: data.order_id 
      });
      break;
      
    case 'order_status_change':
      // Navigate to order tracking
      navigation.navigate('OrderTracking', { 
        orderId: data.order_id 
      });
      break;
      
    case 'payment_success':
      // Navigate to payment success
      navigation.navigate('PaymentSuccess', { 
        orderId: data.order_id 
      });
      break;
      
    case 'delivery_success':
      // Navigate to delivery success
      navigation.navigate('DeliverySuccess', { 
        orderId: data.order_id 
      });
      break;
      
    case 'promotion':
      // Navigate to promotions
      navigation.navigate('Promotions');
      break;
      
    case 'admin_notification':
      // Navigate to notifications
      navigation.navigate('Notifications');
      break;
      
    default:
      // Default navigation
      navigation.navigate('Home');
  }
}
```

### 7. Firebase Integration

```javascript
// firebase.js
import { initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

const firebaseConfig = {
  // Firebase Type 1 config (shelfstacker-project)
  apiKey: "your-api-key",
  authDomain: "shelfstacker-project.firebaseapp.com",
  projectId: "shelfstacker-project",
  storageBucket: "shelfstacker-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get FCM token
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Save token to backend
export async function saveTokenToBackend(token) {
  try {
    const response = await fetch('YOUR_BACKEND_URL/api/users/update-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // User auth token
      },
      body: JSON.stringify({
        device_token: token,
        platform: Platform.OS
      })
    });
    
    if (response.ok) {
      console.log('Token saved to backend successfully');
    }
  } catch (error) {
    console.error('Error saving token to backend:', error);
  }
}
```

### 8. Display Notification

```javascript
// Hiển thị notification bằng Notifee
async function displayNotification(remoteMessage) {
  const { notification, data } = remoteMessage;
  
  // Xác định channel dựa trên loại notification
  let channelId = 'general';
  
  if (data?.type === 'order_success' || data?.type === 'order_status_change') {
    channelId = 'orders';
  } else if (data?.type === 'payment_success' || data?.type === 'payment_failed') {
    channelId = 'payments';
  } else if (data?.type === 'delivery_success' || data?.type === 'delivery_failed') {
    channelId = 'delivery';
  } else if (data?.type === 'promotion') {
    channelId = 'promotions';
  }

  // Tạo notification
  await notifee.displayNotification({
    title: notification?.title || 'Thông báo mới',
    body: notification?.body || '',
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
      // Big text style cho notification dài
      style: {
        type: AndroidStyle.BIGTEXT,
        text: notification?.body || '',
      },
      // Thêm actions nếu cần
      actions: [
        {
          title: 'Xem chi tiết',
          pressAction: {
            id: 'view_details',
          },
        },
        {
          title: 'Đóng',
          pressAction: {
            id: 'dismiss',
          },
        },
      ],
    },
    ios: {
      foregroundPresentationOptions: {
        badge: true,
        sound: true,
        banner: true,
        list: true,
      },
    },
    data: data || {},
  });
}
```

### 9. App Integration

```javascript
// App.js
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { getFCMToken, saveTokenToBackend } from './firebase';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      // 1. Request permissions
      const hasPermission = await requestUserPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return;
      }

      // 2. Create notification channels (Android)
      if (Platform.OS === 'android') {
        await createNotificationChannels();
      }

      // 3. Setup event handlers
      setupEventHandlers();

      // 4. Get and save FCM token
      const token = await getFCMToken();
      if (token) {
        await saveTokenToBackend(token);
      }

      // 5. Setup Firebase message handlers
      setupFirebaseHandlers();

    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const setupEventHandlers = () => {
    // Foreground events
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DELIVERED:
          console.log('Notification delivered:', detail.notification);
          // Hiển thị toast thông báo
          showToast('info', 'Thông báo mới', detail.notification.body);
          break;
        case EventType.PRESS:
          handleNotificationPress(detail.notification);
          break;
      }
    });

    // Background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          handleNotificationPress(detail.notification);
          break;
      }
    });
  };

  const setupFirebaseHandlers = () => {
    // Foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      await displayNotification(remoteMessage);
      
      // Hiển thị toast thông báo
      showToast('info', 'Thông báo mới', remoteMessage.notification?.body || '');
    });

    // Background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
      await displayNotification(remoteMessage);
    });
  };

  return (
    <ToastProvider>
      <NavigationContainer>
        {/* Your app components */}
      </NavigationContainer>
    </ToastProvider>
  );
}
```

## 📱 UI Components - Cập nhật hệ thống hiện có

### 1. Notification Badge Component

```javascript
// components/NotificationBadge.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NotificationBadge({ count = 0 }) {
  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

### 2. Notification List Component

```javascript
// components/NotificationList.js
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import NotificationItem from './NotificationItem';
import { useToast } from '../context/ToastContext';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Load notifications from API
      const response = await fetch('YOUR_BACKEND_URL/api/notifications');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      showToast('error', 'Lỗi', 'Không thể tải thông báo');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const renderNotification = ({ item }) => (
    <NotificationItem 
      notification={item}
      onPress={() => handleNotificationPress(item)}
    />
  );

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={(item) => item.id}
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### 3. Notification Item Component

```javascript
// components/NotificationItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationItem = ({ notification, onPress }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'order_success':
        return 'checkmark-circle';
      case 'order_status_change':
        return 'refresh-circle';
      case 'payment_success':
        return 'card';
      case 'delivery_success':
        return 'car';
      case 'promotion':
        return 'gift';
      default:
        return 'notifications';
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'order_success':
      case 'payment_success':
      case 'delivery_success':
        return '#4CAF50';
      case 'order_status_change':
        return '#2196F3';
      case 'promotion':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: getColor() }]}>
        <Ionicons name={getIcon()} size={24} color="#fff" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{notification.created_at}</Text>
      </View>
      
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    alignSelf: 'center',
  },
});

export default NotificationItem;
```

## 🔧 Configuration Files

### 1. Android Configuration

```gradle
// android/app/build.gradle
android {
    defaultConfig {
        // ... other configs
        multiDexEnabled true
    }
}

dependencies {
    // ... other dependencies
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
    implementation 'com.google.firebase:firebase-analytics:21.0.0'
}
```

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <application>
        <!-- Firebase messaging service -->
        <service
            android:name=".java.MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### 2. iOS Configuration

```xml
<!-- ios/YourApp/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 🧪 Testing

### 1. Test Local Notification

```javascript
// Test function
async function testLocalNotification() {
  await notifee.displayNotification({
    title: 'Test Notification',
    body: 'This is a test notification',
    android: {
      channelId: 'general',
    },
  });
}
```

### 2. Test Firebase Notification

```javascript
// Test FCM token
async function testFCMToken() {
  const token = await messaging().getToken();
  console.log('Current FCM Token:', token);
  
  // Send test notification from backend
  await fetch('YOUR_BACKEND_URL/api/v1/admin/dynamic-notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      event: 'order_success',
      data: {
        order_id: 'TEST-ORDER-001',
        total_amount: '150,000'
      },
      options: {
        type: 'user',
        allUsers: false,
        userId: 'test_user_id'
      }
    })
  });
}
```

## 🐛 Troubleshooting

### 1. Common Issues

**Notification không hiển thị:**
- Kiểm tra permissions
- Kiểm tra notification channels (Android)
- Kiểm tra FCM token
- Kiểm tra Firebase configuration

**Background notification không hoạt động:**
- Kiểm tra background modes (iOS)
- Kiểm tra service configuration (Android)
- Kiểm tra battery optimization

**Deep linking không hoạt động:**
- Kiểm tra navigation setup
- Kiểm tra data trong notification
- Kiểm tra press handler

### 2. Debug Commands

```javascript
// Debug functions
const debugNotifications = {
  // Check permissions
  checkPermissions: async () => {
    const authStatus = await notifee.getNotificationSettings();
    console.log('Notification settings:', authStatus);
  },
  
  // Check channels
  checkChannels: async () => {
    const channels = await notifee.getNotificationChannels();
    console.log('Notification channels:', channels);
  },
  
  // Check FCM token
  checkFCMToken: async () => {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
  },
  
  // Clear all notifications
  clearAll: async () => {
    await notifee.cancelAllNotifications();
    console.log('All notifications cleared');
  }
};
```

## 📊 Analytics & Monitoring

### 1. Notification Analytics

```javascript
// Track notification events
const trackNotificationEvent = (event, data) => {
  // Send to analytics service
  analytics.track(event, {
    ...data,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
  });
};

// Usage examples
trackNotificationEvent('notification_received', {
  type: 'order_success',
  order_id: data.order_id
});

trackNotificationEvent('notification_opened', {
  type: 'order_success',
  order_id: data.order_id
});
```

### 2. Error Tracking

```javascript
// Error tracking
const trackNotificationError = (error, context) => {
  console.error('Notification error:', error);
  
  // Send to error tracking service
  crashlytics.recordError(error, {
    context,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
};
```

## 🚀 Production Checklist

- [ ] Firebase configuration đúng project `shelfstacker-project`
- [ ] Notification permissions được request
- [ ] Notification channels được tạo (Android)
- [ ] FCM token được lưu vào backend
- [ ] Event handlers được setup
- [ ] Deep linking hoạt động
- [ ] Background notifications hoạt động
- [ ] Error handling được implement
- [ ] Analytics tracking được setup
- [ ] Testing với real devices
- [ ] Tích hợp với hệ thống toast hiện có
- [ ] UI components được cập nhật

## 📚 Resources

- [Notifee Documentation](https://notifee.app/)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android Notification Channels](https://developer.android.com/guide/topics/ui/notifiers/notifications#ManageChannels)
- [iOS Push Notifications](https://developer.apple.com/documentation/usernotifications)

---

**Lưu ý**: Đảm bảo sử dụng Firebase Type 1 (shelfstacker-project) cho tất cả notifications trong User app để tách biệt với Shipper app (Firebase Type 2).

## Kết Luận

Hệ thống thông báo và push notifications này cung cấp:

- ✅ **Đa dạng loại thông báo**: Toast, Modal, Alert, Push Notifications
- ✅ **Dễ sử dụng**: Context provider pattern
- ✅ **Customizable**: Theme, animation, content
- ✅ **Accessible**: Support screen readers
- ✅ **Responsive**: Tự động điều chỉnh theo màn hình
- ✅ **Performance**: Optimized animations
- ✅ **Firebase Integration**: Complete FCM setup
- ✅ **Background Support**: Full background notification handling
- ✅ **Deep Linking**: Navigation from notifications

Với hệ thống này, bạn có thể tạo ra trải nghiệm người dùng tốt với các thông báo rõ ràng và đẹp mắt! 🎉
