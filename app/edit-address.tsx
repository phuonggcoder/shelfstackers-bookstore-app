import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomAlert from '../components/BottomAlert';
import { useAuth } from '../context/AuthContext';
import { getAddresses, updateAddress } from '../services/addressService';

const EditAddressScreen = () => {
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    receiver_name: '',
    phone_number: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    street: '',
    address_detail: '',
    note: '',
    is_default: false,
    type: 'office' as 'office' | 'home', // Thêm type
  });

  useEffect(() => {
    if (id && token) {
      fetchAddress();
    }
  }, [id, token]);

  const fetchAddress = async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      console.log('Fetching address with id:', id, 'token:', token);
      
      // Lấy danh sách địa chỉ và tìm địa chỉ cần edit
      const addresses = await getAddresses(token);
      const address = addresses.find((addr: any) => addr._id === id);
      
      if (!address) {
        Alert.alert('Lỗi', 'Địa chỉ không tồn tại hoặc đã bị xóa');
        router.back();
        return;
      }
      
      console.log('Found address:', address);
      
      setFormData({
        receiver_name: address.receiver_name || '',
        phone_number: address.phone_number || '',
        email: address.email || '',
        province: address.province || '',
        district: address.district || '',
        ward: address.ward || '',
        street: address.street || '',
        address_detail: address.address_detail || '',
        note: address.note || '',
        is_default: address.is_default || false,
        type: address.type || 'office', // Thêm type
      });
    } catch (error: any) {
      console.error('Error fetching address:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin địa chỉ');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !id) return;

    // Validation
    if (!formData.receiver_name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người nhận');
      return;
    }
    if (!formData.phone_number.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.province) {
      Alert.alert('Lỗi', 'Vui lòng nhập tỉnh/thành phố');
      return;
    }
    if (!formData.district) {
      Alert.alert('Lỗi', 'Vui lòng nhập quận/huyện');
      return;
    }
    if (!formData.ward) {
      Alert.alert('Lỗi', 'Vui lòng nhập phường/xã');
      return;
    }
    if (!formData.address_detail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    try {
      setSaving(true);
      await updateAddress(token, id as string, formData);
      
      // Show success alert
      setShowAlert(true);
      
      // Set flag to show alert in address list
      await AsyncStorage.setItem('address_added', 'true');
      
      // Go back to address list
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tải thông tin địa chỉ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa địa chỉ</Text>
        <View style={{ width: 24 }} />
      </View>

      <BottomAlert
        title="Cập nhật địa chỉ thành công!"
        visible={showAlert}
        onHide={() => setShowAlert(false)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên người nhận *</Text>
            <TextInput
              style={styles.input}
              value={formData.receiver_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, receiver_name: text }))}
              placeholder="Nhập tên người nhận"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Nhập email (không bắt buộc)"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tỉnh/Thành phố *</Text>
            <TextInput
              style={styles.input}
              value={formData.province}
              onChangeText={(text) => setFormData(prev => ({ ...prev, province: text }))}
              placeholder="Nhập tỉnh/thành phố"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quận/Huyện *</Text>
            <TextInput
              style={styles.input}
              value={formData.district}
              onChangeText={(text) => setFormData(prev => ({ ...prev, district: text }))}
              placeholder="Nhập quận/huyện"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phường/Xã *</Text>
            <TextInput
              style={styles.input}
              value={formData.ward}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ward: text }))}
              placeholder="Nhập phường/xã"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Đường</Text>
            <TextInput
              style={styles.input}
              value={formData.street}
              onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
              placeholder="Nhập đường (không bắt buộc)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ chi tiết *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address_detail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address_detail: text }))}
              placeholder="Số nhà, tên tòa nhà, v.v."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.note}
              onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
              placeholder="Ghi chú giao hàng (không bắt buộc)"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Thêm phần chọn loại địa chỉ */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loại địa chỉ</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'office' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'office' }))}
              >
                <Text style={[styles.typeText, formData.type === 'office' && styles.typeTextActive]}>
                  🏢 Văn phòng
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'home' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'home' }))}
              >
                <Text style={[styles.typeText, formData.type === 'home' && styles.typeTextActive]}>
                  🏠 Nhà riêng
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Xóa phần toggle star (mặc định) khỏi UI */}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Cập nhật địa chỉ</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  defaultText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3255FB',
    borderColor: '#3255FB',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditAddressScreen;
