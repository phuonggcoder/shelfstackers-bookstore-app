import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AddressService, { District, Province, Ward } from '../services/addressService';

interface AddressSelectorProps {
  onChange: (address: {
    province: Province | null;
    district: District | null;
    ward: Ward | null;
  }) => void;
  defaultValue?: {
    province: Province | null;
    district: District | null;
    ward: Ward | null;
  };
  disabled?: boolean;
}

const AddressSelector = ({
  onChange,
  defaultValue,
  disabled = false
}: AddressSelectorProps) => {
  // States for data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // States for selection
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(defaultValue?.province || null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(defaultValue?.district || null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(defaultValue?.ward || null);

  // States for search
  const [provinceQuery, setProvinceQuery] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [wardQuery, setWardQuery] = useState('');
  
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false
  });
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load provinces
  const loadProvinces = async (query: string = '') => {
    try {
      setLoading(prev => ({ ...prev, provinces: true }));
      setError(null);
      const data = await AddressService.getProvinces(query);
      setProvinces(data);
    } catch (err) {
      setError('Không thể tải danh sách tỉnh/thành phố');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  // Load districts based on selected province
  const loadDistricts = async (provinceCode: string, query: string = '') => {
    if (!provinceCode) return;
    try {
      setLoading(prev => ({ ...prev, districts: true }));
      setError(null);
      const data = await AddressService.getDistricts(provinceCode, query);
      setDistricts(data);
    } catch (err) {
      setError('Không thể tải danh sách quận/huyện');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  // Load wards based on selected district
  const loadWards = async (districtCode: string, query: string = '') => {
    if (!districtCode) return;
    try {
      setLoading(prev => ({ ...prev, wards: true }));
      setError(null);
      const data = await AddressService.getWards(districtCode, query);
      setWards(data);
    } catch (err) {
      setError('Không thể tải danh sách phường/xã');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  };

  // Debounced search functions
  const debouncedSearchProvinces = debounce(async (query: string) => {
    await loadProvinces(query);
  }, 300);

  const debouncedSearchDistricts = debounce(async (provinceCode: string, query: string) => {
    await loadDistricts(provinceCode, query);
  }, 300);

  const debouncedSearchWards = debounce(async (districtCode: string, query: string) => {
    await loadWards(districtCode, query);
  }, 300);

  // Handle selections
  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    loadDistricts(province.code);
    onChange({
      province,
      district: null,
      ward: null
    });
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    loadWards(district.code);
    onChange({
      province: selectedProvince,
      district,
      ward: null
    });
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    onChange({
      province: selectedProvince,
      district: selectedDistrict,
      ward
    });
  };

  // Render item for lists
  const renderAddressItem = (
    item: Province | District | Ward,
    onSelect: (item: any) => void,
    selected: boolean
  ) => (
    <TouchableOpacity
      style={[styles.item, selected && styles.selectedItem]}
      onPress={() => onSelect(item)}
      disabled={disabled}
    >
      <Text style={[styles.itemText, disabled && styles.disabledText]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {/* Province Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Tỉnh/Thành phố</Text>
        <TextInput
          style={[styles.input, disabled && styles.disabledInput]}
          placeholder="Tìm tỉnh/thành phố..."
          value={provinceQuery}
          onChangeText={(text) => {
            setProvinceQuery(text);
            debouncedSearchProvinces(text);
          }}
          editable={!disabled}
        />
        {loading.provinces && <ActivityIndicator style={styles.loading} />}
        <FlatList
          data={provinces}
          keyExtractor={item => item.code}
          renderItem={({ item }) => renderAddressItem(
            item,
            handleProvinceSelect,
            selectedProvince?.code === item.code
          )}
          style={styles.list}
        />
      </View>

      {/* District Selection */}
      {selectedProvince && (
        <View style={styles.section}>
          <Text style={styles.label}>Quận/Huyện</Text>
          <TextInput
            style={[styles.input, disabled && styles.disabledInput]}
            placeholder="Tìm quận/huyện..."
            value={districtQuery}
            onChangeText={(text) => {
              setDistrictQuery(text);
              debouncedSearchDistricts(selectedProvince.code, text);
            }}
            editable={!disabled}
          />
          {loading.districts && <ActivityIndicator style={styles.loading} />}
          <FlatList
            data={districts}
            keyExtractor={item => item.code}
            renderItem={({ item }) => renderAddressItem(
              item,
              handleDistrictSelect,
              selectedDistrict?.code === item.code
            )}
            style={styles.list}
          />
        </View>
      )}

      {/* Ward Selection */}
      {selectedDistrict && (
        <View style={styles.section}>
          <Text style={styles.label}>Phường/Xã</Text>
          <TextInput
            style={[styles.input, disabled && styles.disabledInput]}
            placeholder="Tìm phường/xã..."
            value={wardQuery}
            onChangeText={(text) => {
              setWardQuery(text);
              debouncedSearchWards(selectedDistrict.code, text);
            }}
            editable={!disabled}
          />
          {loading.wards && <ActivityIndicator style={styles.loading} />}
          <FlatList
            data={wards}
            keyExtractor={item => item.code}
            renderItem={({ item }) => renderAddressItem(
              item,
              handleWardSelect,
              selectedWard?.code === item.code
            )}
            style={styles.list}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  list: {
    maxHeight: 200,
    backgroundColor: '#fff',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  itemText: {
    fontSize: 14,
  },
  disabledText: {
    color: '#999',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  loading: {
    position: 'absolute',
    right: 12,
    top: 40,
  },
});

export default AddressSelector;
