import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditProfileScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dobRaw, setDobRaw] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (data) {
      const profile = JSON.parse(data);
      setFullName(profile.fullName || '');
      setFirstName(profile.firstName || '');
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setDobRaw(profile.dobRaw || '');
      setGender(profile.gender || '');
      setSelectedImage(profile.avatar || null);
    }
  };

  const saveData = async () => {
    const profile = {
      fullName: `${fullName} ${firstName} ${username}`, // Kết hợp tên
      email,
      phone,
      dobRaw,
      gender,
      avatar: selectedImage,
    };
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    router.back(); // Navigate back after saving
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const formatDobDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    const day = cleaned.slice(0, 2);
    const month = cleaned.slice(2, 4);
    const year = cleaned.slice(4, 8);
    return [day, month, year].filter(Boolean).join('/');
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const d = selectedDate;
      const raw = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
      setDobRaw(raw);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Thông tin cá nhân</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={selectedImage ? { uri: selectedImage } : require('../assets/images/amazon.png')}
          style={styles.avatar}
        />
        <View style={styles.editIcon}>
          <Ionicons name="create" size={16} color="white" />
        </View>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Họ và tên đệm"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Tên"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Tên người dùng"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.phoneInputWrapper}>
        <TouchableOpacity style={styles.prefixButton}>
          <Text style={{ fontWeight: 'bold' }}>+84 ▼</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TextInput
          style={styles.phoneInput}
          keyboardType="phone-pad"
          placeholder="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          keyboardType="numeric"
          maxLength={10}
          placeholder="Ngày sinh (dd/mm/yyyy)"
          value={formatDobDisplay(dobRaw)}
          onChangeText={(text) => setDobRaw(text.replace(/\D/g, '').slice(0, 8))}
        />
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginLeft: 10 }}>
          <Ionicons name="calendar" size={24} color="gray" />
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <TouchableOpacity onPress={() => setShowGenderPicker(!showGenderPicker)} style={styles.dropdown}>
        <Text>{gender || 'Giới tính'}</Text>
        <Ionicons name="chevron-down" size={20} />
      </TouchableOpacity>
      {showGenderPicker && (
        <View style={styles.genderList}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity key={g} onPress={() => { setGender(g); setShowGenderPicker(false); }}>
              <Text style={styles.genderItem}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={saveData}>
        <Text style={styles.buttonText}>Cập nhật hồ sơ</Text>
      </TouchableOpacity>

      {success && (
        <View style={styles.toast}>
          <Ionicons name="checkmark" color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8 }}>Cập nhật hồ sơ thành công</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
    alignSelf: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#007bff',
    borderRadius: 15,
    padding: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    paddingVertical: Platform.OS === 'ios' ? 12 : 0,
  },
  prefixButton: {
    paddingRight: 6,
  },
  separator: {
    marginHorizontal: 6,
    color: '#888',
    fontWeight: 'bold',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderList: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 6,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  genderItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: '#2979FF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff', fontWeight: 'bold',
  },
  toast: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
});
