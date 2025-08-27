import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import AddressSelector from './index';

interface AddressData {
  province: any;
  district: any;
  ward: any;
}

const AddressSelectorDemo: React.FC = () => {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);

  const handleAddressChange = (address: AddressData) => {
    setSelectedAddress(address);
    console.log('Selected address:', address);
  };

  const handleSubmit = () => {
    if (!selectedAddress?.province || !selectedAddress?.district || !selectedAddress?.ward) {
      Alert.alert(t('error'), 'Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện và phường/xã');
      return;
    }

    Alert.alert(
      t('success'),
      `Địa chỉ đã chọn: ${selectedAddress.province.name} - ${selectedAddress.district.name} - ${selectedAddress.ward.name}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Demo Address Selector</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chọn địa chỉ</Text>
        <AddressSelector
          onChange={handleAddressChange}
          required={true}
          style={styles.addressSelector}
        />
      </View>

      {selectedAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ đã chọn:</Text>
          <View style={styles.selectedAddress}>
            <Text style={styles.addressText}>
              <Text style={styles.label}>Tỉnh/Thành:</Text> {selectedAddress.province?.name || 'Chưa chọn'}
            </Text>
            <Text style={styles.addressText}>
              <Text style={styles.label}>Quận/Huyện:</Text> {selectedAddress.district?.name || 'Chưa chọn'}
            </Text>
            <Text style={styles.addressText}>
              <Text style={styles.label}>Phường/Xã:</Text> {selectedAddress.ward?.name || 'Chưa chọn'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Response Format:</Text>
        <Text style={styles.codeText}>
          {JSON.stringify(selectedAddress, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressSelector: {
    marginTop: 8,
  },
  selectedAddress: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    color: '#666',
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    color: '#333',
  },
});

export default AddressSelectorDemo;





