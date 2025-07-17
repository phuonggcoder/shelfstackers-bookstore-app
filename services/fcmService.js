import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging';

// Lấy FCM token (modular)
export async function getFcmToken() {
  const messagingInstance = getMessaging();
  return await getToken(messagingInstance);
}

// Gửi token lên server
export async function syncFcmToken(userId, deviceId) {
  const token = await getFcmToken();
  console.log('FCM token:', token, 'userId:', userId, 'deviceId:', deviceId);
  if (userId && token) {
    const res = await fetch('https://server-shelf-stacker.onrender.com/auth/users/device-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token, deviceId }),
    });
    const resJson = await res.json().catch(() => ({}));
    console.log('Sync FCM response:', res.status, resJson);
  } else {
    console.warn('Không có userId hoặc FCM token để sync lên BE');
  }
}

// Xóa token khi logout
export async function removeFcmToken(userId) {
  const token = await getFcmToken();
  if (userId && token) {
    await fetch('https://server-shelf-stacker.onrender.com/auth/device-token/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });
  }
}

// Lắng nghe token refresh (modular)
export function listenFcmTokenRefresh(userId, deviceId) {
  const messagingInstance = getMessaging();
  return onTokenRefresh(messagingInstance, (newToken) => {
    if (userId && newToken) {
      fetch('https://server-shelf-stacker.onrender.com/auth/users/device-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: newToken, deviceId }),
      });
    }
  });
} 