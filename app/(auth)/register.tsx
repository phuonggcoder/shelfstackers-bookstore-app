import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AvoidKeyboardDummyView from '../../components/AvoidKeyboardDummyView';
import EmailOTPVerification from '../../components/EmailOTPVerification';
import { useAuth } from '../../context/AuthContext';
import { useUnifiedModal } from '../../context/UnifiedModalContext';
import { useVerificationState } from '../../hooks/useVerificationState';
import emailService from '../../services/emailService';

type RegistrationStep = 'form' | 'verification' | 'success';

export default function Register() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { showErrorToast, showSuccessToast, showAlert } = useUnifiedModal();
  const { savePendingVerification, clearPendingVerification } = useVerificationState();
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    if (!validateEmail(email)) {
      showErrorToast('Lỗi', 'Email không hợp lệ');
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      showErrorToast(t('error'), t('passwordMinLength'));
      return;
    }

    try {
      setIsLoading(true);
      
      // Gửi OTP cho đăng ký
      const response = await emailService.sendRegistrationOTP(email);
      
      if (response.success) {
        // Lưu thông tin đăng ký để sử dụng sau khi verify
        setRegistrationData({
          username: username && username.length <= 20 ? username : email.split('@')[0].substring(0, 10),
          email,
          password,
          full_name: '',
        });
        
        // Lưu trạng thái pending verification
        await savePendingVerification(email, response.user?.id || '');
        
        setCurrentStep('verification');
        showSuccessToast('Thành công', 'Mã OTP đã được gửi đến email của bạn');
      }
    } catch (error: any) {
      const errorMessage = error.message || t('registrationError');
      showErrorToast(t('registrationFailed'), errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await emailService.resendOTP(email);
      showSuccessToast('Thành công', 'Mã OTP mới đã được gửi');
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể gửi lại OTP');
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      // Kiểm tra trạng thái verify trước
      try {
        const status = await emailService.checkVerificationStatus(email);
        if (status.success && status.verification?.is_verified) {
          // User đã verify rồi, chuyển sang login
          showAlert(
            'Thông báo',
            'Email đã được xác thực trước đó. Vui lòng đăng nhập.',
            'Đăng nhập',
            'info',
            () => router.push('/(auth)/login')
          );
          return { success: true, alreadyVerified: true };
        }
      } catch (statusError) {
        // Nếu không kiểm tra được status, tiếp tục verify OTP
        console.log('Không thể kiểm tra trạng thái verify:', statusError);
      }
      
      // Gửi password thật khi verify OTP để backend cập nhật
      const response = await emailService.verifyRegistrationOTP(email, otp, registrationData.password);
      
      if (response.success && response.user) {
        // Clear pending verification state
        await clearPendingVerification();
        
        // Sau khi verify thành công, chuyển về trang đăng nhập
        router.push('/(auth)/login');
      }
    } catch (error: any) {
      // Nếu verify thất bại, kiểm tra xem có phải user đã verify rồi không
      if (error.message === 'Mã OTP không đúng') {
        try {
          const status = await emailService.checkVerificationStatus(email);
          if (status.success && status.verification?.is_verified) {
            showAlert(
              'Thông báo',
              'Email đã được xác thực trước đó. Vui lòng đăng nhập.',
              'Đăng nhập',
              'info',
              () => router.push('/(auth)/login')
            );
            return { success: true, alreadyVerified: true };
          }
        } catch (statusError) {
          console.log('Không thể kiểm tra trạng thái verify:', statusError);
        }
      }
      
      throw error; // Để component OTP xử lý hiển thị lỗi
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setRegistrationData(null);
  };

  // Render verification step
  if (currentStep === 'verification') {
    return (
      <EmailOTPVerification
        email={email}
        onVerificationSuccess={handleVerifyOTP}
        onBack={handleBackToForm}
        type="registration"
        onResendOTP={handleResendOTP}
        // Không cần onVerifyOTP vì onVerificationSuccess đã xử lý
      />
    );
  }

  // Bỏ màn hình success, chuyển thẳng vào app
  // if (currentStep === 'success') {
  //   return (
  //     <View style={styles.successContainer}>
  //       <View style={styles.successContent}>
  //         <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
  //         <Text style={styles.successTitle}>Đăng ký thành công!</Text>
  //         <Text style={styles.successMessage}>
  //           Tài khoản của bạn đã được tạo và xác thực email thành công.
  //         </Text>
  //         <TouchableOpacity
  //           style={styles.successButton}
  //           onPress={() => router.replace('/(tabs)')}
  //         >
  //           <Text style={styles.successButtonText}>Tiếp tục</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // }

  // Render registration form
  return (
    <ScrollView style={styles.scrollbox}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>{t('registerAccount')}</Text>
          <Text style={styles.subtitle}>{t('enterYourInformationBelow')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên người dùng <Text style={styles.optionalText}>(tùy chọn)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên người dùng"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email <Text style={styles.requiredText}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu <Text style={styles.requiredText}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu <Text style={styles.requiredText}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLinkText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <AvoidKeyboardDummyView />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollbox: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requiredText: {
    color: '#e74c3c',
  },
  optionalText: {
    color: '#666',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  registerButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  successButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
