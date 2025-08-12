import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AddressSelector from '../components/AddressSelector';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import AddressService, { AddressData } from '../services/addressService';

const AddAddress = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { showErrorToast } = useUnifiedModal();
  const [loading, setLoading] = useState(false);
  const [addressType, setAddressType] = useState<'office' | 'home'>('office');
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);

  const handleAddressChange = (address: any) => {
    setSelectedAddress(address);
  };

  const handleSubmit = async () => {
    if (!token) {
      showErrorToast(t('error'), t('pleaseLoginToAddAddress'));
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

    if (!selectedAddress) {
      showErrorToast(t('error'), t('pleaseSelectCompleteAddress'));
      return;
    }


    if (!addressDetail.trim()) {
      Alert.alert(t('error'), t('pleaseEnterDetailedAddress'));
      return;
    }

    setLoading(true);
    try {
      // Log dữ liệu gửi đi để debug
      // Đảm bảo selectedAddress có đủ trường autocomplete34 và fullAddress
      // Chỉ lấy province và ward bằng name, không lấy district
      const wardName = selectedAddress?.ward?.name || '';
      const provinceName = selectedAddress?.province?.name || '';
      const fullAddress = `${addressDetail.trim()}, ${wardName}, ${provinceName}`;
      const addressPayload = {
        receiver_name: receiverName.trim(),
        phone_number: phoneNumber.trim(),
        province: provinceName,
        ward: wardName,
        address_detail: addressDetail.trim(),
        fullAddress,
        is_default: false,
      };
      console.log('Payload gửi lên API:', addressPayload);
      await AddressService.addAddress(token, addressPayload);
      Alert.alert(t('success'), t('addressAddedSuccessfully'), [
        {
          text: t('ok'),
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Create address failed:', error);
      showErrorToast(t('error'), t('cannotAddAddressPleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = () => {
    if (!selectedAddress) return '';
    const parts = [
      addressDetail,
      selectedAddress.ward.name,
      selectedAddress.province.name
    ].filter(Boolean);
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



        <View style={styles.section}>
          <AddressSelector onChange={handleAddressChange} />
        </View>

        <View style={styles.section}>
          <TextInput
            placeholder={t('streetBuildingHouseNumber')}
            style={styles.input}
            value={addressDetail}
            onChangeText={setAddressDetail}
            multiline
          />
        </View>

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
        </View>
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {t('complete')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  section: {
    marginBottom: 24,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
