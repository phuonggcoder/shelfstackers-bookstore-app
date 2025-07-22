import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging';

// Lấy FCM token (modular)
export async function getFcmToken() {
  const messagingInstance = getMessaging();
  return await getToken(messagingInstance);
}

// Gửi token lên server
export async function syncFcmToken(userId, deviceId, authToken) {
  const token = await getFcmToken();
  console.log('FCM token:', token, 'userId:', userId, 'deviceId:', deviceId);
  if (userId && token) {
    try {
      // Sử dụng endpoint mới register-device-token
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const res = await fetch('https://server-shelf-stacker.onrender.com/auth/register-device-token', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          deviceToken: token, 
          deviceId: deviceId 
        }),
      });
      
      const resJson = await res.json().catch(() => ({}));
      console.log('✅ Sync FCM response:', res.status, resJson);
      return resJson;
    } catch (error) {
      console.error('❌ Error syncing FCM token:', error);
      throw error;
    }
  } else {
    console.warn('Không có userId hoặc FCM token để sync lên BE');
  }
}

// Xóa token khi logout
export async function removeFcmToken(userId) {
  const token = await getFcmToken();
  if (userId && token) {
    try {
      const res = await fetch('https://server-shelf-stacker.onrender.com/auth/unregister-device-token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken: token }),
      });
      console.log('✅ Remove FCM token response:', res.status);
    } catch (error) {
      console.error('❌ Error removing FCM token:', error);
    }
  }
}

// Lắng nghe token refresh (modular)
export function listenFcmTokenRefresh(userId, deviceId) {
  const messagingInstance = getMessaging();
  return onTokenRefresh(messagingInstance, (newToken) => {
    if (userId && newToken) {
      console.log('🔄 FCM token refreshed:', newToken);
      fetch('https://server-shelf-stacker.onrender.com/auth/register-device-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceToken: newToken, 
          deviceId: deviceId 
        }),
      }).then(res => {
        console.log('✅ Token refresh sync response:', res.status);
      }).catch(error => {
        console.error('❌ Error syncing refreshed token:', error);
      });
    }
  });
} 