import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';


export const usePushNotification = () => {

    
    const handleToken = async (newToken: string) => {
        console.log('✅ New FCM Token:', newToken);
        
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

                if (Platform.OS === 'android') {
                    permissionGranted = await requestAndroidNotificationPermission();
                } else {
                    const authStatus = await messaging().requestPermission();
                    permissionGranted =
                        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
                }
                
                if (permissionGranted) {
                    console.log('Notification permission granted.');

                    // 2. Lấy FCM token
                    const token = await messaging().getToken();
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