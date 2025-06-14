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
  }, []);

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
          // Token không hợp lệ, xóa dữ liệu đã lưu
          await AsyncStorage.multiRemove(['token', 'user']);
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      // Xóa dữ liệu lỗi
      await AsyncStorage.multiRemove(['token', 'user']);
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

      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      console.error('Error saving auth:', error);
      Alert.alert(
        'Authentication Error',
        'Could not complete the authentication process. Please try again.'
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
      Alert.alert('Error', 'Could not sign out properly');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
