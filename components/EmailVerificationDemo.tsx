import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import EmailChangeSettings from './EmailChangeSettings';
import EmailOTPVerification from './EmailOTPVerification';

interface EmailVerificationDemoProps {
  visible: boolean;
  onClose: () => void;
}

const EmailVerificationDemo: React.FC<EmailVerificationDemoProps> = ({
  visible,
  onClose,
}) => {
  const { showSuccessToast, showErrorToast } = useUnifiedModal();
  const [currentDemo, setCurrentDemo] = useState<'menu' | 'registration' | 'email-change' | 'forgot-password'>('menu');
  const [demoEmail, setDemoEmail] = useState('demo@example.com');

  const handleDemoAction = (action: string) => {
    switch (action) {
      case 'registration':
        setCurrentDemo('registration');
        break;
      case 'email-change':
        setCurrentDemo('email-change');
        break;
      case 'forgot-password':
        setCurrentDemo('forgot-password');
        break;
      case 'back':
        setCurrentDemo('menu');
        break;
    }
  };

  const handleRegistrationDemo = async () => {
    try {
      showSuccessToast('Demo', 'Gửi OTP đăng ký thành công!');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentDemo('registration');
    } catch (error) {
      showErrorToast('Demo Error', 'Không thể gửi OTP');
    }
  };

  const handleEmailChangeDemo = () => {
    setCurrentDemo('email-change');
  };

  const handleForgotPasswordDemo = () => {
    setCurrentDemo('forgot-password');
  };

  const handleBackToMenu = () => {
    setCurrentDemo('menu');
  };

  const handleEmailChangeSuccess = (newEmail: string) => {
    showSuccessToast('Demo Success', `Email đã được thay đổi thành: ${newEmail}`);
    setCurrentDemo('menu');
  };

  // Render registration demo
  if (currentDemo === 'registration') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Demo: Đăng ký tài khoản</Text>
          </View>

          <EmailOTPVerification
            email={demoEmail}
            onVerificationSuccess={(otp) => {
              showSuccessToast('Demo Success', `Xác thực OTP thành công: ${otp}`);
              setCurrentDemo('menu');
            }}
            onBack={handleBackToMenu}
            type="registration"
            onResendOTP={async () => {
              showSuccessToast('Demo', 'Gửi lại OTP thành công!');
            }}
            onVerifyOTP={async (otp) => {
              // Simulate verification
              await new Promise(resolve => setTimeout(resolve, 1000));
              return { success: true, user: { email: demoEmail, is_verified: true } };
            }}
          />
        </View>
      </Modal>
    );
  }

  // Render email change demo
  if (currentDemo === 'email-change') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <EmailChangeSettings
          currentEmail={demoEmail}
          onEmailChangeSuccess={handleEmailChangeSuccess}
          onClose={onClose}
        />
      </Modal>
    );
  }

  // Render forgot password demo
  if (currentDemo === 'forgot-password') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Demo: Quên mật khẩu</Text>
          </View>

          <EmailOTPVerification
            email={demoEmail}
            onVerificationSuccess={(otp) => {
              showSuccessToast('Demo Success', `Đặt lại mật khẩu thành công với OTP: ${otp}`);
              setCurrentDemo('menu');
            }}
            onBack={handleBackToMenu}
            type="password-reset"
            onResendOTP={async () => {
              showSuccessToast('Demo', 'Gửi lại OTP thành công!');
            }}
            onVerifyOTP={async (otp) => {
              // Simulate password reset
              await new Promise(resolve => setTimeout(resolve, 1000));
              return { success: true };
            }}
          />
        </View>
      </Modal>
    );
  }

  // Render main menu
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Email Verification Demo</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              Demo hệ thống xác thực email với các tính năng đăng ký, đổi email và quên mật khẩu.
            </Text>
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.sectionTitle}>Chọn tính năng demo:</Text>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={handleRegistrationDemo}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.demoCardGradient}
              >
                <Ionicons name="person-add" size={32} color="#fff" />
                <Text style={styles.demoCardTitle}>Đăng ký tài khoản</Text>
                <Text style={styles.demoCardDescription}>
                  Demo luồng đăng ký với xác thực email OTP
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={handleEmailChangeDemo}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.demoCardGradient}
              >
                <Ionicons name="mail-open" size={32} color="#fff" />
                <Text style={styles.demoCardTitle}>Thay đổi email</Text>
                <Text style={styles.demoCardDescription}>
                  Demo luồng thay đổi email với xác thực 2 bước
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={handleForgotPasswordDemo}
            >
              <LinearGradient
                colors={['#ff9800', '#f57c00']}
                style={styles.demoCardGradient}
              >
                <Ionicons name="lock-open" size={32} color="#fff" />
                <Text style={styles.demoCardTitle}>Quên mật khẩu</Text>
                <Text style={styles.demoCardDescription}>
                  Demo luồng đặt lại mật khẩu qua email OTP
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Tính năng đã implement:</Text>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>6-digit OTP input với auto-focus</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Auto-verify khi nhập đủ 6 số</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Countdown timer cho resend OTP</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Animations và error handling</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Responsive design</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Tích hợp với backend API</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
    marginRight: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
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
  demoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  demoCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  demoCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  demoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  demoCardDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
});

export default EmailVerificationDemo;
