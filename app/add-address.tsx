import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';

import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AddressService, { LocationItem } from '../services/addressService';

const AddAddress = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [isDefault, setIsDefault] = useState(false); // luôn là false
  const [addressType, setAddressType] = useState<'office' | 'home'>('office');
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [province, setProvince] = useState<LocationItem | null>(null);
  const [district, setDistrict] = useState<LocationItem | null>(null);
  const [ward, setWard] = useState<LocationItem | null>(null);
  const [addressDetail, setAddressDetail] = useState('');
const [addressMode, setAddressMode] = useState<'34-provinces' | '63-provinces'>('63-provinces');
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  useFocusEffect(
  useCallback(() => {
    const getLocationFromStorage = async () => {
      try {
        const mode = await AsyncStorage.getItem('address_mode');
        if (mode === '34-provinces' || mode === '63-provinces') setAddressMode(mode);
        const p = await AsyncStorage.getItem('selected_province');
        const d = await AsyncStorage.getItem('selected_district');
        const w = await AsyncStorage.getItem('selected_ward');
        if (p) setProvince(JSON.parse(p));
        else setProvince(null);
        if (d) setDistrict(JSON.parse(d));
        else setDistrict(null);
        if (w) setWard(JSON.parse(w));
        else setWard(null);
      } catch (error) {
        console.error('Error loading location from storage:', error);
      }
    };
    getLocationFromStorage();
  }, [])
);

  const handleSelectAddress = async () => {
    // Navigate to address selection
    router.push('/address-selection?type=province');
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert(t('error'), t('pleaseLoginToAddAddress'));
      return;
    }

    if (!receiverName.trim()) {
      Alert.alert(t('error'), t('pleaseEnterFullName'));
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert(t('error'), t('pleaseEnterPhoneNumber'));
      return;
    }

    if (!province || !district || !ward) {
      Alert.alert(t('error'), t('pleaseSelectCompleteAddress'));
      return;
    }

    if (!addressDetail.trim()) {
      Alert.alert(t('error'), t('pleaseEnterDetailedAddress'));
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
  receiver_name: receiverName.trim(),
  phone_number: phoneNumber.trim(),
  province: province?.name ?? '',
  address_detail: addressDetail.trim(),
  is_default: false, // luôn là false khi thêm mới
  type: addressType,
};
if (addressMode === '63-provinces') {
  payload.district = district?.name ?? '';
  payload.ward = ward?.name ?? '';
} else {
  payload.ward = ward?.name ?? '';
}
await AddressService.createAddress(token, payload);

      // Clear stored location data
      await AsyncStorage.multiRemove([
        'selected_province',
        'selected_district',
        'selected_ward',
      ]);

      // Set flag to show success alert in address list
      await AsyncStorage.setItem('address_added', 'true');
      
      Alert.alert(t('success'), t('addressAddedSuccessfully'), [
        {
          text: t('ok'),
          onPress: () => {
            // Go back to address list instead of order review
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Create address failed:', error);
      Alert.alert(t('error'), t('cannotAddAddressPleaseTryAgain'));
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

  const formatSelectedAddress = () => {
    const parts = [];
    if (province) parts.push(province.name);
    if (district) parts.push(district.name);
    if (ward) parts.push(ward.name);
    return parts.join(', ');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
              behavior={undefined}
    >
      <View style={[styles.headerContainer, { marginTop: 24 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← {t('goBack')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('newAddress')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.formContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('recipientInformation')}</Text>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder={t('fullName')}
            style={styles.input}
            value={receiverName}
            onChangeText={setReceiverName}
          />
          <TextInput
            placeholder={t('phoneNumber')}
            keyboardType="phone-pad"
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('addressInformation')}</Text>



        <View style={styles.addressSelector}>
          <TouchableOpacity 
            style={styles.addressSelectorButton}
            onPress={handleSelectAddress}
          >
            <View style={styles.addressSelectorContent}>
              <Text style={styles.addressSelectorLabel}>
                {t('selectAddress') || 'Chọn Tỉnh/Thành phố, Quận/Huyện, Phường/Xã'}
              </Text>
              {(province || district || ward) ? (
                <Text style={styles.addressSelectorValue}>
                  {formatSelectedAddress()}
                </Text>
              ) : (
                <Text style={styles.addressSelectorPlaceholder}>
                  {t('tapToSelectAddress') || 'Chạm để chọn địa chỉ'}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder={t('streetBuildingHouseNumber')}
          style={styles.input}
          value={addressDetail}
          onChangeText={setAddressDetail}
          multiline
        />

        {formatAddress() && (
          <View style={styles.addressPreview}>
            <Text style={styles.previewTitle}>{t('selectedAddress')}:</Text>
            <Text style={styles.previewText}>{formatAddress()}</Text>
          </View>
        )}

        <View style={styles.typeContainer}>
          <Text style={styles.switchLabel}>{t('addressType')}</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, addressType === 'office' && styles.typeButtonActive]}
              onPress={() => setAddressType('office')}
            >
              <Text style={[styles.typeText, addressType === 'office' && styles.typeTextActive]}>
                {t('office')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, addressType === 'home' && styles.typeButtonActive]}
              onPress={() => setAddressType('home')}
            >
              <Text style={[styles.typeText, addressType === 'home' && styles.typeTextActive]}>
                {t('home')}
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
            {loading ? t('adding') : t('complete')}
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
  addressSelector: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  addressSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  addressSelectorContent: {
    flex: 1,
  },
  addressSelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressSelectorValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  addressSelectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
});

export default AddAddress;
