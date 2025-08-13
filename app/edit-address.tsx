import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddressAutocomplete from '../components/AddressAutocomplete.new';

import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import AddressService, { UserAddress } from '../services/addressService';

const EditAddressScreen = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showErrorToast } = useUnifiedModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedDistrict, setSelectedDistrict] = useState({ code: '', name: '' });
  const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });

  const [formData, setFormData] = useState<Partial<UserAddress>>({
    fullName: '',
    phone: '',
    street: '',
    note: '',
    isDefault: false,
    type: 'office',
  });

  const fetchAddress = useCallback(async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const addresses = await AddressService.getAddresses(token);
      const addressToEdit = addresses.find(addr => addr._id === id);
      if (addressToEdit) {
        setFormData({
          fullName: addressToEdit.fullName || '',
          phone: addressToEdit.phone || '',
          street: addressToEdit.street || '',
          note: addressToEdit.note || '',
          isDefault: addressToEdit.isDefault ?? false,
          type: addressToEdit.type || 'office',
        });
        // Resolve province/district/ward as object
        await resolveAddressNames(addressToEdit);
      } else {
        showErrorToast(t('error'), t('addressNotFound'));
        router.back();
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      showErrorToast(t('error'), t('cannotLoadAddressInfo'));
    } finally {
      setLoading(false);
    }
  }, [id, token, t, router, showErrorToast]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  useFocusEffect(
    useCallback(() => {
      const getSelectedAddress = async () => {
        try {
            const provinceData = await AsyncStorage.getItem('selected_province');
            const districtData = await AsyncStorage.getItem('selected_district');
            const wardData = await AsyncStorage.getItem('selected_ward');

            if (provinceData && districtData && wardData) {
              const province = JSON.parse(provinceData);
              const district = JSON.parse(districtData);
              const ward = JSON.parse(wardData);

              setSelectedProvince(province);
              setSelectedDistrict(district);
              setSelectedWard(ward);

              setFormData(prev => ({
                ...prev,
                province: province.code,
                district: district.code,
                ward: ward.code,
              }));

              await AsyncStorage.multiRemove(['selected_province', 'selected_district', 'selected_ward']);
            }
        } catch (error) {
          console.error('Error processing selected address:', error);
        }
      };

      getSelectedAddress();
    }, [])
  );

  const resolveAddressNames = async (address: Partial<UserAddress>) => {
    // Accepts both code or name for province/district/ward
    try {
      const provinces = await AddressService.getProvinces();
      let province = provinces.find(p => p.code === address.province || p.name === address.province);
      if (province) setSelectedProvince(province);

      const districts = province ? await AddressService.getDistricts(province.code) : [];
      let district = districts.find(d => d.code === address.district || d.name === address.district);
      if (district) setSelectedDistrict(district);

      const wards = district ? await AddressService.getWards(district.code) : [];
      let ward = wards.find(w => w.code === address.ward || w.name === address.ward);
      if (ward) setSelectedWard(ward);
    } catch (error) {
      console.error('Error resolving address names:', error);
    }
  };

  const handleSubmit = async () => {
    if (!token || !id) return;

    // Validate required fields
    if (!formData.fullName || !formData.phone || !selectedProvince.code || !selectedDistrict.code || !selectedWard.code || !formData.street) {
      showErrorToast(t('error'), t('pleaseFillAllRequiredFields'));
      return;
    }
    setSaving(true);
    try {
      // Build payload with full objects for province/district/ward (đủ các field cần thiết)
      const updatePayload = {
        fullName: formData.fullName?.trim() || '',
        phone: formData.phone?.trim() || '',
        street: formData.street?.trim() || '',
        province: selectedProvince,
        district: { ...selectedDistrict, provinceId: selectedProvince.code },
        ward: { ...selectedWard, districtId: selectedDistrict.code },
        isDefault: formData.isDefault,
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
      showErrorToast(t('error'), t('cannotUpdateAddressPleaseTryAgain'));
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
              value={formData.fullName}
              onChangeText={text => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholder={t('enterFullName')}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('phoneNumber')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={text => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder={t('enterPhoneNumber')}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('shippingAddress')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('address')} *</Text>
            <AddressAutocomplete
              onAddressSelect={(address) => {
                setSelectedProvince(address.province || { code: '', name: '' });
                setSelectedWard(address.ward || { code: '', name: '' });
                setFormData(prev => ({
                  ...prev,
                  province: address.province?.code || '',
                  ward: address.ward?.code || '',
                }));
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('street')} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.street}
              onChangeText={text => setFormData(prev => ({ ...prev, street: text }))}
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
            onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
          >
            <Ionicons
              name={formData.isDefault ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.isDefault ? '#3255FB' : '#666'}
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
