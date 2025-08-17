import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { useAuth } from '../../context/AuthContext';
import { useUnifiedModal } from '../../context/UnifiedModalContext';
import { authService } from '../../services/authService';

export default function Register() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { showErrorToast, showSuccessToast, showAlert } = useUnifiedModal();
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
      showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    if (!validateEmail(email)) {
      showErrorToast('Lỗi', 'Email không hợp lệ');
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      showErrorToast(t('error'), t('passwordMinLength'));
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
      showAlert('Đăng ký thành công', 'Chào mừng bạn!', 'OK', 'success');
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.message || t('registrationError');
      showErrorToast(t('registrationFailed'), errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollbox}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>{t('registerAccount')}</Text>
          <Text style={styles.subtitle}>{t('enterYourInformationBelow')}</Text>
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
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterEmail')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterPassword')}
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
            <Text style={styles.label}>{t('confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('confirmPassword')}
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
              <Text style={styles.registerButtonText}>{t('register')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <AvoidKeyboardDummyView minHeight={0} maxHeight={300} />
    </ScrollView>
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
    padding: 20,
    width: 100,
    height: 100,
    // marginHorizontal: 220,
    marginTop:30
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
    // marginBottom: 20,
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
    transform: [{ translateY: -10 }],
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
