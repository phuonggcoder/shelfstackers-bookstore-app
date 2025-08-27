# User Frontend - Notifee Implementation Guide

## 📱 Tổng quan

Hướng dẫn implement Notifee cho User Frontend app để nhận push notifications từ Firebase Type 1 (shelfstacker-project), tích hợp với hệ thống thông báo hiện có.

## 🎯 Mục tiêu

- Setup Notifee cho User app
- Nhận push notifications từ Firebase Type 1
- Tích hợp với hệ thống thông báo hiện có (Toast, Modal, Alert)
- Background/Foreground notification handling
- Deep linking khi tap notification
- Cập nhật UI/UX với push notifications

## 📋 Prerequisites

### 1. Dependencies cần cài đặt

```bash
# React Native
npm install @notifee/react-native

# iOS (nếu cần)
cd ios && pod install

# Android (nếu cần)
# Thêm vào android/app/build.gradle
```

### 2. Firebase Configuration

Đảm bảo đã setup Firebase cho project `shelfstacker-project`:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

## 🚀 Setup & Configuration

### 1. Import Notifee

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

### 2. Request Permissions

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

### 3. Create Notification Channel (Android)

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

## 🔔 Notification Handling

### 1. Foreground Event Handler

```javascript
// Xử lý notification khi app đang mở
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
```

### 2. Background Event Handler

```javascript
// Xử lý notification khi app ở background
notifee.onBackgroundEvent(async ({ type, detail }) => {
  switch (type) {
    case EventType.PRESS:
      console.log('User pressed notification in background:', detail.notification);
      handleNotificationPress(detail.notification);
      break;
  }
});
```

### 3. Notification Press Handler

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

## 🔥 Firebase Integration

### 1. Initialize Firebase

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
        'Authorization': `Bearer ${userToken}` // User odioauth token
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

### 2. Message Handler

```javascript
// Xử lý FCM messages
messaging().onMessage(async remoteMessage => {
  console.log('Received foreground message:', remoteMessage);
  
  // Hiển thị notification bằng Notifee
  await displayNotification(remoteMessage);
  
  // Hiển thị toast thông báo
  showToast('info', 'Thông báo mới', remoteMessage.notification?.body || '');
});

// Xử lý background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Received background message:', remoteMessage);
  
  // Hiển thị notification
  await displayNotification(remoteMessage);
});
```

### 3. Display Notification

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

## 📱 App Integration

### 1. App.js Setup

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

### 2. Navigation Integration

```javascript
// navigation/AppNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="DeliverySuccess" component={DeliverySuccessScreen} />
        <Stack.Screen name="Promotions" component={PromotionsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 🎨 UI Components - Cập nhật hệ thống hiện có

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

### 2. Notification List Component - Cập nhật

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

### 3. Notification Item Component - Mới

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

## 📁 Files để Implement cho App khác (Firebase Type 2)

### 1. Core Files
- `App.js` - Main app setup với Notifee
- `firebase.js` - Firebase configuration (thay đổi config cho Type 2)
- `context/ToastContext.tsx` - Toast provider
- `components/CustomToast.tsx` - Custom toast component
- `components/NotificationModal.tsx` - Modal thông báo
- `components/NotificationBadge.js` - Badge component
- `components/NotificationList.js` - List notifications
- `components/NotificationItem.js` - Individual notification item

### 2. Configuration Files
- `android/app/build.gradle` - Android dependencies
- `android/app/src/main/AndroidManifest.xml` - Android permissions
- `ios/YourApp/Info.plist` - iOS background modes

### 3. Navigation Files
- `navigation/AppNavigator.js` - Navigation setup
- Các screen components cho deep linking

### 4. Utility Files
- `utils/notificationUtils.js` - Helper functions
- `utils/analytics.js` - Analytics tracking
- `utils/errorTracking.js` - Error handling

### 5. Thay đổi cho Firebase Type 2
```javascript
// firebase.js - Thay đổi config
const firebaseConfig = {
  // Firebase Type 2 config (shipper-project)
  apiKey: "your-api-key",
  authDomain: "shipper-project.firebaseapp.com",
  projectId: "shipper-project",
  storageBucket: "shipper-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

Với những file này, bạn có thể implement Notifee cho bất kỳ app nào khác với Firebase Type 2! 🚀

