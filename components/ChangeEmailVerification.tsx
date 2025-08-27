import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useUnifiedModal } from '../context/UnifiedModalContext';

interface ChangeEmailVerificationProps {
  currentEmail: string;
  newEmail: string;
  currentPassword: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChangeEmailVerification({
  currentEmail,
  newEmail,
  currentPassword,
  onSuccess,
  onCancel,
}: ChangeEmailVerificationProps) {
  const { showErrorToast, showSuccessToast } = useUnifiedModal();
  const [currentEmailOtp, setCurrentEmailOtp] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTPs = async () => {
    try {
      setIsLoading(true);
      
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showErrorToast('Lỗi', 'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Gửi OTP cho cả hai email (backend sẽ gửi cùng lúc)
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/users/change-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail: newEmail,
          currentPassword: currentPassword
        }),
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Không thể gửi OTP';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('❌ Server returned non-JSON response:', errorText.substring(0, 200));
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid server response format');
      }
      
      if (data.success) {
        showSuccessToast('Thành công', 'Mã OTP đã được gửi đến cả hai email');
        setOtpSent(true);
      } else {
        throw new Error(data.message || 'Không thể gửi OTP');
      }
    } catch (error: any) {
      showErrorToast('Lỗi', error.message || 'Không thể gửi OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTPs = async () => {
    if (!currentEmailOtp || !newEmailOtp) {
      showErrorToast('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    try {
      setIsLoading(true);
      
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showErrorToast('Lỗi', 'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Clean OTP values - remove spaces and trim
      const cleanOldOtp = currentEmailOtp.replace(/\s/g, '').trim();
      const cleanNewOtp = newEmailOtp.replace(/\s/g, '').trim();
      
      console.log('🔧 Sending OTPs:', {
        oldEmailOtp: cleanOldOtp,
        newEmailOtp: cleanNewOtp,
        oldLength: cleanOldOtp.length,
        newLength: cleanNewOtp.length
      });
      
      // Xác thực cả 2 OTP
      const response = await fetch('https://server-shelf-stacker-w1ds.onrender.com/api/users/verify-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldEmailOtp: cleanOldOtp,
          newEmailOtp: cleanNewOtp,
        }),
      });
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response as JSON
        let errorMessage = 'Xác thực thất bại';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('🔧 Error response:', errorData);
        } catch (parseError) {
          // If JSON parsing fails, get text response
          const errorText = await response.text();
          console.error('❌ Server returned non-JSON response:', errorText.substring(0, 200));
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      let data;
      try {
        data = await response.json();
        console.log('🔧 Success response:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid server response format');
      }
      
      if (data.success) {
        showSuccessToast('Thành công', 'Email đã được thay đổi thành công');
        onSuccess();
      } else {
        throw new Error(data.message || 'Xác thực thất bại');
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      showErrorToast('Lỗi', error.message || 'Xác thực thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Xác thực đổi email</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Để đổi email từ {currentEmail} thành {newEmail}, bạn cần xác thực cả hai email.
        </Text>

        {!otpSent ? (
          // Bước 1: Gửi OTP
          <TouchableOpacity
            style={[styles.sendOtpButton, isLoading && styles.disabledButton]}
            onPress={handleSendOTPs}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendOtpText}>Gửi mã OTP</Text>
            )}
          </TouchableOpacity>
        ) : (
          // Bước 2: Nhập OTP
          <>
            {/* Email hiện tại */}
            <View style={styles.emailSection}>
              <Text style={styles.sectionTitle}>Email hiện tại</Text>
              <Text style={styles.emailText}>{currentEmail}</Text>
              
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập OTP từ email hiện tại"
                value={currentEmailOtp}
                onChangeText={(text) => {
                  // Remove spaces and limit to 6 digits
                  const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 6);
                  setCurrentEmailOtp(cleaned);
                }}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* Email mới */}
            <View style={styles.emailSection}>
              <Text style={styles.sectionTitle}>Email mới</Text>
              <Text style={styles.emailText}>{newEmail}</Text>
              
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập OTP từ email mới"
                value={newEmailOtp}
                onChangeText={(text) => {
                  // Remove spaces and limit to 6 digits
                  const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 6);
                  setNewEmailOtp(cleaned);
                }}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* Nút xác thực */}
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.disabledButton]}
              onPress={handleVerifyOTPs}
              disabled={isLoading || !currentEmailOtp || !newEmailOtp}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Xác thực và đổi email</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
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
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emailSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },

  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sendOtpButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sendOtpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

