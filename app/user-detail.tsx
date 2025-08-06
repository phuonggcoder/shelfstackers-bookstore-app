import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useAvatar } from '../context/AvatarContext';
import { useName } from '../context/NameContext';

const { width, height } = Dimensions.get('window');

const GENDERS = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
];

export default function UserDetailScreen() {
  const { user, updateUser, isLoading, setUser, token } = useAuth();
  const router = useRouter();
  const { firstName, lastName, setFirstName, setLastName } = useName();
  const { avatarUri, setAvatarUri } = useAvatar();
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = 160;
  const avatarSize = 96;
  const maxScrollDistance = 200;
  
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
          text1: 'Cập nhật ngày sinh thành công',
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
      } else {
        throw new Error(result.message || 'Cập nhật ngày sinh thất bại');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || 'Cập nhật ngày sinh thất bại',
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
          text1: 'Cập nhật ảnh đại diện thành công',
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
        return result.user.avatar;
      } else {
        throw new Error(result.message || 'Upload ảnh thất bại');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || 'Upload ảnh thất bại',
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
        text1: 'Bạn cần cho phép truy cập thư viện ảnh để đổi avatar!',
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
          text1: 'Cập nhật hồ sơ thành công',
          position: 'top',
          visibilityTime: 2000,
          autoHide: true,
          topOffset: 60,
        });
      } else {
        throw new Error(result.message || 'Cập nhật hồ sơ thất bại');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || 'Cập nhật hồ sơ thất bại',
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
          text1: 'Vui lòng kiểm tra email để xác thực!',
          position: 'bottom',
          visibilityTime: 2000,
          autoHide: true,
          bottomOffset: 80,
        });
        setShowVerifyModal(true);
      } else {
        throw new Error(data.message || 'Gửi mã xác thực thất bại');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || 'Có lỗi khi gửi mã xác thực',
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
          text1: 'Xác thực email thành công!',
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
        throw new Error(data.message || 'Mã xác thực không đúng');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e.message || 'Có lỗi khi xác thực',
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

  // Animation values
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, maxScrollDistance],
    outputRange: [0, -headerHeight + 120], // Teo lại chỉ còn ngang avatar
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, maxScrollDistance],
    outputRange: [1, 1.5], 
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, maxScrollDistance],
    outputRange: [0, -25],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, maxScrollDistance],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, maxScrollDistance / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    headerBg: {
      height: headerHeight,
      backgroundColor: '#3B82F6',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      justifyContent: 'center',
      paddingBottom: 0,
      paddingHorizontal: 0,
      position: 'relative',
      zIndex: 10,
    },
    backBtn: {
      position: 'absolute',
      top: 44,
      left: 16,
      zIndex: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      padding: 8,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '700',
      alignSelf: 'center',
      marginBottom: 20,
      marginTop: 32,
      letterSpacing: 0.3,
    },
    avatarSection: {
      alignItems: 'center',
      marginTop: -20,
      marginBottom: 0,
      zIndex: 20,
      position: 'relative',
    },
    avatarWrapper: {
      position: 'relative',
      width: avatarSize,
      height: avatarSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      borderWidth: 5,
      borderColor: '#fff',
      backgroundColor: '#eee',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 8,
    },
    editAvatarBtn: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: '#3B82F6',
      borderRadius: 16,
      padding: 6,
      borderWidth: 3,
      borderColor: '#fff',
      zIndex: 2,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 6,
    },
    form: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: 20,
      width: '100%',
      alignSelf: 'stretch',
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: -6 },
      shadowRadius: 24,
      elevation: 10,
      minHeight: height * 0.6,
    },
    label: {
      fontSize: 16,
      color: '#1F2937',
      marginBottom: 8,
      fontWeight: '700',
      marginTop: 16,
      letterSpacing: 0.1,
    },
    input: {
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      padding: 18,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
      marginBottom: 8,
      color: '#374151',
      shadowColor: '#000',
      shadowOpacity: 0.02,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    inputDisabled: {
      backgroundColor: '#F3F4F6',
      color: '#6B7280',
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    countryCodeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 18,
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      backgroundColor: '#F9FAFB',
      minWidth: 80,
    },
    countryCodeText: {
      fontSize: 16,
      color: '#374151',
      fontWeight: '500',
    },
    saveBtn: {
      backgroundColor: '#3B82F6',
      paddingVertical: 20,
      borderRadius: 20,
      marginTop: 24,
      marginBottom: 10,
      alignItems: 'center',
      shadowColor: '#3B82F6',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 20,
      elevation: 6,
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: 'bold',
      letterSpacing: 0.2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 24,
      width: '85%',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333',
      textAlign: 'center',
    },
    modalInput: {
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
    },
    modalButton: {
      backgroundColor: '#2563eb',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    modalButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    modalCloseButton: {
      padding: 12,
      alignItems: 'center',
    },
    modalCloseText: {
      color: '#ff4757',
      fontWeight: '600',
      fontSize: 16,
    },
    countryModal: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      zIndex: 100,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: -4 },
      shadowRadius: 20,
      elevation: 10,
    },
    countryItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    countryItemText: {
      fontSize: 16,
      color: '#333',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="height"
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#3B82F6', '#3B82F6', '#FFFFFF']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
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
        
        {/* Animated Header */}
        <Animated.View 
          style={[
            styles.headerBg,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }]
            }
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="angle-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity }]}>
            Thông tin cá nhân
          </Animated.Text>
        </Animated.View>
        
        {/* Animated Avatar */}
        <Animated.View 
          style={[
            styles.avatarSection,
            {
              transform: [
                { scale: avatarScale },
                { translateY: avatarTranslateY }
              ]
            }
          ]}
        >
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
        </Animated.View>
        
        {/* Scrollable Form */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 0 }}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            scrollY.setValue(offsetY);
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.form}>
            <Text style={[styles.label, { marginTop: 0 }]}>Họ và tên đệm</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={(v) => { setLastName(v); handleLocalSave('full_name', (v + ' ' + firstName).trim()); }}
              placeholder="Nhập họ và tên đệm"
              placeholderTextColor="#bbb"
            />
            
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={(v) => { setFirstName(v); handleLocalSave('full_name', (lastName + ' ' + v).trim()); }}
              placeholder="Nhập tên thật"
              placeholderTextColor="#bbb"
            />
            
            <Text style={styles.label}>Tên người dùng</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={username}
              editable={false}
            />
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); handleLocalSave('email', v); }}
              placeholder="Email"
              placeholderTextColor="#bbb"
              onBlur={async () => {
                if (email !== user?.email) {
                  await sendVerificationCode(email);
                }
              }}
            />
            
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={[styles.phoneRow, { marginTop: 8 }]}>
              <TouchableOpacity onPress={() => setShowCountryModal(true)} style={styles.countryCodeBtn}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
                <Text style={{ fontSize: 18, marginHorizontal: 4 }}>|</Text>
                <FontAwesome name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={phone}
                onChangeText={(v) => { setPhone(v); handleLocalSave('phone_number', v); }}
                placeholder="Số điện thoại"
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
                        text1: 'Cập nhật số điện thoại thành công',
                        position: 'bottom',
                        visibilityTime: 2000,
                        autoHide: true,
                        bottomOffset: 80,
                      });
                    } catch (e: any) {
                      Toast.show({
                        type: 'error',
                        text1: e.message || 'Cập nhật số điện thoại thất bại',
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
            
            <Text style={styles.label}>Ngày/tháng/năm</Text>
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
            
            <Text style={styles.label}>Giới tính</Text>
            <TouchableOpacity onPress={() => setShowGenderModal(true)} style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }]}>
              <Text style={{ color: gender ? '#333' : '#bbb', fontSize: 16 }}>
                {gender ? GENDERS.find(g => g.value === gender)?.label : 'Chọn giới tính'}
              </Text>
              <FontAwesome name="chevron-down" size={18} color="#bbb" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
              <Text style={styles.saveBtnText}>{isLoading ? 'Đang lưu...' : 'Cập nhật hồ sơ'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Email Verification Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập mã xác thực email</Text>
            <TextInput
              value={verifyCode}
              onChangeText={setVerifyCode}
              placeholder="Nhập mã xác thực"
              keyboardType="number-pad"
              style={styles.modalInput}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={verifyEmailCode}
              disabled={verifying}
            >
              <Text style={styles.modalButtonText}>
                {verifying ? 'Đang xác thực...' : 'Xác thực'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowVerifyModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
      {showCountryModal && (
        <View style={styles.countryModal}>
          {asianCountries.map(c => (
            <TouchableOpacity key={c.code} onPress={() => handleSelectCountry(c.code)} style={styles.countryItem}>
              <Text style={styles.countryItemText}>{c.name} ({c.code})</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowCountryModal(false)} style={styles.countryItem}>
            <Text style={[styles.countryItemText, { color: '#ff4757', textAlign: 'center' }]}>Đóng</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={birthday ? parseDate(birthday) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === 'set' && date) {
              const d = date;
              const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
              setBirthday(formatted);
              updateBirthday(formatted);
            }
          }}
        />
      )}

      {/* Gender Selection Modal */}
      {showGenderModal && (
        <View style={styles.countryModal}>
          {GENDERS.map(g => (
            <TouchableOpacity
              key={g.value}
              onPress={() => {
                setGender(g.value);
                setShowGenderModal(false);
                handleLocalSave('gender', g.value);
              }}
              style={styles.countryItem}
            >
              <Text style={styles.countryItemText}>{g.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowGenderModal(false)} style={styles.countryItem}>
            <Text style={[styles.countryItemText, { color: '#ff4757', textAlign: 'center' }]}>Đóng</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function parseDate(str: string): Date {
  if (!str) return new Date();
  const [day, month, year] = str.split('/').map(Number);
  if (!day || !month || !year) return new Date();
  return new Date(year, month - 1, day);
}