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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
r
  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Validate token with server
        const isValid = await authService.validateToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          // Token không hợp lệ, tự động signOut và chuyển về login
          await signOut();
          try {
            const expoRouter = await import('expo-router');
            expoRouter.router.replace('/(auth)/login');
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      // Xóa dữ liệu lỗi
      await signOut();
      try {
        const expoRouter = await import('expo-router');
        expoRouter.router.replace('/(auth)/login');
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData: AuthResponse) => {
    try {
      if (!userData?.token || !userData?.user) {
        throw new Error('Invalid authentication data');
      }

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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
