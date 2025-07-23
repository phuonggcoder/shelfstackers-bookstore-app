import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigation = useNavigation();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận không khớp');
      return;
    }

    try {
      const res = await axios.post(
        '',
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer YOUR_TOKEN_HERE`, // Lấy token từ AsyncStorage/context
          },
        }
      );

      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
      navigation.goBack();
    } catch (err) {
      console.log('Lỗi đổi mật khẩu:', err);
      Alert.alert('Thất bại', err.response?.data?.message || 'Đã có lỗi xảy ra');
    }
  };

  const renderInput = (label, value, onChangeText, show, toggleShow) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderInput('Mật khẩu hiện tại', currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent))}
          {renderInput('Mật khẩu mới', newPassword, setNewPassword, showNew, () => setShowNew(!showNew))}
          {renderInput('Xác nhận mật khẩu mới', confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm))}
        </ScrollView>

        {/* Nút cố định ở dưới */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
            <Text style={styles.buttonText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // chừa chỗ cho nút
  },
  inputGroup: {
     marginBottom: 16 
    },
  label: {
     fontWeight: '600',
      marginBottom: 6
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
  input: { flex: 1, paddingVertical: 10 },
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
