import notifee, { AndroidImportance, AndroidStyle, NotificationAndroid } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';

export const useFCMListener = () => {
  useEffect(() => {
    const initializeNotifee = async () => {
      try {
        // Tạo channel cho Android
        await notifee.createChannel({
          id: 'default',
          name: 'Thông báo chung',
          importance: AndroidImportance.HIGH,
        });
        console.log('Notifee channel created successfully');
      } catch (error) {
        console.warn('Notifee not available:', error);
        return;
      }
    };

    initializeNotifee();

    // Foreground: App đang mở
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      const { notification, data } = remoteMessage;
      try {
        const imageUrl = notification?.android?.imageUrl;
        const androidOptions: NotificationAndroid = {
          channelId: 'default',
          ...(imageUrl
            ? {
                style: {
                  type: AndroidStyle.BIGPICTURE,
                  picture: imageUrl,
                },
              }
            : {}),
        };
        await notifee.displayNotification({
          title: notification?.title,
          body: notification?.body,
          android: androidOptions,
        });
      } catch (error) {
        console.warn('Failed to display notification:', error);
      }
    });

    // Background: Người dùng nhấn vào thông báo
    const unsubscribeOnOpen = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Background: User tapped notification', remoteMessage);
      // TODO: Xử lý điều hướng nếu cần
    });

    // App bị kill và mở lại bằng notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Cold start: App opened from notification', remoteMessage);
          // TODO: Xử lý điều hướng nếu cần
        }
      });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpen();
    };
  }, []);
}; 