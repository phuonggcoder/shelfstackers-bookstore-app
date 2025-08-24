import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import emailService from '../services/emailService';

interface EmailVerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: (data: any) => void;
  type?: 'registration' | 'forgot-password' | 'email-change';
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  email,
  onClose,
  onSuccess,
  type = 'registration',
}) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && email) {
      handleSendOTP();
    }
  }, [visible, email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await emailService.sendRegistrationOTP(email);
      
      if (response.success) {
        setCountdown(300); // 5 minutes
        Alert.alert(
          t('emailVerification.otpSent'),
          t('emailVerification.checkEmail'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error: any) {
      setError(error.message);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      setError('');
      
      const response = await emailService.resendOTP(email);
      
      if (response.success) {
        setCountdown(300); // 5 minutes
        Alert.alert(
          t('emailVerification.otpResent'),
          t('emailVerification.checkEmail'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error: any) {
      setError(error.message);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError(t('emailVerification.invalidOtp'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await emailService.verifyEmailOTP(email, otp);
      
      if (response.success) {
        Alert.alert(
          t('emailVerification.success'),
          t('emailVerification.emailVerified'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                onSuccess(response);
                onClose();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      setError(error.message);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTitle = () => {
    switch (type) {
      case 'registration':
        return t('emailVerification.verifyRegistration');
      case 'forgot-password':
        return t('emailVerification.verifyForgotPassword');
      case 'email-change':
        return t('emailVerification.verifyEmailChange');
      default:
        return t('emailVerification.verifyEmail');
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'registration':
        return t('emailVerification.registrationDescription');
      case 'forgot-password':
        return t('emailVerification.forgotPasswordDescription');
      case 'email-change':
        return t('emailVerification.emailChangeDescription');
      default:
        return t('emailVerification.defaultDescription');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>{getTitle()}</Text>
            
            <Text style={styles.description}>
              {getDescription()}
            </Text>
            
            <Text style={styles.emailText}>
              {email}
            </Text>

            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>{t('emailVerification.enterOtp')}</Text>
              <TextInput
                style={[styles.otpInput, error ? styles.otpInputError : null]}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.countdownContainer}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  {t('emailVerification.resendIn')} {formatTime(countdown)}
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.resendButtonText}>
                      {t('emailVerification.resendOtp')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.verifyButton, loading ? styles.disabledButton : null]}
                onPress={handleVerifyOTP}
                disabled={loading || !otp || otp.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>{t('emailVerification.verify')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#FFFFFF',
  },
  otpInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  countdownContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#666666',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
});

export default EmailVerificationModal;
