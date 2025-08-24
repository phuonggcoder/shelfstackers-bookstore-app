import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import EmailChangeVerification from './EmailChangeVerification';
import EmailOTPVerification from './EmailOTPVerification';

type DemoStep = 'menu' | 'registration' | 'email-change' | 'password-reset';

const EmailVerificationDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<DemoStep>('menu');
  const [demoEmail, setDemoEmail] = useState('user@example.com');
  const [newEmail, setNewEmail] = useState('newuser@example.com');

  const handleBackToMenu = () => {
    setCurrentStep('menu');
  };

  const handleRegistrationSuccess = (data: any) => {
    Alert.alert(
      'Đăng ký thành công!',
      'Tài khoản đã được tạo và xác thực email thành công.',
      [
        {
          text: 'OK',
          onPress: () => setCurrentStep('menu'),
        },
      ]
    );
  };

  const handleEmailChangeSuccess = (newEmail: string) => {
    setDemoEmail(newEmail);
    Alert.alert(
      'Thay đổi email thành công!',
      `Email đã được thay đổi thành: ${newEmail}`,
      [
        {
          text: 'OK',
          onPress: () => setCurrentStep('menu'),
        },
      ]
    );
  };

  const handlePasswordResetSuccess = (data: any) => {
    Alert.alert(
      'Đặt lại mật khẩu thành công!',
      'Mật khẩu mới đã được gửi đến email của bạn.',
      [
        {
          text: 'OK',
          onPress: () => setCurrentStep('menu'),
        },
      ]
    );
  };

  const handleSendOTP = async (email: string, type?: 'current' | 'new') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    Alert.alert('Thành công', `Mã OTP đã được gửi đến ${email}`);
  };

  const handleVerifyOTP = async (email: string, otp: string, type?: 'current' | 'new') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate OTP verification (for demo, accept any 6-digit code)
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      return { success: true, message: 'Xác thực thành công' };
    } else {
      throw new Error('Mã OTP không đúng. Vui lòng thử lại.');
    }
  };

  const renderMenu = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="mail" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Email Verification Demo</Text>
          <Text style={styles.headerSubtitle}>
            Demo các tính năng xác thực email
          </Text>
        </View>

        {/* Demo Options */}
        <View style={styles.optionsContainer}>
          {/* Registration Demo */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setCurrentStep('registration')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="person-add" size={24} color="#667eea" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Đăng ký tài khoản</Text>
              <Text style={styles.optionDescription}>
                Xác thực email khi đăng ký tài khoản mới
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Email Change Demo */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setCurrentStep('email-change')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="mail-open" size={24} color="#667eea" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Thay đổi email</Text>
              <Text style={styles.optionDescription}>
                Xác thực email cũ và email mới khi thay đổi
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Password Reset Demo */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setCurrentStep('password-reset')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="key" size={24} color="#667eea" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Đặt lại mật khẩu</Text>
              <Text style={styles.optionDescription}>
                Xác thực email để đặt lại mật khẩu
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Current Email Display */}
        <View style={styles.currentEmailContainer}>
          <Text style={styles.currentEmailLabel}>Email hiện tại:</Text>
          <Text style={styles.currentEmailText}>{demoEmail}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng:</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Chọn một tính năng để xem demo
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Nhập mã OTP 6 số bất kỳ để test
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Trải nghiệm UI/UX hiện đại và mượt mà
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );

  if (currentStep === 'registration') {
    return (
      <EmailOTPVerification
        email={demoEmail}
        onVerificationSuccess={handleRegistrationSuccess}
        onBack={handleBackToMenu}
        type="registration"
        onResendOTP={() => handleSendOTP(demoEmail)}
        onVerifyOTP={(otp) => handleVerifyOTP(demoEmail, otp)}
      />
    );
  }

  if (currentStep === 'email-change') {
    return (
      <EmailChangeVerification
        currentEmail={demoEmail}
        onEmailChangeSuccess={handleEmailChangeSuccess}
        onBack={handleBackToMenu}
        onSendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
      />
    );
  }

  if (currentStep === 'password-reset') {
    return (
      <EmailOTPVerification
        email={demoEmail}
        onVerificationSuccess={handlePasswordResetSuccess}
        onBack={handleBackToMenu}
        type="password-reset"
        onResendOTP={() => handleSendOTP(demoEmail)}
        onVerifyOTP={(otp) => handleVerifyOTP(demoEmail, otp)}
      />
    );
  }

  return renderMenu();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  currentEmailContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  currentEmailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  currentEmailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
  },
});

export default EmailVerificationDemo;
