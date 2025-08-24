import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import EmailChangeVerification from './EmailChangeVerification';

interface EmailChangeSettingsProps {
  currentEmail: string;
  onEmailChangeSuccess: (newEmail: string) => void;
  visible: boolean;
  onClose: () => void;
}

const EmailChangeSettings: React.FC<EmailChangeSettingsProps> = ({
  currentEmail,
  onEmailChangeSuccess,
  visible,
  onClose,
}) => {
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleEmailChangeSuccess = (newEmail: string) => {
    onEmailChangeSuccess(newEmail);
    setIsChangingEmail(false);
    onClose();
    
    Alert.alert(
      'Thành công',
      `Email đã được thay đổi thành: ${newEmail}`,
      [{ text: 'OK' }]
    );
  };

  const handleStartEmailChange = () => {
    setIsChangingEmail(true);
  };

  const handleBackToSettings = () => {
    setIsChangingEmail(false);
  };

  const handleSendOTP = async (email: string, type: 'current' | 'new') => {
    try {
      // TODO: Implement API call to send OTP
      // await emailService.sendOTP(email, type);
      
      Alert.alert(
        'Thành công',
        `Mã OTP đã được gửi đến ${email}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP. Vui lòng thử lại');
    }
  };

  const handleVerifyOTP = async (email: string, otp: string, type: 'current' | 'new') => {
    try {
      // TODO: Implement API call to verify OTP
      // const result = await emailService.verifyOTP(email, otp, type);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept any 6-digit OTP
      if (otp.length === 6 && /^\d{6}$/.test(otp)) {
        return { success: true, message: 'Xác thực thành công' };
      } else {
        throw new Error('Mã OTP không đúng. Vui lòng thử lại.');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Mã OTP không đúng. Vui lòng thử lại.');
    }
  };

  if (isChangingEmail) {
    return (
      <EmailChangeVerification
        currentEmail={currentEmail}
        onEmailChangeSuccess={handleEmailChangeSuccess}
        onBack={handleBackToSettings}
        onSendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thay đổi email</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Current Email Display */}
          <View style={styles.currentEmailSection}>
            <Text style={styles.sectionTitle}>Email hiện tại</Text>
            <View style={styles.emailContainer}>
              <Ionicons name="mail" size={20} color="#667eea" />
              <Text style={styles.emailText}>{currentEmail}</Text>
            </View>
          </View>

          {/* Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={24} color="#667eea" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Quy trình thay đổi email</Text>
              <Text style={styles.infoDescription}>
                Để thay đổi email, bạn cần xác thực email hiện tại và email mới để đảm bảo tính bảo mật.
              </Text>
            </View>
          </View>

          {/* Steps */}
          <View style={styles.stepsSection}>
            <Text style={styles.stepsTitle}>Các bước thực hiện:</Text>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Nhập email mới</Text>
                <Text style={styles.stepDescription}>
                  Nhập địa chỉ email mới mà bạn muốn sử dụng
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Xác thực email hiện tại</Text>
                <Text style={styles.stepDescription}>
                  Nhập mã OTP được gửi đến email hiện tại
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Xác thực email mới</Text>
                <Text style={styles.stepDescription}>
                  Nhập mã OTP được gửi đến email mới
                </Text>
              </View>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningSection}>
            <View style={styles.warningIcon}>
              <Ionicons name="warning" size={20} color="#ff9500" />
            </View>
            <Text style={styles.warningText}>
              Lưu ý: Sau khi thay đổi email, bạn sẽ cần sử dụng email mới để đăng nhập vào tài khoản.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.changeEmailButton}
            onPress={handleStartEmailChange}
          >
            <Ionicons name="mail-open" size={20} color="#fff" />
            <Text style={styles.changeEmailButtonText}>Bắt đầu thay đổi email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentEmailSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  stepsSection: {
    marginBottom: 30,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  warningSection: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changeEmailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default EmailChangeSettings;
