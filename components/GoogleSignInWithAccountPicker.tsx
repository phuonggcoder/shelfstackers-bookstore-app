import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import googleAuthService from '../services/googleAuthService';

interface GoogleSignInWithAccountPickerProps {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

const GoogleSignInWithAccountPicker: React.FC<GoogleSignInWithAccountPickerProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
  textStyle,
}) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;

    try {
      setLoading(true);
      console.log('🔍 Starting Google Sign-In with Account Picker...');
      
      // Force hiển thị account picker trước
      await googleAuthService.forceAccountPicker();
      
      // Sau đó thực hiện đăng nhập
      const result = await googleAuthService.signInWithGoogle();
      
      console.log('✅ Google Sign-In successful:', result);
      
      if (result.success) {
        onSuccess?.(result);
      } else {
        const error = new Error(result.message || 'Đăng nhập Google thất bại');
        onError?.(error);
        Alert.alert('Lỗi đăng nhập', result.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      
      // Xử lý các loại lỗi cụ thể
      if (error.message?.includes('SIGN_IN_CANCELLED')) {
        console.log('User cancelled Google Sign-In');
        // Không hiển thị alert cho user cancel
      } else if (error.message?.includes('PLAY_SERVICES_NOT_AVAILABLE')) {
        Alert.alert('Lỗi', 'Google Play Services không khả dụng. Vui lòng cập nhật Google Play Services.');
      } else if (error.message?.includes('Không thể lấy ID token')) {
        Alert.alert('Lỗi', 'Không thể xác thực với Google. Vui lòng thử lại.');
      } else if (error.message?.includes('Network')) {
        Alert.alert('Lỗi mạng', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.');
      } else {
        Alert.alert('Lỗi', error.message || 'Đăng nhập Google thất bại');
      }
      
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled || loading ? styles.buttonDisabled : null,
        style,
      ]}
      onPress={handleGoogleSignIn}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Image
            source={require('../assets/images/google.png')}
            style={styles.icon}
            contentFit="contain"
          />
          <Text style={[styles.buttonText, textStyle]}>
            Chọn tài khoản Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GoogleSignInWithAccountPicker; 