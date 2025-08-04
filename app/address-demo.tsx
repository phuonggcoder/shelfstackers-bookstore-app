import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { AddressData } from '../services/addressService';

const AddressDemoScreen = () => {
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);

  const handleAddressSelect = (address: AddressData) => {
    console.log('Địa chỉ đã chọn:', address);
    setSelectedAddress(address);
    
    Alert.alert(
      'Địa chỉ đã chọn',
      `Tỉnh/Thành: ${address.province.name}\nQuận/Huyện: ${address.district.name}\nPhường/Xã: ${address.ward.name}\nĐịa chỉ đầy đủ: ${address.fullAddress}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Demo Address Autocomplete</Text>
      <Text style={styles.subtitle}>Chọn địa chỉ giao hàng</Text>
      
      <AddressAutocomplete onAddressSelect={handleAddressSelect} />
      
      {selectedAddress && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Địa chỉ đã chọn:</Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Tỉnh/Thành phố:</Text>
            <Text style={styles.resultValue}>{selectedAddress.province.name}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Quận/Huyện:</Text>
            <Text style={styles.resultValue}>{selectedAddress.district.name}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Phường/Xã:</Text>
            <Text style={styles.resultValue}>{selectedAddress.ward.name}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Địa chỉ đầy đủ:</Text>
            <Text style={styles.resultValue}>{selectedAddress.fullAddress}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Mã địa chỉ:</Text>
            <Text style={styles.resultValue}>
              {selectedAddress.addressCode.provinceCode} - {selectedAddress.addressCode.districtCode} - {selectedAddress.addressCode.wardCode}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  resultContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
    flexShrink: 0,
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default AddressDemoScreen; 