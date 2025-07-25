import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { storageHelper } from '../config/storage';
import { syncFcmToken } from '../services/fcmService';

export const usePushNotification = () => {
    const handleToken = async (newToken: string) => {
       console.log('✅ New FCM Token:', newToken);
       // Gửi token lên server ngay khi có
       try {
         const deviceId = await storageHelper.getOrCreateMobileDeviceId();
         await syncFcmToken('temp_user', deviceId); // Sẽ được update khi user login
       } catch (error) {
         console.error('❌ Error syncing FCM token:', error);
       }
    };

    const requestAndroidNotificationPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    useEffect(() => {
        const setup = async () => {
            try {
                let permissionGranted = true;
                const messagingInstance = getMessaging();

                permissionGranted = await requestAndroidNotificationPermission();
                
                if (permissionGranted) {
                    console.log('Notification permission granted.');
                    // 2. Lấy FCM token
                    const token = await getToken(messagingInstance);
                    console.log('✅ FCM Token:', token);
                    handleToken(token)
                } else {
                    console.warn('Notification permission denied.');
                }
            } catch (err) {
                console.error('❌ Lỗi khi setup notification:', err);
            }
        };
        setup();
    }, []);
}; 