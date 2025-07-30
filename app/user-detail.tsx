import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useAvatar } from '../context/AvatarContext';
import { useName } from '../context/NameContext';

const GENDERS = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
];

export default function UserDetailScreen() {
  const { t } = useTranslation();
  const { user, updateUser, isLoading, setUser, token } = useAuth();
  const router = useRouter();
  const { firstName, lastName, setFirstName, setLastName } = useName();
  const { avatarUri, setAvatarUri } = useAvatar();
  // Đặt getDefaultAvatar lên trước khi dùng
  const getDefaultAvatar = () => {
    if (user?._id || user?.username || user?.email) {
      return `https://i.pravatar.cc/150?u=${user?._id || user?.username || user?.email}`;
    }
    return 'https://i.pravatar.cc/150';
  };
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || getDefaultAvatar());
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');
  // Khi truy cập user.birth_date, dùng optional chaining và ép kiểu any nếu type User chưa có birth_date
  const [birthday, setBirthday] = useState((user as any)?.birth_date ? formatDate((user as any).birth_date) : (user?.birthday || ''));
  const [gender, setGender] = useState(user?.gender || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [countryCode, setCountryCode] = useState('+84');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const asianCountries = [
    { code: '+84', name: 'Việt Nam' },
    { code: '+81', name: 'Nhật Bản' },
    { code: '+82', name: 'Hàn Quốc' },
    { code: '+86', name: 'Trung Quốc' },
    { code: '+66', name: 'Thái Lan' },
    { code: '+65', name: 'Singapore' },
    { code: '+62', name: 'Indonesia' },
    { code: '+60', name: 'Malaysia' },
  ];

  // Thêm hàm formatDate để chuyển yyyy-mm-ddT... thành dd/mm/yyyy
  function formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    const loadUserData = async () => {
      const localUser = await AsyncStorage.getItem('user');
      const localCountry = await AsyncStorage.getItem('user_countryCode');
      let parsedUser = localUser ? JSON.parse(localUser) : null;
      if (parsedUser) {
        setLastName(parsedUser?.full_name?.split(' ').slice(0, -1).join(' ') || '');
        setFirstName(parsedUser?.full_name?.split(' ').slice(-1)[0] || '');
        setEmail(parsedUser?.email || '');
        setPhone(parsedUser?.phone_number || '');
        setCountryCode(localCountry || '+84');
        setBirthday(parsedUser?.birth_date ? formatDate(parsedUser.birth_date) : (parsedUser?.birthday || ''));
        setGender(parsedUser?.gender || '');
        setAvatar(parsedUser?.avatar || getDefaultAvatar());
        setUsername(parsedUser?.username || '');
        if (parsedUser?.avatar) setAvatarUri(parsedUser.avatar);
      } else if (user) {
        setLastName(user?.full_name?.split(' ').slice(0, -1).join(' ') || '');
        setFirstName(user?.full_name?.split(' ').slice(-1)[0] || '');
        setEmail(user?.email || '');
        setPhone(user?.phone_number || '');
        setCountryCode(localCountry || '+84');
        setBirthday((user as any)?.birth_date ? formatDate((user as any).birth_date) : (user?.birthday || ''));
        setGender(user?.gender || '');
        setAvatar(user?.avatar || getDefaultAvatar());
        setUsername(user?.username || '');
        if (user?.avatar) setAvatarUri(user.avatar);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    };
    loadUserData();
  }, [user, setAvatarUri, setFirstName, setLastName]);

  // Sửa updateBirthday để gửi birth_date lên backend, cập nhật lại context, AsyncStorage, state
  const updateBirthday = async (birthdayStr: string) => {
    try {
      const localToken = token || await AsyncStorage.getItem('token');
      // Chuyển dd/mm/yyyy thành yyyy-mm-ddT00:00:00.000Z
      const [day, month, year] = birthdayStr.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
      const response = await fetch(`${API_BASE_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localToken}`,
        },
        body: JSON.stringify({ birth_date: isoDate }),
      });
      const result = await response.json();
      if (result.success && result.user) {
        setUser(result.user);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setBirthday(formatDate(result.user.birth_date));
        Toast.show({
          type: 'success',
          text1: t('birthdayUpdateSuccess'),
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
      } else {
        throw new Error(result.message || t('birthdayUpdateFailed'));
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || t('birthdayUpdateFailed'),
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
        bottomOffset: 80,
      });
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!user || !user._id) return null;
    try {
      const localToken = token || await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('avatar', {
        uri: imageUri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);
      const response = await fetch(`${API_BASE_URL}/api/user-upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localToken}`,
        },
        body: formData,
      });
      const result = await response.json();
      if (result.success && result.user && result.user.avatar) {
        setAvatar(result.user.avatar);
        setAvatarUri(result.user.avatar);
        setUser(result.user);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        Toast.show({
          type: 'success',
          text1: t('avatarUpdateSuccess'),
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
        return result.user.avatar;
      } else {
        throw new Error(result.message || t('avatarUploadFailed'));
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || t('avatarUploadFailed'),
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
        bottomOffset: 80,
      });
    }
    return null;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({
        type: 'error',
        text1: t('needPhotoLibraryPermission'),
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
        bottomOffset: 80,
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      await uploadAvatar(imageUri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const localToken = token || await AsyncStorage.getItem('token');
      const full_name = (lastName + ' ' + firstName).trim();
      const data = {
        username: user.username,
        email,
        full_name,
        phone_number: phone,
        gender,
        avatar,
        roles: user.roles,
      };
      const response = await fetch(`${API_BASE_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success && result.user) {
        setUser(result.user);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setEmail(result.user.email);
        setPhone(result.user.phone_number);
        setGender(result.user.gender);
        setLastName(result.user.full_name?.split(' ').slice(0, -1).join(' ') || '');
        setFirstName(result.user.full_name?.split(' ').slice(-1)[0] || '');
        Toast.show({
          type: 'success',
          text1: t('profileUpdateSuccess'),
          position: 'top',
          visibilityTime: 2000,
          autoHide: true,
          topOffset: 60,
        });
      } else {
        throw new Error(result.message || t('profileUpdateFailed'));
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || t('profileUpdateFailed'),
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
        bottomOffset: 80,
      });
    }
  };

  const handleLocalSave = async (field: string, value: string) => {
    await AsyncStorage.setItem(`user_${field}`, value);
    // Update AsyncStorage user object to keep it in sync
    const localUser = await AsyncStorage.getItem('user');
    const updatedUser = localUser ? { ...JSON.parse(localUser), [field]: value } : { [field]: value };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const sendVerificationCode = async (emailToSend: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend }),
      });
      const data = await res.json();
      if (data.success) {
        Toast.show({
          type: 'info',
          text1: t('checkEmailForVerification'),
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
        setShowVerifyModal(true);
      } else {
        throw new Error(data.message || t('sendVerificationFailed'));
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || t('errorSendingVerification'),
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
        bottomOffset: 80,
      });
    }
  };

  const verifyEmailCode = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: t('emailVerificationSuccess'),
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
        setShowVerifyModal(false);
        setVerifyCode('');
        // Khi xác thực email thành công, đảm bảo _id là string
        setUser({ ...user, email, _id: user?._id || '', username: user?.username || '', full_name: user?.full_name || '', roles: user?.roles || [] });
        await AsyncStorage.setItem('user', JSON.stringify({ ...user, email, _id: user?._id || '', username: user?.username || '', full_name: user?.full_name || '', roles: user?.roles || [] }));
        setEmail(user?.email || '');
      } else {
        throw new Error(data.message || t('verificationCodeIncorrect'));
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || t('errorDuringVerification'),
        position: 'bottom',
        visibilityTime: 2000,
        autoHide: true,
        bottomOffset: 80,
      });
    }
    setVerifying(false);
  };

  // Khi chọn vùng, chỉ lưu local, không gọi API, không Toast
  const handleSelectCountry = async (code: string) => {
    setCountryCode(code);
    await AsyncStorage.setItem('user_countryCode', code);
    setShowCountryModal(false);
  };

  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    headerBg: {
      height: 140,
      backgroundColor: '#2563eb',
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      justifyContent: 'center',
      paddingBottom: 0,
      paddingHorizontal: 0,
      position: 'relative',
    },
    backBtn: {
      position: 'absolute',
      top: 44,
      left: 16,
      zIndex: 2,
      backgroundColor: 'transparent',
      borderRadius: 20,
      padding: 4,
    },
    headerTitle: {
      color: '#fff',
      fontSize: 22,
      fontWeight: 'bold',
      alignSelf: 'center',
      marginBottom: 0,
      marginTop: 32,
      letterSpacing: 0.2,
    },
    avatarSection: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 0,
      zIndex: 10,
      position: 'relative',
    },
    avatarWrapper: {
      position: 'relative',
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 5,
      borderColor: '#fff',
      backgroundColor: '#eee',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 4,
    },
    editAvatarBtn: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: '#2563eb',
      borderRadius: 12,
      padding: 3,
      borderWidth: 2,
      borderColor: '#fff',
      zIndex: 2,
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    form: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: 48,
      width: '100%',
      alignSelf: 'stretch',
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 40,
      shadowColor: '#000',
      shadowOpacity: 0.10,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 18,
      elevation: 6,
    },
    label: {
      fontSize: 13,
      color: '#888',
      marginBottom: 4,
      fontWeight: '500',
      marginTop: 16,
      letterSpacing: 0.1,
    },
    input: {
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      padding: 14,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
      marginBottom: 0,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 0,
    },
    saveBtn: {
      backgroundColor: '#2563eb',
      paddingVertical: 18,
      borderRadius: 24,
      marginTop: 32,
      marginBottom: 0,
      alignItems: 'center',
      shadowColor: '#2563eb',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 2,
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: 'bold',
      letterSpacing: 0.2,
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F6F7FB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>
        <LinearGradient
          colors={['#2563eb', '#6ea8fe', '#e3edfa', '#fafdff', '#fff']}
          locations={[0, 0.25, 0.6, 0.85, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            width: '100%',
            zIndex: 0,
          }}
          pointerEvents="none"
        />
        <View style={styles.headerBg}>
          <LinearGradient
            colors={['#2563eb', '#2563eb', '#6ea8fe', '#e3edfa']}
            locations={[0, 0.5, 0.8, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="angle-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('personalInformation')}</Text>
        </View>
        <View style={styles.avatarSection}>
          <BlurView
            intensity={30}
            tint="light"
            style={{
              position: 'absolute',
              top: 90,
              left: 0,
              right: 0,
              height: 40,
              width: '100%',
              borderRadius: 0,
              zIndex: 1,
            }}
            pointerEvents="none"
          />
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatar || getDefaultAvatar() }}
              style={styles.avatar}
              contentFit="cover"
            />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage}>
              <FontAwesome name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>{t('lastName')}</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={(v) => { setLastName(v); handleLocalSave('full_name', (v + ' ' + firstName).trim()); }}
            placeholder={t('enterLastName')}
            placeholderTextColor="#bbb"
          />
          <Text style={styles.label}>{t('firstName')}</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={(v) => { setFirstName(v); handleLocalSave('full_name', (lastName + ' ' + v).trim()); }}
            placeholder={t('enterFirstName')}
            placeholderTextColor="#bbb"
          />
          <Text style={styles.label}>{t('username')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#F3F4F6', color: '#888' }]}
            value={username}
            editable={false}
          />
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => { setEmail(v); handleLocalSave('email', v); }}
            placeholder={t('email')}
            placeholderTextColor="#bbb"
            onBlur={async () => {
              if (email !== user?.email) {
                await sendVerificationCode(email);
              }
            }}
          />
          <Modal
            visible={showVerifyModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowVerifyModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{t('enterVerificationCode')}</Text>
                <TextInput
                  value={verifyCode}
                  onChangeText={setVerifyCode}
                  placeholder={t('enterVerificationCode')}
                  keyboardType="number-pad"
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 }}
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 8 }}
                  onPress={verifyEmailCode}
                  disabled={verifying}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{verifying ? t('verifying') : t('verify')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
                  <Text style={{ color: 'red', textAlign: 'center' }}>{t('close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Text style={styles.label}>{t('phoneNumber')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowCountryModal(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, backgroundColor: '#F9FAFB', marginRight: 8 }}>
              <Text style={{ fontSize: 16 }}>{countryCode}</Text>
              <Text style={{ fontSize: 18, marginHorizontal: 4 }}>|</Text>
              <FontAwesome name="chevron-down" size={18} color="#bbb" />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={phone}
              onChangeText={(v) => { setPhone(v); handleLocalSave('phone_number', v); }}
              placeholder={t('phoneNumber')}
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
              onBlur={async () => {
                if (phone !== user?.phone_number) {
                  try {
                    await updateUser({ phone_number: phone });
                    const updatedUser = { ...user, phone_number: phone };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    setPhone(updatedUser.phone_number);
                    Toast.show({
                      type: 'success',
                      text1: t('phoneUpdateSuccess'),
                      position: 'bottom',
                      visibilityTime: 2000,
                      autoHide: true,
                      bottomOffset: 80,
                    });
                  } catch (e: any) {
                    Toast.show({
                      type: 'error',
                      text1: e.message || t('phoneUpdateFailed'),
                      position: 'bottom',
                      visibilityTime: 2000,
                      autoHide: true,
                      bottomOffset: 80,
                    });
                  }
                }
              }}
            />
          </View>
          {showCountryModal && (
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, zIndex: 100 }}>
              {asianCountries.map(c => (
                <TouchableOpacity key={c.code} onPress={() => handleSelectCountry(c.code)} style={{ padding: 16 }}>
                  <Text style={{ fontSize: 16 }}>{c.name} ({c.code})</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowCountryModal(false)} style={{ padding: 16 }}>
                <Text style={{ color: 'red', textAlign: 'center' }}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.label}>{t('birthday')}</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              style={styles.input}
              value={birthday}
              editable={false}
              placeholder="dd/mm/yyyy"
              placeholderTextColor="#bbb"
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthday ? parseDate(birthday) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  const d = date;
                  const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                  setBirthday(formatted);
                  updateBirthday(formatted);
                }
              }}
            />
          )}
          <Text style={styles.label}>{t('gender')}</Text>
          <TouchableOpacity onPress={() => setShowGenderModal(true)} style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={{ color: gender ? '#222' : '#bbb', fontSize: 16 }}>
              {gender ? GENDERS.find(g => g.value === gender)?.label : t('selectGender')}
            </Text>
            <FontAwesome name="chevron-down" size={18} color="#bbb" />
          </TouchableOpacity>
          {showGenderModal && (
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => {
                    setGender(g.value);
                    setShowGenderModal(false);
                    handleLocalSave('gender', g.value);
                  }}
                  style={{ padding: 16 }}
                >
                  <Text style={{ fontSize: 16 }}>{g.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowGenderModal(false)} style={{ padding: 16 }}>
                <Text style={{ color: 'red', textAlign: 'center' }}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
            <Text style={styles.saveBtnText}>{isLoading ? t('saving') : t('updateProfile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function parseDate(str: string): Date {
  if (!str) return new Date();
  const [day, month, year] = str.split('/').map(Number);
  if (!day || !month || !year) return new Date();
  return new Date(year, month - 1, day);
}