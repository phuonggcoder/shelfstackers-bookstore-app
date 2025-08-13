import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AddressService from '../services/addressService';

interface Province {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
}

interface Ward {
  code: string;
  name: string;
}

interface AddressSelectorProps {
  onChange?: (address: {
    province: Province;
    district: District;
    ward: Ward;
  }) => void;
  defaultValue?: {
    province: Province;
    district: District;
    ward: Ward;
  };
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

const { width } = Dimensions.get('window');

const AddressSelectorV2 = ({
  onChange,
  defaultValue,
  disabled = false,
  required = false,
  error,
}: AddressSelectorProps) => {
  // States for data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // States for selection
  const [selectedProvince, setSelectedProvince] = useState(defaultValue?.province || null);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultValue?.district || null);
  const [selectedWard, setSelectedWard] = useState(defaultValue?.ward || null);

  // UI states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeLevel, setActiveLevel] = useState<'province' | 'district' | 'ward'>('province');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false
  });

  // Data loading functions
  const loadProvinces = useCallback(async (query = '') => {
    try {
      setLoading(prev => ({ ...prev, provinces: true }));
      const data = await AddressService.getProvinces(query);
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  }, []);

  const loadDistricts = useCallback(async (provinceCode: string, query = '') => {
    try {
      setLoading(prev => ({ ...prev, districts: true }));
      const data = await AddressService.getDistricts(provinceCode, query);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  }, []);

  const loadWards = useCallback(async (districtCode: string, query = '') => {
    try {
      setLoading(prev => ({ ...prev, wards: true }));
      const data = await AddressService.getWards(districtCode, query);
      setWards(data);
    } catch (error) {
      console.error('Error loading wards:', error);
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (isModalVisible && activeLevel === 'province') {
      loadProvinces();
    }
  }, [isModalVisible, activeLevel, loadProvinces]);

  // Load dependent data
  useEffect(() => {
    if (selectedProvince && activeLevel === 'district') {
      loadDistricts(selectedProvince.code);
    }
  }, [selectedProvince, activeLevel, loadDistricts]);

  useEffect(() => {
    if (selectedDistrict && activeLevel === 'ward') {
      loadWards(selectedDistrict.code);
    }
  }, [selectedDistrict, activeLevel, loadWards]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    switch (activeLevel) {
      case 'province':
        loadProvinces(query);
        break;
      case 'district':
        if (selectedProvince) {
          loadDistricts(selectedProvince.code, query);
        }
        break;
      case 'ward':
        if (selectedDistrict) {
          loadWards(selectedDistrict.code, query);
        }
        break;
    }
  }, [activeLevel, selectedProvince, selectedDistrict, loadProvinces, loadDistricts, loadWards]);

  // Handle selections
  const handleSelect = useCallback((item: Province | District | Ward) => {
    switch (activeLevel) {
      case 'province':
        setSelectedProvince(item);
        setSelectedDistrict(null);
        setSelectedWard(null);
        setActiveLevel('district');
        break;
      case 'district':
        setSelectedDistrict(item);
        setSelectedWard(null);
        setActiveLevel('ward');
        break;
      case 'ward':
        setSelectedWard(item);
        setIsModalVisible(false);
        if (selectedProvince && selectedDistrict) {
          onChange?.({
            province: selectedProvince,
            district: selectedDistrict,
            ward: item
          });
        }
        break;
    }
    setSearchQuery('');
  }, [activeLevel, selectedProvince, selectedDistrict, onChange]);

  const handleBack = useCallback(() => {
    switch (activeLevel) {
      case 'ward':
        setActiveLevel('district');
        setSelectedWard(null);
        break;
      case 'district':
        setActiveLevel('province');
        setSelectedDistrict(null);
        break;
      case 'province':
        setIsModalVisible(false);
        break;
    }
    setSearchQuery('');
  }, [activeLevel]);

  const getDisplayText = useCallback(() => {
    if (selectedWard) {
      return `${selectedWard.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`;
    } else if (selectedDistrict) {
      return `${selectedDistrict.name}, ${selectedProvince?.name}`;
    } else if (selectedProvince) {
      return selectedProvince.name;
    }
    return 'Chọn địa chỉ';
  }, [selectedProvince, selectedDistrict, selectedWard]);

  const getCurrentData = useCallback(() => {
    switch (activeLevel) {
      case 'province':
        return provinces;
      case 'district':
        return districts;
      case 'ward':
        return wards;
      default:
        return [];
    }
  }, [activeLevel, provinces, districts, wards]);

  const isLoading = loading.provinces || loading.districts || loading.wards;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.input,
          error ? styles.inputError : {},
          disabled ? styles.inputDisabled : {}
        ]}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.inputText,
            !selectedProvince && styles.placeholder,
            disabled && styles.textDisabled
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        {required && <Text style={styles.required}>*</Text>}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>
                {activeLevel === 'province' ? 'Chọn Tỉnh/Thành phố' :
                 activeLevel === 'district' ? 'Chọn Quận/Huyện' :
                 'Chọn Phường/Xã'}
              </Text>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Tìm kiếm ${
                    activeLevel === 'province' ? 'tỉnh/thành phố' :
                    activeLevel === 'district' ? 'quận/huyện' :
                    'phường/xã'
                  }`}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3255FB" />
              </View>
            ) : (
              <FlatList
                data={getCurrentData()}
                keyExtractor={item => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      ((activeLevel === 'province' && selectedProvince?.code === item.code) ||
                       (activeLevel === 'district' && selectedDistrict?.code === item.code) ||
                       (activeLevel === 'ward' && selectedWard?.code === item.code)) &&
                      styles.selectedItem
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.itemText}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    color: '#999',
  },
  textDisabled: {
    color: '#999',
  },
  required: {
    color: '#ff3b30',
    marginLeft: 4,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
});

export default AddressSelectorV2;
