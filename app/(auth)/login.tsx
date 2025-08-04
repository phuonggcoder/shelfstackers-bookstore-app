import AvoidKeyboardDummyView from '@/components/AvoidKeyboardDummyView';
import GoogleSignInWithAccountPicker from '@/components/GoogleSignInWithAccountPicker';
import OTPLogin from '@/components/OTPLogin';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { configureGoogleSignIn } from '../../config/googleSignIn';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { convertGoogleSignInResponse } from '../../utils/authUtils';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'main' | 'otp'>('main');

  // Cấu hình Google Sign-In với Firebase
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.login({ email: email, password });
      await signIn(response);
      Alert.alert('Thành công', 'Đăng nhập thành công!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.message || 'Lỗi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý thành công Google Sign-In
  const handleGoogleSignInSuccess = async (result: any) => {
    try {
      console.log('✅ Google Sign-In successful:', result);
      
      if (result.success && result.user) {
        // Sử dụng utility function để convert format
        const authResponse = convertGoogleSignInResponse(result);
        
        await signIn(authResponse);
        Alert.alert('Đăng nhập thành công', 'Chào mừng bạn!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Lỗi đăng nhập', result.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('❌ Error after Google Sign-In:', error);
      Alert.alert('Lỗi', 'Không thể hoàn tất quá trình đăng nhập');
    }
  };

  // Hàm xử lý lỗi Google Sign-In
  const handleGoogleSignInError = (error: any) => {
    console.error('❌ Google Sign-In error:', error);
    // Error handling đã được xử lý trong component
  };

  // Hàm xử lý thành công OTP Login
  const handleOTPLoginSuccess = async (result: any) => {
    try {
      console.log('✅ OTP Login successful:', result);
      
      if (result.success && result.user) {
        // Convert OTP response to auth format
        const authResponse = {
          token: result.access_token, // Use access_token as token
          user: result.user
        };
        
        await signIn(authResponse);
        Alert.alert('Đăng nhập thành công', 'Chào mừng bạn!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Lỗi đăng nhập', result.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('❌ Error after OTP Login:', error);
      Alert.alert('Lỗi', 'Không thể hoàn tất quá trình đăng nhập');
    }
  };

  // Hàm quay lại trang chính
  const handleBackToMain = () => {
    setAuthMethod('main');
  };

  // Hiển thị OTP Login nếu authMethod là 'otp'
  if (authMethod === 'otp') {
    return (
      <OTPLogin
        onLoginSuccess={handleOTPLoginSuccess}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <ScrollView style={styles.scrollbox}> 
      
   
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>Đăng nhập tài khoản</Text>
        <Text style={styles.subtitle}>Nhập thông tin của bạn bên dưới</Text>
      </View>

      <View style={styles.socialContainer}>
        <GoogleSignInWithAccountPicker
          onSuccess={handleGoogleSignInSuccess}
          onError={handleGoogleSignInError}
          disabled={isLoading}
          style={styles.googleButton}
        />
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => setAuthMethod('otp')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="call-outline" size={24} color="#333" />
          </View>
          <Text style={styles.socialText}>Số điện thoại</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Nhập email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color="#999"
          />
        </TouchableOpacity>

        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!email || !password || isLoading) && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}> Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>hoặc</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity 
          style={styles.skipLoginContainer}
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="arrow-forward-outline" size={20} color="#3255FB" />
          <Text style={styles.skipLoginText}>Đăng nhập sau</Text>
        </TouchableOpacity>
      </View>
     
    </View>
     <AvoidKeyboardDummyView minHeight={0} maxHeight={300}>

     </AvoidKeyboardDummyView>
     </ScrollView>
  );
}


const styles = StyleSheet.create({

  scrollbox:{
    backgroundColor: '#fff',
    flex:1,

  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    marginTop:50,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '48%',
  },
  googleButton: {
    width: '48%',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  socialText: {
    fontSize: 16,
    color: '#333',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A3780',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A3780',
  },
  rememberText: {
    fontSize: 14,
    color: '#333',
  },
  forgotText: {
    color: '#4A3780',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#3255FB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#3255FB',
    fontSize: 14,
    fontWeight: '600',
  },
  skipLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  skipLoginText: {
    color: '#3255FB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
});
