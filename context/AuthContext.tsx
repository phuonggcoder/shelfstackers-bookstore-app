import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/authService';
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

      // Log chi tiết khi user login thành công
      console.log('=== USER LOGIN SUCCESS ===');
      console.log('Login time:', new Date().toISOString());
      console.log('User data:', {
        id: userData.user._id,
        email: userData.user.email,
        username: userData.user.username,
        full_name: userData.user.full_name,
        roles: userData.user.roles
      });
      console.log('Token present:', !!userData.token);
      console.log('Token length:', userData.token?.length);
      console.log('========================');

      // Lưu token và user vào AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('token', userData.token),
        AsyncStorage.setItem('user', JSON.stringify(userData.user)),
      ]);

      setToken(userData.token);
      setUser(userData.user);

      Alert.alert('Thành công', 'Đăng nhập thành công!');
    } catch (error) {
      console.error('Error saving auth:', error);
      Alert.alert(
        'Lỗi xác thực',
        'Không thể hoàn thành quá trình xác thực. Vui lòng thử lại.'
      );
      throw error; // Throw lại error để component có thể xử lý
    }
  };

  const signOut = async () => {
    try {
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
      hideTokenExpiredAlert
    }}>
      {children}
    </AuthContext.Provider>
  );
}
