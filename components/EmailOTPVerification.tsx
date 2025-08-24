import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EmailOTPVerificationProps {
  email: string;
  onVerificationSuccess: (data: any) => void;
  onBack: () => void;
  type?: 'registration' | 'email-change' | 'password-reset';
  onResendOTP?: () => Promise<void>;
  onVerifyOTP?: (otp: string) => Promise<any>;
}

const { width } = Dimensions.get('window');

const EmailOTPVerification: React.FC<EmailOTPVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBack,
  type = 'registration',
  onResendOTP,
  onVerifyOTP,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const inputRefs = useRef<TextInput[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation khi component mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto focus vào input đầu tiên
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 600);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Auto verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleVerifyOTP = async (otpString?: string) => {
    const otpToVerify = otpString || otp.join('');
    
    if (otpToVerify.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (onVerifyOTP) {
        const result = await onVerifyOTP(otpToVerify);
        onVerificationSuccess(result);
      } else {
        // Fallback logic nếu không có custom verify function
        onVerificationSuccess({ success: true, otp: otpToVerify });
      }
    } catch (error: any) {
      setError(error.message || 'Mã OTP không đúng. Vui lòng thử lại');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      if (onResendOTP) {
        await onResendOTP();
      }
      setCountdown(300); // 5 minutes
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
      Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
    } catch (error: any) {
      setError(error.message || 'Không thể gửi lại OTP. Vui lòng thử lại');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTitle = () => {
    switch (type) {
      case 'registration':
        return 'Xác thực đăng ký';
      case 'email-change':
        return 'Xác thực thay đổi email';
      case 'password-reset':
        return 'Xác thực đặt lại mật khẩu';
      default:
        return 'Xác thực email';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'registration':
        return 'Chúng tôi đã gửi mã xác thực đến email của bạn để hoàn tất đăng ký';
      case 'email-change':
        return 'Chúng tôi đã gửi mã xác thực đến email mới để xác nhận thay đổi';
      case 'password-reset':
        return 'Chúng tôi đã gửi mã xác thực đến email của bạn để đặt lại mật khẩu';
      default:
        return 'Chúng tôi đã gửi mã xác thực đến email của bạn';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail" size={32} color="#667eea" />
              </View>
            </View>

            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.description}>{getDescription()}</Text>

            <View style={styles.emailContainer}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.emailText}>{email}</Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>Nhập mã xác thực 6 số</Text>
              <View style={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref!)}
                    style={[
                      styles.otpInput,
                      focusedIndex === index && styles.otpInputFocused,
                      error && styles.otpInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    keyboardType="numeric"
                    maxLength={1}
                    editable={!loading}
                  />
                ))}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Gửi lại sau: {formatTime(countdown)}
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#667eea" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#667eea" />
                      <Text style={styles.resendButtonText}>Gửi lại mã</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (loading || otp.some(digit => digit === '')) && styles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerifyOTP()}
              disabled={loading || otp.some(digit => digit === '')}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.verifyButtonText}>Xác thực</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
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
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 40,
  },
  emailText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  otpInput: {
    width: (width - 80) / 6,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  otpInputFocused: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otpInputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  resendContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  verifyButton: {
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
  },
  verifyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  verifyButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default EmailOTPVerification;
