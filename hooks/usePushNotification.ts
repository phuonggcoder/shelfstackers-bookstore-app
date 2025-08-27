import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { storageHelper } from '../config/storage';

export const usePushNotification = () => {
    const handleToken = async (newToken: string) => {
       console.log('✅ New FCM Token:', newToken);
       // Chỉ sync FCM token khi có user đăng nhập
       // Token sẽ được sync trong AuthContext khi user login
       try {
         const deviceId = await storageHelper.getOrCreateMobileDeviceId();
         // Không gọi syncFcmToken ở đây vì chưa có user login
         // syncFcmToken sẽ được gọi trong AuthContext khi user đăng nhập
         console.log('FCM token ready for sync when user logs in');
       } catch (error) {
         console.error('❌ Error handling FCM token:', error);
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
