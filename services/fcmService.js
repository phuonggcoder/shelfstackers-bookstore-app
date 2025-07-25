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
  if (userId && token && authToken) {
    try {
      // Sử dụng endpoint mới register-device-token
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
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
    console.warn('Không có userId, FCM token hoặc authToken để sync lên BE');
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
      // Chỉ sync khi có user đăng nhập (có authToken)
      // Token refresh sync sẽ được handle trong AuthContext
      console.log('FCM token refresh ready for sync when user is logged in');
    }
  });
} 

// Gửi session khi login thành công
export async function createOrUpdateSession(userId, deviceId, loginTime, deviceInfo, authToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch('https://server-shelf-stacker.onrender.com/session', {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, device_id: deviceId, login_time: loginTime, device_info: deviceInfo }),
    });
    const resJson = await res.json().catch(() => ({}));
    console.log('✅ Create/Update session response:', res.status, resJson);
    return resJson;
  } catch (error) {
    console.error('❌ Error creating/updating session:', error);
    throw error;
  }
}

// Gửi fcm_token lên session
export async function updateSessionFcmToken(userId, deviceId, fcmToken, authToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch('https://server-shelf-stacker.onrender.com/session/fcm', {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, device_id: deviceId, fcm_token: fcmToken }),
    });
    const resJson = await res.json().catch(() => ({}));
    console.log('✅ Update session FCM response:', res.status, resJson);
    return resJson;
  } catch (error) {
    console.error('❌ Error updating session FCM token:', error);
    throw error;
  }
} 