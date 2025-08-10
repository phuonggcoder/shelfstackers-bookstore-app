import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import AddressService, { District, UserAddress } from '../services/addressService';

const EditAddressScreen = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });

  const [formData, setFormData] = useState<Partial<UserAddress>>({
    receiver_name: '',
    phone_number: '',
    province: '',
    ward: '',
    address_detail: '',
    note: '',
    is_default: false,
    type: 'office',
  });

  const fetchAddress = useCallback(async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const addresses = await AddressService.getAddresses(token);
      const addressToEdit = addresses.find(addr => addr._id === id);

      if (addressToEdit) {
        setFormData(addressToEdit);
        await resolveAddressNames(addressToEdit);
      } else {
        Alert.alert(t('error'), t('addressNotFound'));
        router.back();
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      Alert.alert(t('error'), t('cannotLoadAddressInfo'));
    } finally {
      setLoading(false);
    }
  }, [id, token, t, router]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  useFocusEffect(
    useCallback(() => {
      const getSelectedAddress = async () => {
        try {
            const provinceData = await AsyncStorage.getItem('selected_province');
            const wardData = await AsyncStorage.getItem('selected_ward');

            if (provinceData && wardData) {
              const province = JSON.parse(provinceData);
              const ward = JSON.parse(wardData);

              setSelectedProvince(province);
              setSelectedWard(ward);

              setFormData(prev => ({
                ...prev,
                province: province.code,
                ward: ward.code,
              }));

              await AsyncStorage.multiRemove(['selected_province', 'selected_ward']);
            }
        } catch (error) {
          console.error('Error processing selected address:', error);
        }
      };

      getSelectedAddress();
    }, [])
  );

  const resolveAddressNames = async (address: Partial<UserAddress>) => {
    if (!address.province) return;
    try {
      const provinces = await AddressService.getProvinces();
      const province = provinces.find(p => p.code === address.province);
      if (province) setSelectedProvince(province);

      const wards = await AddressService.getWards(address.province);
      const ward = wards.find(w => w.code === address.ward);
      if (ward) setSelectedWard(ward);

    } catch (error) {
      console.error('Error resolving address names:', error);
    }
  };

  const handleSubmit = async () => {
    if (!token || !id) return;

    // Chỉ lấy province và ward bằng name, không lấy district, kiểm tra lại họ tên, sdt, địa chỉ chi tiết
    const requiredFields: (keyof UserAddress)[] = ['receiver_name', 'phone_number', 'province', 'ward', 'address_detail'];
    const isFormValid = requiredFields.every(field => formData[field] && String(formData[field]).trim());
    if (!isFormValid) {
      Alert.alert(t('error'), t('pleaseFillAllRequiredFields'));
      return;
    }
    setSaving(true);
    try {
      const updatePayload = {
        receiver_name: formData.receiver_name?.trim() || '',
        phone_number: formData.phone_number?.trim() || '',
        province: selectedProvince.name,
        ward: selectedWard.name,
        address_detail: formData.address_detail?.trim() || '',
        fullAddress: `${formData.address_detail?.trim() || ''}, ${selectedWard.name}, ${selectedProvince.name}`,
        is_default: formData.is_default,
        note: formData.note,
        type: formData.type,
      };
      await AddressService.updateAddress(token, id.toString(), updatePayload);
      Alert.alert(t('success'), t('addressUpdatedSuccessfully'), [
        {
          text: t('ok'),
          onPress: async () => {
            await AsyncStorage.setItem('address_updated', 'true');
            router.push('/address-list');
          },
        },
      ]);
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert(t('error'), t('cannotUpdateAddressPleaseTryAgain'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3255FB" />
        <Text style={styles.loadingText}>{t('loadingAddress')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editAddress')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contactInformation')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('fullName')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.receiver_name}
              onChangeText={text => setFormData(prev => ({ ...prev, receiver_name: text }))}
              placeholder={t('enterFullName')}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('phoneNumber')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={text => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder={t('enterPhoneNumber')}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shippingAddress')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('address')} *</Text>
            <TouchableOpacity
              style={styles.addressSelector}
              onPress={() => router.push('/address-selection')}
            >
              <Text style={styles.addressText} numberOfLines={1}>
            {selectedProvince.name && selectedWard.name
              ? `${selectedWard.name}, ${selectedProvince.name}`
              : t('selectAddress')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('street')} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address_detail}
              onChangeText={text => setFormData(prev => ({ ...prev, address_detail: text }))}
              placeholder={t('enterStreet')}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('note')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.note}
              onChangeText={text => setFormData(prev => ({ ...prev, note: text }))}
              placeholder={t('noteForShipper')}
              multiline
            />
          </View>
          <TouchableOpacity
            style={styles.defaultToggle}
            onPress={() => setFormData(prev => ({ ...prev, is_default: !prev.is_default }))}
          >
            <Ionicons
              name={formData.is_default ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.is_default ? '#3255FB' : '#666'}
            />
            <Text style={styles.defaultText}>{t('setAsDefaultAddress')}</Text>
          </TouchableOpacity>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addressType')}</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'office' && styles.typeButtonActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'office' }))}
              >
                <Text
                  style={[
                    styles.typeText,
                    formData.type === 'office' && styles.typeTextActive,
                  ]}
                >
                  {t('office')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'home' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'home' }))}
              >
                <Text
                  style={[
                    styles.typeText,
                    formData.type === 'home' && styles.typeTextActive,
                  ]}
                >
                  {t('home')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
            <Text style={styles.saveButtonText}>{t('updateAddress')}</Text>
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
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
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
