import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View
} from 'react-native';
import AddressApiService, { AddressData, District, Province, Ward } from '../../services/addressApiService';

interface AddressSelectorProps {
  onChange?: (address: AddressData) => void;
  defaultValue?: AddressData;
  disabled?: boolean;
  required?: boolean;
  style?: any;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onChange,
  defaultValue,
  disabled = false,
  required = false,
  style
}) => {
  const { t } = useTranslation();
  
  // States
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(defaultValue?.province || null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(defaultValue?.district || null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(defaultValue?.ward || null);
  
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false
  });

  // API calls
  const api = {
    getProvinces: async (query = '') => {
      try {
        setLoading(prev => ({ ...prev, provinces: true }));
        const data = await AddressApiService.getProvinces(query);
        return data;
      } catch (error) {
        console.error('Error fetching provinces:', error);
        Alert.alert(t('error'), 'Không thể tải danh sách tỉnh/thành phố');
        return [];
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }));
      }
    },

    getDistricts: async (provinceCode: string, query = '') => {
      try {
        setLoading(prev => ({ ...prev, districts: true }));
        const data = await AddressApiService.getDistricts(provinceCode, query);
        return data;
      } catch (error) {
        console.error('Error fetching districts:', error);
        Alert.alert(t('error'), 'Không thể tải danh sách quận/huyện');
        return [];
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    },

    getWards: async (districtId: string, query = '') => {
      try {
        setLoading(prev => ({ ...prev, wards: true }));
        const data = await AddressApiService.getWards(districtId, query);
        return data;
      } catch (error) {
        console.error('Error fetching wards:', error);
        Alert.alert(t('error'), 'Không thể tải danh sách phường/xã');
        return [];
      } finally {
        setLoading(prev => ({ ...prev, wards: false }));
      }
    }
  };

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      const data = await api.getProvinces();
      setProvinces(data);
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedProvince) {
        const data = await api.getDistricts(selectedProvince.code);
        setDistricts(data);
      } else {
        setDistricts([]);
      }
      setSelectedDistrict(null);
      setSelectedWard(null);
    };
    loadDistricts();
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (selectedDistrict) {
        const data = await api.getWards(selectedDistrict.code);
        setWards(data);
      } else {
        setWards([]);
      }
      setSelectedWard(null);
    };
    loadWards();
  }, [selectedDistrict]);

  // Notify parent component of changes
  useEffect(() => {
    onChange?.({
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard
    });
  }, [selectedProvince, selectedDistrict, selectedWard]);

  const getOptionLabel = (item: Province | District | Ward) => {
    if (!item) return '';
    return `${item.typeText} ${item.name}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Province Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          {t('address.province')} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={[styles.pickerWrapper, disabled && styles.disabled]}>
          {loading.provinces ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedProvince?.code}
              onValueChange={(itemValue) => {
                const province = provinces.find(p => p.code === itemValue) || null;
                setSelectedProvince(province);
              }}
              enabled={!disabled}
              style={styles.picker}
            >
              <Picker.Item label={t('address.selectProvince')} value="" />
              {provinces.map((province) => (
                <Picker.Item
                  key={province.code}
                  label={getOptionLabel(province)}
                  value={province.code}
                />
              ))}
            </Picker>
          )}
        </View>
      </View>

      {/* District Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          {t('address.district')} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={[styles.pickerWrapper, (!selectedProvince || disabled) && styles.disabled]}>
          {loading.districts ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedDistrict?.code}
              onValueChange={(itemValue) => {
                const district = districts.find(d => d.code === itemValue) || null;
                setSelectedDistrict(district);
              }}
              enabled={!!selectedProvince && !disabled}
              style={styles.picker}
            >
              <Picker.Item label={t('address.selectDistrict')} value="" />
              {districts.map((district) => (
                <Picker.Item
                  key={district.code}
                  label={getOptionLabel(district)}
                  value={district.code}
                />
              ))}
            </Picker>
          )}
        </View>
      </View>

      {/* Ward Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          {t('address.ward')} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={[styles.pickerWrapper, (!selectedDistrict || disabled) && styles.disabled]}>
          {loading.wards ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Picker
              selectedValue={selectedWard?.code}
              onValueChange={(itemValue) => {
                const ward = wards.find(w => w.code === itemValue) || null;
                setSelectedWard(ward);
              }}
              enabled={!!selectedDistrict && !disabled}
              style={styles.picker}
            >
              <Picker.Item label={t('address.selectWard')} value="" />
              {wards.map((ward) => (
                <Picker.Item
                  key={ward.code}
                  label={getOptionLabel(ward)}
                  value={ward.code}
                />
              ))}
            </Picker>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default AddressSelector;
