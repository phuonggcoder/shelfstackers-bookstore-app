import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import UnifiedCustomComponent from '../components/UnifiedCustomComponent';
import { useUnifiedComponent } from '../hooks/useUnifiedComponent';
import { authService } from '../services/authService'; // ✅ Đảm bảo đường dẫn đúng

const ChangePassword = () => {
  const { showAlert, alertVisible, alertConfig, hideAlert } = useUnifiedComponent();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Lỗi', 'Mật khẩu mới và xác nhận không khớp', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showAlert('Lỗi', 'Không tìm thấy token người dùng. Vui lòng đăng nhập lại.', 'error');
        return;
      }

      const message = await authService.changePassword(currentPassword, newPassword, token);
      showAlert('Thành công', message, 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err: any) {
      console.log('Lỗi đổi mật khẩu:', err.message);
      
      // Dịch các lỗi phổ biến sang tiếng Việt
      let errorMessage = 'Đã có lỗi xảy ra';
      if (err.message) {
        const message = err.message.toLowerCase();
        if (message.includes('current password is incorrect') || message.includes('mật khẩu hiện tại không đúng')) {
          errorMessage = 'Mật khẩu hiện tại không đúng';
        } else if (message.includes('password') && message.includes('incorrect')) {
          errorMessage = 'Mật khẩu không đúng';
        } else if (message.includes('invalid') && message.includes('password')) {
          errorMessage = 'Mật khẩu không hợp lệ';
        } else if (message.includes('unauthorized') || message.includes('401')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
        } else if (message.includes('network') || message.includes('connection')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại';
        } else {
          errorMessage = err.message;
        }
      }
      
      showAlert('Thất bại', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    show: boolean,
    toggleShow: () => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          secureTextEntry={!show}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity onPress={toggleShow}>
          <Ionicons name={show ? 'eye' : 'eye-off'} size={22} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Image source={require('../assets/images/quaylai.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi Mật khẩu</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderInput('Mật khẩu hiện tại', 'Nhập mật khẩu hiện tại...', currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent))}
          {renderInput('Mật khẩu mới', 'Nhập mật khẩu mới...', newPassword, setNewPassword, showNew, () => setShowNew(!showNew))}
          {renderInput('Xác nhận mật khẩu mới', 'Nhập lại mật khẩu mới...', confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm))}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#3255FB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    position: 'relative',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ChangePassword;
