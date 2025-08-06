import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AvoidKeyboardDummyView from '../../components/AvoidKeyboardDummyView';
import UnifiedCustomComponent from '../../components/UnifiedCustomComponent';
import { useAuth } from '../../context/AuthContext';
import { useUnifiedComponent } from '../../hooks/useUnifiedComponent';
import { authService } from '../../services/authService';

export default function Register() {
  const { signIn } = useAuth();
  const { showAlert, alertVisible, alertConfig, hideAlert } = useUnifiedComponent();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('Lỗi', 'Email không hợp lệ', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Lỗi', 'Mật khẩu không khớp', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.register({
        // Always send a valid username (either provided or generated from email, max 10 chars)
        username: username && username.length <= 20 ? username : email.split('@')[0].substring(0, 10),
        email,
        password,
        full_name: '',
      });

      await signIn(response);
      showAlert('Thành công', 'Đăng ký thành công!', 'success', 'OK');
      setTimeout(() => router.replace('/(tabs)'), 1500);
    } catch (error: any) {
      // Dịch các lỗi phổ biến sang tiếng Việt
      let errorMessage = 'Đã xảy ra lỗi khi đăng ký';
      if (error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('email already exists') || message.includes('email already registered')) {
          errorMessage = 'Email đã tồn tại trong hệ thống';
        } else if (message.includes('username already exists')) {
          errorMessage = 'Tên người dùng đã tồn tại';
        } else if (message.includes('invalid email')) {
          errorMessage = 'Email không hợp lệ';
        } else if (message.includes('password') && message.includes('weak')) {
          errorMessage = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn';
        } else if (message.includes('network') || message.includes('connection')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại';
        } else {
          errorMessage = error.message;
        }
      }
      
      showAlert('Đăng ký thất bại', errorMessage, 'error');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.scrollbox}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.title}>Đăng ký tài khoản</Text>
            <Text style={styles.subtitle}>Nhập thông tin của bạn bên dưới</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên người dùng <Text style={styles.optionalText}>(tùy chọn)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên người dùng (để trống sẽ tự động tạo từ email)"
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nhập lại mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản?</Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <AvoidKeyboardDummyView minHeight={0} maxHeight={300} />
      </ScrollView>

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
    </>
  );
}

const styles = StyleSheet.create({
  scrollbox: {
    backgroundColor: '#fff',
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  form: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  registerButton: {
    backgroundColor: '#3255FB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#3255FB',
    fontSize: 14,
    fontWeight: '600',
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  optionalText: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'normal',
  },
});
