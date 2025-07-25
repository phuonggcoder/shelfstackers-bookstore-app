import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { storageHelper } from '../config/storage';
import { authService } from '../services/authService';
import { createOrUpdateSession, listenFcmTokenRefresh, removeFcmToken, syncFcmToken, updateSessionFcmToken } from '../services/fcmService';
import { AuthResponse, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (userData: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  checkTokenExpiration: () => Promise<boolean>;
  showTokenExpiredAlert: () => void;
  tokenExpiredAlertVisible: boolean;
  hideTokenExpiredAlert: () => void;
  register: (data: any) => Promise<void>;
  updateUser: (updateData: any) => Promise<void>;
  setUser: (user: User) => void; // Thêm hàm này
}

const AuthContext = createContext<AuthContextType>({
user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  checkTokenExpiration: async () => false,
  showTokenExpiredAlert: () => {},
  tokenExpiredAlertVisible: false,
  hideTokenExpiredAlert: () => {},
  register: async () => {},
  updateUser: async () => {}, // Thêm mặc định
  setUser: () => {}, // Thêm mặc định
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Always return a valid context object, never undefined
  return context || {
    user: null,
    token: null,
    isLoading: true,
    signIn: async () => {},
    signOut: async () => {},
    checkTokenExpiration: async () => false,
    showTokenExpiredAlert: () => {},
    tokenExpiredAlertVisible: false,
    hideTokenExpiredAlert: () => {},
    register: async () => {},
    updateUser: async () => {}, // Thêm mặc định
    setUser: () => {}, // Thêm mặc định
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpiredAlertVisible, setTokenExpiredAlertVisible] = useState(false);

  useEffect(() => {
    loadStoredAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ FCM token khi app khởi động nếu đã đăng nhập
  useEffect(() => {
    if (user && user._id && token) {
      (async () => {
        const deviceId = await storageHelper.getOrCreateMobileDeviceId();
        syncFcmToken(user._id, deviceId, token);
        listenFcmTokenRefresh(user._id, deviceId);
      })();
    }
  }, [user, token]);

  // Check token expiration periodically (only if user is actively using the app)
  useEffect(() => {
    if (token) {
      const checkInterval = setInterval(async () => {
        const isValid = await checkTokenExpiration();
        if (!isValid) {
          console.log('Token expired, showing alert');
          await signOut();
          setTokenExpiredAlertVisible(true);
        }
      }, 300000); // Check every 5 minutes instead of every minute

      return () => clearInterval(checkInterval);
    }
  }, [token]);

  const checkTokenExpiration = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const isValid = await authService.validateToken(token);
      if (!isValid) {
        console.log('Token validation failed, showing alert');
        await signOut();
        setTokenExpiredAlertVisible(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      await signOut();
      setTokenExpiredAlertVisible(true);
      return false;
    }
  };

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Set token and user first, then validate in background
        setToken(storedToken);
        setUser(parsedUser);
        
        // Đồng bộ FCM token khi load lại user (chỉ khi có token hợp lệ)
        const deviceId = await storageHelper.getOrCreateMobileDeviceId();
        // Chỉ sync FCM token nếu có token hợp lệ
        if (storedToken) {
          syncFcmToken(parsedUser._id, deviceId, storedToken);
          listenFcmTokenRefresh(parsedUser._id, deviceId);
        }

        // Validate token in background without blocking UI
        setTimeout(async () => {
          try {
            const isValid = await authService.validateToken(storedToken);
            if (!isValid) {
              console.log('Token validation failed, showing alert');
              await signOut();
              setTokenExpiredAlertVisible(true);
            }
          } catch (error) {
            console.error('Token validation error:', error);
            await signOut();
            setTokenExpiredAlertVisible(true);
          }
        }, 1000); // Delay validation by 1 second
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      // Clear invalid data but don't redirect
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData: AuthResponse) => {
    try {
      if (!userData?.token || !userData?.user) {
        throw new Error('Invalid authentication data');
      }
      // Lưu token vào AsyncStorage
      await AsyncStorage.setItem('token', userData.token);
      setToken(userData.token);

      setUser(userData.user);
      // --- Đồng bộ session và FCM ---
      const deviceId = await storageHelper.getOrCreateMobileDeviceId();
      const loginTime = new Date().toISOString();
      const deviceInfo = { platform: Platform.OS, version: Platform.Version };
      await createOrUpdateSession(userData.user._id, deviceId, loginTime, deviceInfo, userData.token);
      // Lấy FCM token và update vào session
      const fcmToken = await syncFcmToken(userData.user._id, deviceId, userData.token); // syncFcmToken trả về token
      if (fcmToken) {
        await updateSessionFcmToken(userData.user._id, deviceId, fcmToken, userData.token);
      }
      listenFcmTokenRefresh(userData.user._id, deviceId);
      Alert.alert('Thành công', 'Đăng nhập thành công!');
    } catch (error) {
      console.error('Error saving auth:', error);
      Alert.alert(
        'Lỗi xác thực',
        'Không thể hoàn thành quá trình xác thực. Vui lòng thử lại.'
      );
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (user && user._id) {
        await removeFcmToken(user._id);
      }
      await AsyncStorage.multiRemove(['token', 'user']);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất đúng cách');
    }
  };

  const showTokenExpiredAlert = () => {
    setTokenExpiredAlertVisible(true);
  };

  const hideTokenExpiredAlert = () => {
    setTokenExpiredAlertVisible(false);
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      await signIn(res); // Đăng nhập luôn sau khi đăng ký thành công
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng ký thất bại. Vui lòng thử lại.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updateData: any) => {
    if (!user || !token) return;
    setIsLoading(true);
    try {
      // Gọi API update user
      const response = await authService.updateUser({ ...updateData, _id: user._id });
      // Sau khi update, lấy lại user mới nhất từ API
      const userRes = await authService.getMe(token);
      setUser(userRes.user || userRes);
      await AsyncStorage.setItem('user', JSON.stringify(userRes.user || userRes));
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (error) {
      Alert.alert('Lỗi', 'Cập nhật thông tin thất bại');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      signIn, 
      signOut, 
      checkTokenExpiration, 
      showTokenExpiredAlert,
      tokenExpiredAlertVisible,
      hideTokenExpiredAlert,
      register,
      updateUser,
      setUser // Thêm vào Provider
    }}>
      {children}
    </AuthContext.Provider>
  );
}
