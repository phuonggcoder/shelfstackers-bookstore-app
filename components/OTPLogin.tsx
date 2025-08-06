import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';
import OTPService from '../services/otpService';
import UnifiedCustomComponent from './UnifiedCustomComponent';

interface OTPLoginProps {
  onLoginSuccess: (result: any) => void;
  onBack: () => void;
}

const OTPLogin: React.FC<OTPLoginProps> = ({ onLoginSuccess, onBack }) => {
  const { showAlert, alertVisible, alertConfig, hideAlert } = useUnifiedComponent();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Request OTP
  const handleRequestOTP = async () => {
    if (!phone || phone.length < 10) {
      showAlert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ', 'error');
      return;
    }

    setIsRequestingOTP(true);
    try {
      const result = await OTPService.requestOTP(phone);
      if (result.success) {
        setOtpSent(true);
        setCountdown(180); // 3 phút
        showAlert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn', 'success');
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 500);
      } else {
        showAlert('Lỗi', result.msg || 'Không thể gửi OTP. Vui lòng thử lại', 'error');
      }
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Không thể gửi OTP. Vui lòng thử lại', 'error');
    } finally {
      setIsRequestingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      showAlert('Lỗi', 'Vui lòng nhập mã OTP 4 số', 'error');
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const result = await OTPService.verifyOTP(phone, otp);
      if (result.success) {
        showAlert('Thành công', 'Đăng nhập thành công!', 'success');
        onLoginSuccess(result);
      }
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Mã OTP không đúng. Vui lòng thử lại', 'error');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleRequestOTP();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Đăng nhập bằng OTP</Text>
      </View>
      
      {/* Phone Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
          editable={!otpSent}
          maxLength={11}
        />
        {!otpSent && (
          <TouchableOpacity
            style={[styles.button, isRequestingOTP && styles.buttonDisabled]}
            onPress={handleRequestOTP}
            disabled={isRequestingOTP}
          >
            {isRequestingOTP ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Gửi OTP</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* OTP Input */}
      {otpSent && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mã OTP</Text>
          <TextInput
            ref={otpInputRef}
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="Nhập mã OTP 4 số"
            keyboardType="numeric"
            maxLength={4}
          />
          
          {/* Countdown */}
          {countdown > 0 && (
            <Text style={styles.countdown}>
              Gửi lại sau: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </Text>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.button, isVerifyingOTP && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={isVerifyingOTP}
          >
            {isVerifyingOTP ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Xác thực OTP</Text>
            )}
          </TouchableOpacity>

          {/* Resend Button */}
          <TouchableOpacity
            style={[styles.resendButton, countdown > 0 && styles.buttonDisabled]}
            onPress={handleResendOTP}
            disabled={countdown > 0}
          >
            <Text style={styles.resendButtonText}>
              {countdown > 0 ? 'Gửi lại' : 'Gửi lại OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Unified Components */}
      <UnifiedCustomComponent
        type="alert"
        mode={alertConfig.mode as any}
        visible={alertVisible}
        title={alertConfig.title}
        description={alertConfig.description}
        buttonText={alertConfig.buttonText}
        onButtonPress={hideAlert}
      />
    </KeyboardAvoidingView>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3255FB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    backgroundColor: 'transparent',
    padding: 10,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#3255FB',
    fontSize: 14,
  },
  countdown: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default OTPLogin; 