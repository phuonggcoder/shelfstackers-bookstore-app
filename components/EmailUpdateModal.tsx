import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import emailService from '../services/emailService';

type EmailUpdateStep = 'form' | 'verification' | 'success';

interface EmailUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentEmail: string;
}

export default function EmailUpdateModal({
  visible,
  onClose,
  onSuccess,
  currentEmail,
}: EmailUpdateModalProps) {
  const { showErrorToast, showSuccessToast } = useUnifiedModal();
  
  const [currentStep, setCurrentStep] = useState<EmailUpdateStep>('form');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      showErrorToast('Lỗi', 'Email không hợp lệ');
      return;
    }

    if (newEmail === currentEmail) {
      showErrorToast('Lỗi', 'Email mới phải khác email hiện tại');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await emailService.changeEmail(newEmail, currentPassword);
      
      if (response.success) {
        setCurrentStep('verification');
        showSuccessToast('Thành công', 'Mã OTP đã được gửi đến cả 2 email');
      }
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể gửi OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailChange = async (oldOtp: string, newOtp: string) => {
    try {
      const response = await emailService.verifyEmailChange(oldOtp, newOtp);
      
      if (response.success) {
        setCurrentStep('success');
        showSuccessToast('Thành công', 'Email đã được cập nhật thành công');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleClose = () => {
    setCurrentStep('form');
    setNewEmail('');
    setCurrentPassword('');
    setShowPassword(false);
    setIsLoading(false);
    onClose();
  };

  const handleResendOTP = async () => {
    try {
      await emailService.changeEmail(newEmail, currentPassword);
      showSuccessToast('Thành công', 'Mã OTP mới đã được gửi');
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể gửi lại OTP');
    }
  };

  // Render verification step
  if (currentStep === 'verification') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Xác thực đổi email</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <Text style={styles.infoText}>
                Chúng tôi đã gửi mã OTP đến cả email cũ và email mới. Vui lòng nhập cả 2 mã để xác thực.
              </Text>
            </View>

            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>Mã OTP từ email cũ ({currentEmail})</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập mã OTP"
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>

            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>Mã OTP từ email mới ({newEmail})</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập mã OTP"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => handleVerifyEmailChange('123456', '123456')} // Demo
            >
              <Text style={styles.verifyButtonText}>Xác thực</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
              <Text style={styles.resendButtonText}>Gửi lại mã OTP</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Render success step
  if (currentStep === 'success') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.successTitle}>Cập nhật email thành công!</Text>
            <Text style={styles.successMessage}>
              Email của bạn đã được cập nhật thành công.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Render form step
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Cập nhật email</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              Để đổi email, bạn cần nhập mật khẩu hiện tại và email mới. Chúng tôi sẽ gửi mã OTP đến cả 2 email để xác thực.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email hiện tại</Text>
            <Text style={styles.currentEmail}>{currentEmail}</Text>
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
            style={[styles.updateButton, isLoading && styles.disabledButton]}
            onPress={handleRequestEmailChange}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Cập nhật email</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
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
  currentEmail: {
    fontSize: 16,
    color: '#666',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  updateButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  otpContainer: {
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
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
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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

