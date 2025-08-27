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
import { useUnifiedModal } from '../../context/UnifiedModalContext';

type ForgotPasswordStep = 'form' | 'verification' | 'success';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { showErrorToast, showSuccessToast, showAlert } = useUnifiedModal();
  
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('form');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    if (!email) {
      showErrorToast('Lỗi', 'Vui lòng nhập email');
      return;
    }

    if (!validateEmail(email)) {
      showErrorToast('Lỗi', 'Email không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      
      // Gọi API forgot password (gửi email với link reset)
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentStep('success');
        showSuccessToast('Thành công', 'Email đặt lại mật khẩu đã được gửi');
      } else {
        throw new Error(data.message || 'Không thể gửi email đặt lại mật khẩu');
      }
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể gửi email đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  // Bỏ các hàm OTP vì không cần nữa
  // const handleResendOTP = async () => { ... };
  // const handleVerifyOTP = async (otp: string) => { ... };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  // Bỏ verification step vì không cần OTP nữa
  // if (currentStep === 'verification') {
  //   return (
  //     <EmailOTPVerification
  //       email={email}
  //       onVerificationSuccess={handleVerifyOTP}
  //       onBack={handleBackToForm}
  //       type="password-reset"
  //       onResendOTP={handleResendOTP}
  //       onVerifyOTP={handleVerifyOTP}
  //     />
  //   );
  // }

  // Render success step
  if (currentStep === 'success') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>Đặt lại mật khẩu thành công!</Text>
          <Text style={styles.successMessage}>
            Email đặt lại mật khẩu đã được gửi đến {email}. Vui lòng kiểm tra email và click vào link để đặt lại mật khẩu.
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.successButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render form step
  return (
    <ScrollView style={styles.scrollbox}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email để nhận link đặt lại mật khẩu</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              Chúng tôi sẽ gửi email với link đặt lại mật khẩu đến email của bạn.
            </Text>
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

          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.disabledButton]}
            onPress={handleSendResetEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Gửi email đặt lại mật khẩu</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Nhớ mật khẩu? </Text>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
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
  sendButtonText: {
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
