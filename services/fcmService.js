import notifee, { 
  AndroidImportance,
  AndroidColor,
  AndroidStyle,
  EventType 
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

class FCMService {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Request permission for iOS
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Listen for token refresh
    messaging().onTokenRefresh(token => {
      console.log('New FCM Token:', token);
      // Send token to your server
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Handle notification open
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      // Navigate to specific screen based on notification
    });

    // Check if app was opened from notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          // Navigate to specific screen
        }
      });
  }

  async displayNotification(remoteMessage) {
    // Create notification channel for Android
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Display notification
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'New Message',
      body: remoteMessage.notification?.body || 'You have a new message',
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        color: AndroidColor.RED,
        largeIcon: remoteMessage.notification?.android?.imageUrl,
        style: {
          type: AndroidStyle.BIGPICTURE,
          picture: remoteMessage.notification?.android?.imageUrl,
        },
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    });
  }

  async onNotificationPress(notification) {
    // Handle notification press
    console.log('Notification pressed:', notification);
    
    // Navigate based on notification data
    if (notification.data?.screen) {
      // Navigate to specific screen
      // router.push(notification.data.screen);
    }
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}) {
    const channelId = await notifee.createChannel({
      id: 'local',
      name: 'Local Notifications',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    });
  }
}

export default new FCMService(); 