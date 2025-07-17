import messaging from '@react-native-firebase/messaging';

// Lấy FCM token
export async function getFcmToken() {
  return await messaging().getToken();
}

// Gửi token lên server
export async function syncFcmToken(userId, deviceId) {
  const token = await getFcmToken();
  if (userId && token) {
    await fetch('https://your-server/api/users/device-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token, deviceId }),
    });
  }
}

// Xóa token khi logout
export async function removeFcmToken(userId) {
  const token = await getFcmToken();
  if (userId && token) {
    await fetch('https://your-server/api/users/device-token/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });
  }
}

// Lắng nghe token refresh
export function listenFcmTokenRefresh(userId, deviceId) {
  return messaging().onTokenRefresh(newToken => {
    if (userId && newToken) {
      fetch('https://your-server/api/users/device-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: newToken, deviceId }),
      });
    }
  });
} 