import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddressService, { AddressData, District, Province, Ward } from '../services/addressService';

interface AddressAutocompleteProps {
  onAddressSelect?: (address: AddressData) => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onAddressSelect }) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getAllProvinces();
      
      if (response.success) {
        setProvinces(response.data);
      } else {
        setError('Không thể tải danh sách tỉnh/thành phố');
      }
    } catch (err) {
      setError('Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (provinceCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getDistricts(provinceCode);
      
      if (response.success) {
        setDistricts(response.data);
        setWards([]);
      } else {
        setError('Không thể tải danh sách quận/huyện');
      }
    } catch (err) {
      setError('Không thể tải danh sách quận/huyện');
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async (districtCode: string, provinceCode?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getWards(districtCode, provinceCode);
      
      if (response.success) {
        setWards(response.data);
      } else {
        setError('Không thể tải danh sách phường/xã');
      }
    } catch (err) {
      setError('Không thể tải danh sách phường/xã');
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    loadDistricts(province.code);
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    loadWards(district.code, selectedProvince?.code);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    
    if (onAddressSelect && selectedProvince && selectedDistrict) {
      onAddressSelect({
        province: selectedProvince,
        district: selectedDistrict,
        ward: ward,
        fullAddress: `${ward.name}, ${selectedDistrict.name}, ${selectedProvince.name}`,
        addressCode: {
          provinceCode: selectedProvince.code,
          districtCode: selectedDistrict.code,
          wardCode: ward.code
        }
      });
    }
  };

  const renderItem = ({ item, type }: { item: Province | District | Ward; type: 'province' | 'district' | 'ward' }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        switch (type) {
          case 'province':
            handleProvinceSelect(item as Province);
            break;
          case 'district':
            handleDistrictSelect(item as District);
            break;
          case 'ward':
            handleWardSelect(item as Ward);
            break;
        }
      }}
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading && provinces.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      
      {/* Province Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Tỉnh/Thành phố *</Text>
        <TextInput
          style={styles.input}
          placeholder="Chọn tỉnh/thành phố"
          value={selectedProvince?.name || ''}
          editable={false}
        />
        {provinces.length > 0 && (
                     <FlatList
             data={provinces}
             keyExtractor={(item) => item.code}
             renderItem={(props) => renderItem({ ...props, type: 'province' })}
             style={styles.list}
           />
        )}
      </View>

      {/* District Selection */}
      {selectedProvince && (
        <View style={styles.section}>
          <Text style={styles.label}>Quận/Huyện *</Text>
          <TextInput
            style={styles.input}
            placeholder="Chọn quận/huyện"
            value={selectedDistrict?.name || ''}
            editable={false}
          />
          {districts.length > 0 && (
                       <FlatList
             data={districts}
             keyExtractor={(item) => item.code}
             renderItem={(props) => renderItem({ ...props, type: 'district' })}
             style={styles.list}
           />
          )}
        </View>
      )}

             {/* Ward Selection */}
       {selectedDistrict && (
         <View style={styles.section}>
           <Text style={styles.label}>Phường/Xã *</Text>
           <TextInput
             style={styles.input}
             placeholder="Chọn phường/xã"
             value={selectedWard?.name || ''}
             editable={false}
           />
           {wards.length > 0 ? (
             <FlatList
               data={wards}
               keyExtractor={(item) => item.code}
               renderItem={(props) => renderItem({ ...props, type: 'ward' })}
               style={styles.list}
             />
           ) : (
             <View style={styles.noDataContainer}>
               <Text style={styles.noDataText}>
                 ⚠️ District này không có phường/xã
               </Text>
             </View>
           )}
         </View>
       )}

      {loading && <ActivityIndicator size="small" color="#007AFF" style={styles.loading} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  list: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  loading: {
    marginTop: 16,

  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  noDataContainer: {
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  noDataText: {
    textAlign: 'center',
    color: '#856404',
    fontSize: 14,
  },
});

export default AddressAutocomplete; 