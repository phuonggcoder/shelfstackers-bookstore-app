import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import emailService from '../services/emailService';
import EmailOTPVerification from './EmailOTPVerification';

interface VerificationBannerProps {
  visible?: boolean;
  onVerificationSuccess?: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({
  visible = true,
  onVerificationSuccess,
}) => {
  const { user, updateUser } = useAuth();
  const { showErrorToast, showSuccessToast } = useUnifiedModal();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show banner if user is verified or banner is not visible
  if (!user || user.is_verified || !visible) {
    return null;
  }

  const handleVerifyEmail = () => {
    setShowOTPModal(true);
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      await emailService.resendVerificationOTP(user.email);
      showSuccessToast('Thành công', 'OTP đã được gửi lại!');
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể gửi lại OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async (data: any) => {
    try {
      // Update user verification status
      await updateUser({ is_verified: true });
      
      // Clear any pending verification data
      await AsyncStorage.removeItem('pendingVerification');
      
      setShowOTPModal(false);
      showSuccessToast('Thành công', 'Email đã được xác thực!');
      
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (error: any) {
      showErrorToast('Lỗi', 'Không thể cập nhật trạng thái xác thực');
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      const response = await emailService.verifyEmailOTP(user.email, otp);
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Ionicons name="mail-unread" size={20} color="#fff" />
          <Text style={styles.bannerText}>
            📧 Vui lòng xác thực email {user.email}
          </Text>
        </View>
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={[styles.resendButton, isLoading && styles.disabledButton]}
            onPress={handleResendOTP}
            disabled={isLoading}
          >
            <Text style={styles.resendText}>
              {isLoading ? 'Đang gửi...' : 'Gửi lại'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyEmail}
          >
            <Text style={styles.verifyText}>Xác thực ngay</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showOTPModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOTPModal(false)}
      >
        <EmailOTPVerification
          email={user.email}
          onVerificationSuccess={handleVerificationSuccess}
          onBack={() => setShowOTPModal(false)}
          type="email-verification"
          onResendOTP={handleResendOTP}
          onVerifyOTP={handleVerifyOTP}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff6b35',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  verifyText: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VerificationBanner;

