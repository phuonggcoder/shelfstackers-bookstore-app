import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class StorageHelper {
  private readonly FCM_TOKEN_KEY = 'fcm_token';
  private readonly DEVICE_ID_KEY = 'mobile_device_id';

  async getFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.FCM_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async setFcmToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FCM_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting FCM token:', error);
    }
  }

  async getOrCreateMobileDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);
      
      if (!deviceId) {
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `unknown_${Date.now()}`;
    }
  }
}

export const storageHelper = new StorageHelper(); 