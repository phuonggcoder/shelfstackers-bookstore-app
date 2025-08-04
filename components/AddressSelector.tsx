import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AddressService, { AddressData, District, Province, Ward } from '../services/addressService';

interface AddressSelectorProps {
  value?: AddressData | null;
  onChange?: (address: AddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  value,
  onChange,
  label = 'Địa chỉ',
  placeholder = 'Chọn địa chỉ',
  required = false,
  disabled = false,
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(value?.province || null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(value?.district || null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(value?.ward || null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modalVisible) {
      loadProvinces();
    }
  }, [modalVisible]);

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

  const loadWards = async (districtCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getWards(districtCode);
      
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
    loadWards(district.code);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    
    if (onChange && selectedProvince && selectedDistrict) {
      const addressData: AddressData = {
        province: selectedProvince,
        district: selectedDistrict,
        ward: ward,
        fullAddress: `${ward.name}, ${selectedDistrict.name}, ${selectedProvince.name}`,
        addressCode: {
          provinceCode: selectedProvince.code,
          districtCode: selectedDistrict.code,
          wardCode: ward.code
        }
      };
      
      onChange(addressData);
      setModalVisible(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ tỉnh/thành phố, quận/huyện và phường/xã');
      return;
    }
    
    if (onChange) {
      const addressData: AddressData = {
        province: selectedProvince,
        district: selectedDistrict,
        ward: selectedWard,
        fullAddress: `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`,
        addressCode: {
          provinceCode: selectedProvince.code,
          districtCode: selectedDistrict.code,
          wardCode: selectedWard.code
        }
      };
      
      onChange(addressData);
      setModalVisible(false);
    }
  };

  const handleCancel = () => {
    setSelectedProvince(value?.province || null);
    setSelectedDistrict(value?.district || null);
    setSelectedWard(value?.ward || null);
    setModalVisible(false);
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

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value ? value.fullAddress : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.modalBody}>
              {/* Province Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Tỉnh/Thành phố *</Text>
                <Text style={styles.selectedText}>
                  {selectedProvince?.name || 'Chưa chọn'}
                </Text>
                {provinces.length > 0 && (
                  <FlatList
                    data={provinces}
                    keyExtractor={(item) => item.code}
                    renderItem={(props) => renderItem({ ...props, type: 'province' })}
                    style={styles.list}
                    nestedScrollEnabled={true}
                  />
                )}
              </View>

              {/* District Selection */}
              {selectedProvince && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Quận/Huyện *</Text>
                  <Text style={styles.selectedText}>
                    {selectedDistrict?.name || 'Chưa chọn'}
                  </Text>
                  {districts.length > 0 && (
                    <FlatList
                      data={districts}
                      keyExtractor={(item) => item.code}
                      renderItem={(props) => renderItem({ ...props, type: 'district' })}
                      style={styles.list}
                      nestedScrollEnabled={true}
                    />
                  )}
                </View>
              )}

              {/* Ward Selection */}
              {selectedDistrict && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Phường/Xã *</Text>
                  <Text style={styles.selectedText}>
                    {selectedWard?.name || 'Chưa chọn'}
                  </Text>
                  {wards.length > 0 && (
                    <FlatList
                      data={wards}
                      keyExtractor={(item) => item.code}
                      renderItem={(props) => renderItem({ ...props, type: 'ward' })}
                      style={styles.list}
                      nestedScrollEnabled={true}
                    />
                  )}
                </View>
              )}

              {loading && <ActivityIndicator size="small" color="#007AFF" style={styles.loading} />}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#FF3B30',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholder: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalBody: {
    padding: 16,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  selectedText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  list: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
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
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AddressSelector; 