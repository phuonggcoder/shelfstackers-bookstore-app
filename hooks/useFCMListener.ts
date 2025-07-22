import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { getInitialNotification, getMessaging, onMessage, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { NavigationContainerRef } from '@react-navigation/native';
import { useEffect } from 'react';

export const useFCMListener = (navigation?: NavigationContainerRef<any>) => {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await notifee.createChannel({
          id: 'default',
          name: 'Thông báo chung',
          importance: AndroidImportance.HIGH,
        });

        const messagingInstance = getMessaging();

        // 1. App đang mở (foreground)
        const unsubscribeOnMessage = onMessage(messagingInstance, async remoteMessage => {
          const { notification, data } = remoteMessage;
          console.log('📱 Foreground message:', remoteMessage);
          const imageUrl = notification?.image || data?.image || notification?.android?.imageUrl;
          await notifee.displayNotification({
            title: notification?.title,
            body: notification?.body,
            android: {
              channelId: 'default',
              importance: AndroidImportance.HIGH,
              ...(imageUrl
                ? {
                    style: {
                      type: AndroidStyle.BIGPICTURE,
                      picture: imageUrl,
                    },
                  }
                : {}),
            },
          });
        });

        // 2. App background và người dùng nhấn vào thông báo
        const unsubscribeOnOpen = onNotificationOpenedApp(messagingInstance, remoteMessage => {
          console.log('🚀 Background: User tapped notification', remoteMessage);
          if (remoteMessage?.data?.orderId && navigation) {
            navigation.navigate('OrderDetail', { id: remoteMessage.data.orderId });
          }
        });

        // 3. App bị kill và mở lại bằng notification
        getInitialNotification(messagingInstance).then(remoteMessage => {
          if (remoteMessage) {
            console.log('🧊 Cold start: App opened from notification', remoteMessage);
            if (remoteMessage?.data?.orderId && navigation) {
              // điều hướng
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