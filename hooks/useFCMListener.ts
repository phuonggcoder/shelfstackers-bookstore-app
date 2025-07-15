import messaging from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance, AndroidStyle, NotificationAndroid } from '@notifee/react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { useEffect } from 'react';

export const useFCMListener = (navigation?: NavigationContainerRef<any>) => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Tạm thời comment Notifee để tránh lỗi build
        // await notifee.createChannel({
        //   id: 'default',
        //   name: 'Thông báo chung',
        //   importance: AndroidImportance.HIGH,
        // });

        // 1. App đang mở (foreground)
        const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
          const { notification, data} = remoteMessage;
          console.log('📱 Foreground message:', remoteMessage);
          
          // Tạm thời comment Notifee display
          // const imageUrl = notification?.android?.imageUrl;
          // const androidOptions: NotificationAndroid = {
          //   channelId: 'default',
          //   ...(imageUrl
          //     ? {
          //       style: {
          //         type: AndroidStyle.BIGPICTURE,
          //         picture: imageUrl,
          //       },
          //     }
          //     : {}),
          // }

          // await notifee.displayNotification({
          //   title: notification?.title,
          //   body: notification?.body,
          //   android: androidOptions
          // });
        });

        // 2. App background và người dùng nhấn vào thông báo
        const unsubscribeOnOpen = messaging().onNotificationOpenedApp(remoteMessage => {
          console.log('🚀 Background: User tapped notification', remoteMessage);
          // Điều hướng đến màn hình chi tiết
          if (remoteMessage?.data?.orderId && navigation) {
            navigation.navigate('OrderDetail', { id: remoteMessage.data.orderId });
          }
        });

        // 3. App bị kill và mở lại bằng notification
        messaging()
          .getInitialNotification()
          .then(remoteMessage => {
            if (remoteMessage) {
              console.log('🧊 Cold start: App opened from notification', remoteMessage);
              // Điều hướng hoặc xử lý tương tự
              if (remoteMessage?.data?.orderId && navigation) {
                navigation.navigate('OrderDetail', { id: remoteMessage.data.orderId });
              }
            }
          });

        return () => {
          unsubscribeOnMessage();
          unsubscribeOnOpen();
        };
      } catch (error) {
        console.warn('❌ FCM setup error:', error);
      }
    };

    let unsubscribe: (() => void) | undefined;

    setupNotifications().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation]);
}; 