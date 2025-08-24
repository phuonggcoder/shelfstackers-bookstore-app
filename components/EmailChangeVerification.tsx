import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import EmailOTPVerification from './EmailOTPVerification';

interface EmailChangeVerificationProps {
  currentEmail: string;
  onEmailChangeSuccess: (newEmail: string) => void;
  onBack: () => void;
  onSendOTP?: (email: string, type: 'current' | 'new') => Promise<void>;
  onVerifyOTP?: (email: string, otp: string, type: 'current' | 'new') => Promise<any>;
}

type Step = 'input-new-email' | 'verify-current-email' | 'verify-new-email' | 'success';

const EmailChangeVerification: React.FC<EmailChangeVerificationProps> = ({
  currentEmail,
  onEmailChangeSuccess,
  onBack,
  onSendOTP,
  onVerifyOTP,
}) => {
  const [step, setStep] = useState<Step>('input-new-email');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentEmailVerified, setCurrentEmailVerified] = useState(false);
  const [newEmailVerified, setNewEmailVerified] = useState(false);

  const handleNewEmailSubmit = async () => {
    if (!newEmail || !isValidEmail(newEmail)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      Alert.alert('Lỗi', 'Email mới không được trùng với email hiện tại');
      return;
    }

    setLoading(true);
    try {
      // Kiểm tra email mới có tồn tại không (optional)
      // await checkEmailExists(newEmail);
      
      setStep('verify-current-email');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentEmailVerification = async (data: any) => {
    setCurrentEmailVerified(true);
    setStep('verify-new-email');
  };

  const handleNewEmailVerification = async (data: any) => {
    setNewEmailVerified(true);
    setStep('success');
    
    // Delay để hiển thị success message
    setTimeout(() => {
      onEmailChangeSuccess(newEmail);
    }, 2000);
  };

  const handleSendCurrentEmailOTP = async () => {
    if (onSendOTP) {
      await onSendOTP(currentEmail, 'current');
    }
  };

  const handleSendNewEmailOTP = async () => {
    if (onSendOTP) {
      await onSendOTP(newEmail, 'new');
    }
  };

  const handleVerifyCurrentEmailOTP = async (otp: string) => {
    if (onVerifyOTP) {
      return await onVerifyOTP(currentEmail, otp, 'current');
    }
    return { success: true };
  };

  const handleVerifyNewEmailOTP = async (otp: string) => {
    if (onVerifyOTP) {
      return await onVerifyOTP(newEmail, otp, 'new');
    }
    return { success: true };
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const renderInputNewEmail = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thay đổi email</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-open" size={32} color="#667eea" />
              </View>
            </View>

            <Text style={styles.title}>Thay đổi email</Text>
            <Text style={styles.description}>
              Để thay đổi email, bạn cần xác thực email hiện tại và email mới
            </Text>

            {/* Current Email Display */}
            <View style={styles.emailSection}>
              <Text style={styles.sectionTitle}>Email hiện tại</Text>
              <View style={styles.emailContainer}>
                <Ionicons name="mail-outline" size={16} color="#fff" />
                <Text style={styles.emailText}>{currentEmail}</Text>
              </View>
            </View>

            {/* New Email Input */}
            <View style={styles.emailSection}>
              <Text style={styles.sectionTitle}>Email mới</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="rgba(255, 255, 255, 0.7)" />
                <TextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Nhập email mới"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!newEmail || !isValidEmail(newEmail) || loading) && styles.continueButtonDisabled,
              ]}
              onPress={handleNewEmailSubmit}
              disabled={!newEmail || !isValidEmail(newEmail) || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={20} color="#667eea" />
                  <Text style={styles.continueButtonText}>Tiếp tục</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );

  const renderSuccess = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.gradient}
    >
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </View>

        <Text style={styles.successTitle}>Thay đổi email thành công!</Text>
        <Text style={styles.successDescription}>
          Email của bạn đã được thay đổi thành công
        </Text>

        <View style={styles.successEmailContainer}>
          <Ionicons name="mail" size={20} color="#667eea" />
          <Text style={styles.successEmailText}>{newEmail}</Text>
        </View>

        <View style={styles.successSteps}>
          <View style={styles.successStep}>
            <View style={styles.stepIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.stepText}>Xác thực email cũ</Text>
          </View>
          <View style={styles.successStep}>
            <View style={styles.stepIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.stepText}>Xác thực email mới</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  if (step === 'verify-current-email') {
    return (
      <EmailOTPVerification
        email={currentEmail}
        onVerificationSuccess={handleCurrentEmailVerification}
        onBack={() => setStep('input-new-email')}
        type="email-change"
        onResendOTP={handleSendCurrentEmailOTP}
        onVerifyOTP={handleVerifyCurrentEmailOTP}
      />
    );
  }

  if (step === 'verify-new-email') {
    return (
      <EmailOTPVerification
        email={newEmail}
        onVerificationSuccess={handleNewEmailVerification}
        onBack={() => setStep('verify-current-email')}
        type="email-change"
        onResendOTP={handleSendNewEmailOTP}
        onVerifyOTP={handleVerifyNewEmailOTP}
      />
    );
  }

  if (step === 'success') {
    return renderSuccess();
  }

  return renderInputNewEmail();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  emailSection: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emailText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  continueButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  successEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 40,
  },
  successEmailText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  successSteps: {
    width: '100%',
  },
  successStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    marginRight: 12,
  },
  stepText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default EmailChangeVerification;
