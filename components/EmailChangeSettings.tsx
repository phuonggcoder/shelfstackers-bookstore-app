import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import emailService from '../services/emailService';

interface EmailChangeSettingsProps {
  currentEmail: string;
  onEmailChangeSuccess: (newEmail: string) => void;
  onClose: () => void;
}

type EmailChangeStep = 'form' | 'verification' | 'success';

const EmailChangeSettings: React.FC<EmailChangeSettingsProps> = ({
  currentEmail,
  onEmailChangeSuccess,
  onClose,
}) => {
  const { showErrorToast, showSuccessToast } = useUnifiedModal();
  
  const [currentStep, setCurrentStep] = useState<EmailChangeStep>('form');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oldEmailOtp, setOldEmailOtp] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail || !currentPassword) {
      showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!validateEmail(newEmail)) {
      showErrorToast('Lỗi', 'Email mới không hợp lệ');
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      showErrorToast('Lỗi', 'Email mới phải khác email hiện tại');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await emailService.changeEmail(newEmail, currentPassword);
      
      if (response.success) {
        setCurrentStep('verification');
        showSuccessToast('Thành công', 'OTP đã được gửi đến cả hai email');
      }
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể thay đổi email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!oldEmailOtp || !newEmailOtp) {
      showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    if (oldEmailOtp.length !== 6 || newEmailOtp.length !== 6) {
      showErrorToast('Lỗi', 'Mã OTP phải có 6 số');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await emailService.verifyEmailChange(oldEmailOtp, newEmailOtp);
      
      if (response.success) {
        setCurrentStep('success');
        showSuccessToast('Thành công', 'Email đã được thay đổi thành công');
        
        setTimeout(() => {
          onEmailChangeSuccess(response.email || newEmail);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể xác thực thay đổi email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setOldEmailOtp('');
    setNewEmailOtp('');
  };

  // Render verification step
  if (currentStep === 'verification') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToForm}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Xác thực thay đổi email</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <Text style={styles.infoText}>
                Vui lòng nhập mã OTP đã được gửi đến cả hai email để xác thực thay đổi.
              </Text>
            </View>

            <View style={styles.otpSection}>
              <Text style={styles.sectionTitle}>Mã OTP từ email cũ</Text>
              <Text style={styles.emailText}>{currentEmail}</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập 6 số OTP"
                value={oldEmailOtp}
                onChangeText={setOldEmailOtp}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>

            <View style={styles.otpSection}>
              <Text style={styles.sectionTitle}>Mã OTP từ email mới</Text>
              <Text style={styles.emailText}>{newEmail}</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập 6 số OTP"
                value={newEmailOtp}
                onChangeText={setNewEmailOtp}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.disabledButton]}
              onPress={handleVerifyEmailChange}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Xác thực thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Render success step
  if (currentStep === 'success') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>Thay đổi email thành công!</Text>
          <Text style={styles.successMessage}>
            Email của bạn đã được thay đổi thành công.
          </Text>
        </View>
      </View>
    );
  }

  // Render form step
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Thay đổi email</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              Để thay đổi email, bạn cần xác thực cả email cũ và email mới bằng mã OTP.
            </Text>
          </View>

          <View style={styles.currentEmailSection}>
            <Text style={styles.sectionTitle}>Email hiện tại</Text>
            <View style={styles.currentEmailCard}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.currentEmailText}>{currentEmail}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email mới <Text style={styles.requiredText}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email mới"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu hiện tại <Text style={styles.requiredText}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChangeText={setCurrentPassword}
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

          <TouchableOpacity
            style={[styles.changeButton, isLoading && styles.disabledButton]}
            onPress={handleRequestEmailChange}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.changeButtonText}>Gửi mã xác thực</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
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
  currentEmailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  currentEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  currentEmailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
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
  changeButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  otpSection: {
    marginBottom: 24,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
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
  },
});

export default EmailChangeSettings;
