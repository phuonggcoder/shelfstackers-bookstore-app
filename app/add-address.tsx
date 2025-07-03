import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { createAddress, LocationItem } from '../services/addressService';

const AddAddress = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [isDefault, setIsDefault] = useState(true);
  const [addressType, setAddressType] = useState<'office' | 'home'>('office');
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [province, setProvince] = useState<LocationItem | null>(null);
  const [district, setDistrict] = useState<LocationItem | null>(null);
  const [ward, setWard] = useState<LocationItem | null>(null);
  const [addressDetail, setAddressDetail] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const getLocationFromStorage = async () => {
        try {
          const p = await AsyncStorage.getItem('selected_province');
          const d = await AsyncStorage.getItem('selected_district');
          const w = await AsyncStorage.getItem('selected_ward');
          if (p) setProvince(JSON.parse(p));
          if (d) setDistrict(JSON.parse(d));
          if (w) setWard(JSON.parse(w));
        } catch (error) {
          console.error('Error loading location from storage:', error);
        }
      };
      getLocationFromStorage();
    }, [])
  );

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để thêm địa chỉ');
      return;
    }

    if (!receiverName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    if (!province || !district || !ward) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ địa chỉ');
      return;
    }

    if (!addressDetail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    setLoading(true);
    try {
      await createAddress(token, {
        receiver_name: receiverName.trim(),
        phone_number: phoneNumber.trim(),
        province: province.name,
        district: district.name,
        ward: ward.name,
        address_detail: addressDetail.trim(),
        is_default: isDefault,
        type: addressType,
      });

      // Clear stored location data
      await AsyncStorage.multiRemove([
        'selected_province',
        'selected_district',
        'selected_ward',
      ]);

      Alert.alert('Thành công', 'Địa chỉ đã được thêm thành công', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Create address failed:', error);
      Alert.alert('Lỗi', 'Không thể thêm địa chỉ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = () => {
    const parts = [];
    if (addressDetail) parts.push(addressDetail);
    if (ward) parts.push(ward.name);
    if (district) parts.push(district.name);
    if (province) parts.push(province.name);
    return parts.join(', ');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ mới</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Thông tin người nhận</Text>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Họ và tên"
            style={styles.input}
            value={receiverName}
            onChangeText={setReceiverName}
          />
          <TextInput
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <Text style={styles.sectionTitle}>Địa chỉ</Text>

        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => router.push('/select-location?level=province')}
          >
            <Text style={[styles.selectText, province && styles.selectedText]}>
              {province?.name || 'Chọn Tỉnh/Thành phố'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.selectInput, !province && styles.disabledInput]}
            onPress={() =>
              province &&
              router.push(`/select-location?level=district&provinceCode=${province.code}`)
            }
            disabled={!province}
          >
            <Text style={[styles.selectText, district && styles.selectedText]}>
              {district?.name || 'Chọn Quận/Huyện'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.selectInput, !district && styles.disabledInput]}
            onPress={() =>
              district &&
              router.push(`/select-location?level=ward&districtCode=${district.code}`)
            }
            disabled={!district}
          >
            <Text style={[styles.selectText, ward && styles.selectedText]}>
              {ward?.name || 'Chọn Phường/Xã'}
            </Text>
          </TouchableOpacity>
          
          <TextInput
            placeholder="Tên đường, Tòa nhà, Số nhà..."
            style={styles.input}
            value={addressDetail}
            onChangeText={setAddressDetail}
            multiline
          />
        </View>

        {formatAddress() && (
          <View style={styles.addressPreview}>
            <Text style={styles.previewTitle}>Địa chỉ đã chọn:</Text>
            <Text style={styles.previewText}>{formatAddress()}</Text>
          </View>
        )}

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            thumbColor="#fff"
            trackColor={{ false: '#ccc', true: '#3255FB' }}
          />
        </View>

        <View style={styles.typeContainer}>
          <Text style={styles.switchLabel}>Loại địa chỉ</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, addressType === 'office' && styles.typeButtonActive]}
              onPress={() => setAddressType('office')}
            >
              <Text style={[styles.typeText, addressType === 'office' && styles.typeTextActive]}>
                Văn phòng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, addressType === 'home' && styles.typeButtonActive]}
              onPress={() => setAddressType('home')}
            >
              <Text style={[styles.typeText, addressType === 'home' && styles.typeTextActive]}>
                Nhà riêng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Đang thêm...' : 'Hoàn thành'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  body: { 
    flex: 1 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { 
    fontSize: 16, 
    color: '#3255FB' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  formContainer: { 
    padding: 16 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    marginTop: 16,
    color: '#000' 
  },
  inputGroup: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16 
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  selectInput: { 
    paddingVertical: 12, 
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  disabledInput: {
    opacity: 0.5,
  },
  selectText: { 
    color: '#999', 
    fontSize: 16 
  },
  selectedText: {
    color: '#000',
    fontWeight: '500',
  },
  addressPreview: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3255FB',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  switchContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: { 
    fontSize: 16, 
    color: '#000' 
  },
  typeContainer: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24 
  },
  typeButtons: { 
    flexDirection: 'row', 
    marginTop: 12 
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  typeButtonActive: { 
    backgroundColor: '#3255FB', 
    borderColor: '#3255FB' 
  },
  typeText: { 
    fontSize: 14, 
    color: '#666' 
  },
  typeTextActive: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#3255FB',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});

export default AddAddress;
