import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const usePushNotification = () => {
  useEffect(() => {
    const requestPermission = async () => {
      console.log('usePushNotification: Starting permission request...');
      
      try {
        let permissionGranted = true;
        
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          console.log('Android API >= 33, requesting POST_NOTIFICATIONS permission...');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          console.log('Android permission result:', granted);
        } else if (Platform.OS === 'ios') {
          console.log('iOS, requesting messaging permission...');
          const authStatus = await messaging().requestPermission();
          permissionGranted =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          console.log('iOS permission result:', authStatus);
        } else {
          console.log('Android API < 33, permission automatically granted');
        }
        
        if (permissionGranted) {
          console.log('Permission granted, getting FCM token...');
          const token = await messaging().getToken();
          console.log('✅ FCM Token:', token);
          console.log('Token length:', token?.length || 0);
          // TODO: Gửi token lên server nếu cần
        } else {
          console.log('❌ Permission denied');
          Alert.alert('Thông báo', 'Bạn chưa cấp quyền nhận thông báo!');
        }
      } catch (error) {
        console.error('❌ Error in usePushNotification:', error);
      }
    };
    
    requestPermission();
  }, []);
}; 