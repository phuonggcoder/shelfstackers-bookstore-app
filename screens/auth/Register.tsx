import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
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
import EmailOTPVerification from '../../components/EmailOTPVerification';

type RegistrationStep = 'form' | 'verification' | 'success';

const Register = () => {
  const [step, setStep] = useState<RegistrationStep>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement registration logic
      // Gửi đủ 5 trường khi gọi API
      // { username, full_name: fullName, email, password }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Chuyển sang bước xác thực email
      setStep('verification');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerificationSuccess = async (data: any) => {
    try {
      // TODO: Complete registration after email verification
      // await completeRegistration(data);
      
      setStep('success');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
    }
  };

  const handleSendOTP = async () => {
    try {
      // TODO: Implement send OTP logic
      // await emailService.sendRegistrationOTP(email);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP. Vui lòng thử lại');
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      // TODO: Implement verify OTP logic
      // const result = await emailService.verifyEmailOTP(email, otp);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Mã OTP không đúng. Vui lòng thử lại');
    }
  };

  const renderRegistrationForm = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.push('/login')}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đăng ký</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-add" size={32} color="#667eea" />
              </View>
            </View>

            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>
              Điền thông tin để tạo tài khoản của bạn
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên đăng nhập</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errors.username) setErrors({...errors, username: ''});
                    }}
                    placeholder="Nhập tên đăng nhập"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (errors.fullName) setErrors({...errors, fullName: ''});
                    }}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
                {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({...errors, email: ''});
                    }}
                    placeholder="Nhập email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({...errors, password: ''});
                    }}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="rgba(255, 255, 255, 0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                    }}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="rgba(255, 255, 255, 0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#667eea" />
                  <Text style={styles.registerButtonText}>Đăng ký</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
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

        <Text style={styles.successTitle}>Đăng ký thành công!</Text>
        <Text style={styles.successDescription}>
          Tài khoản của bạn đã được tạo thành công. Bạn sẽ được chuyển đến trang đăng nhập.
        </Text>

        <View style={styles.successEmailContainer}>
          <Ionicons name="mail" size={20} color="#667eea" />
          <Text style={styles.successEmailText}>{email}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (step === 'verification') {
    return (
      <EmailOTPVerification
        email={email}
        onVerificationSuccess={handleEmailVerificationSuccess}
        onBack={() => setStep('form')}
        type="registration"
        onResendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
      />
    );
  }

  if (step === 'success') {
    return renderSuccess();
  }

  return renderRegistrationForm();
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
    paddingTop: 20,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
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
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
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
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  registerButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  },
  successEmailText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default Register;
