import { useRouter } from 'expo-router';
import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddressService, { AddressData, Province } from '../services/addressService';
import { useUnifiedModal } from '../context/UnifiedModalContext';

interface District {
  code: string;
  name: string;
  provinceId: string;
  type?: string;
  typeText?: string;
  autocompleteType?: 'oapi';
}

interface Ward {
  code: string;
  name: string;
  districtId: string;
  type?: string;
  typeText?: string;
  autocompleteType?: 'oapi';
}

interface AddressData {
  province: Province;
  district: District;
  ward: Ward;
  fullAddress: string;
  addressCode: {
    provinceCode: string;
    districtCode: string;
    wardCode: string;
  };
}

interface AddressSelectorProps {
  value?: Partial<AddressData> | null;
  onChange?: (address: Partial<AddressData>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
}

interface ListItemProps {
  item: Province | District | Ward;
  type: 'province' | 'district' | 'ward';
  isSelected: boolean;
  onSelect: () => void;
}

const ListItem: React.FC<ListItemProps> = memo(({ item, isSelected, onSelect }) => {
  const displayText = item.typeText 
    ? `${item.typeText} ${item.name}`
    : item.name;

  return (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.selectedItem]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{displayText}</Text>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3255FB" />}
      </View>
    </TouchableOpacity>
  );
});

const AddressItemComponent = memo(({ 
  item, 
  isSelected, 
  onSelect 
}: { 
  item: Province | District | Ward; 
  isSelected: boolean; 
  onSelect: () => void; 
}) => (
  <TouchableOpacity
    style={styles.item}
    onPress={onSelect}
    activeOpacity={0.7}
  >
    <View style={styles.itemContent}>
      <Text style={styles.itemText}>{item.name}</Text>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3255FB" />}
    </View>
  </TouchableOpacity>
));

AddressItemComponent.displayName = 'AddressItemComponent';

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
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'province' | 'district' | 'ward'>('province');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showErrorToast } = useUnifiedModal();

  useEffect(() => {
    if (modalVisible) {
      loadProvinces();
    }
  }, [modalVisible]);

  useEffect(() => {
    let area = 'Khu vực đang chọn: ';
    if (selectedProvince) {
      area += `${selectedProvince.typeText || ''} ${selectedProvince.name}`;
      if (selectedDistrict) {
        area += `, ${selectedDistrict.typeText || ''} ${selectedDistrict.name}`;
        if (selectedWard) {
          area += `, ${selectedWard.typeText || ''} ${selectedWard.name}`;
        }
      }
    } else {
      area += 'Chưa chọn';
    }
    setCurrentArea(area);
  }, [selectedProvince, selectedDistrict, selectedWard]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getProvinces();
      if (response && Array.isArray(response)) {
        setProvinces(response);
      } else {
        setError('Không thể tải danh sách tỉnh/thành phố');
      }
    } catch {
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
      if (response && Array.isArray(response)) {
        setDistricts(response);
      } else {
        setError('Không thể tải danh sách quận/huyện');
      }
    } catch {
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
      if (response && Array.isArray(response)) {
        setWards(response);
      } else {
        setError('Không thể tải danh sách phường/xã');
      }
    } catch {
      setError('Không thể tải danh sách phường/xã');
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = useCallback(async (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setCurrentStep('district');
    await loadDistricts(province.code);
  }, []);

  const handleDistrictSelect = useCallback(async (district: District) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setCurrentStep('ward');
    await loadWards(district.code);
  }, []);

  const handleWardSelect = useCallback((ward: Ward) => {
    setSelectedWard(ward);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ tỉnh/thành phố, quận/huyện và phường/xã');
      return;
    }
    
    if (onChange) {
      // Tạo địa chỉ đầy đủ từ phường, quận và tỉnh đã chọn
      const fullAddress = [
        selectedWard.typeText,
        selectedWard.name,
        selectedDistrict.typeText,
        selectedDistrict.name,
        selectedProvince.typeText,
        selectedProvince.name
      ].filter(Boolean).join(' ');
      
      const addressData: AddressData = {
        province: selectedProvince,
        district: selectedDistrict,
        ward: selectedWard,
        fullAddress,
        addressCode: {
          provinceCode: selectedProvince.code,
          districtCode: selectedDistrict.code,
          wardCode: selectedWard.code
        }
      };
      
      // Cập nhật state và gọi onChange
      onChange(addressData);
    }
    setModalVisible(false);
  }, [selectedProvince, selectedDistrict, selectedWard, onChange]);

  const loadWards = async (provinceCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getWards(provinceCode);
      if (response && Array.isArray(response)) {
        // Lọc bỏ các ward trùng lặp dựa trên code
        const uniqueWards = response.reduce((acc: Ward[], ward) => {
          if (!acc.find(w => w.code === ward.code)) {
            acc.push({
              code: ward.code,
              name: ward.name,
              provinceCode,
              provinceName: selectedProvince?.name || ''
            });
          }
          return acc;
        }, []);
        setWards(uniqueWards);
      } else {
        setError('Không thể tải danh sách phường/xã');
      }
    } catch {
      setError('Không thể tải danh sách phường/xã');
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = useCallback(async (province: Province) => {
    setSelectedProvince(province);
    setSelectedWard(null);
    await loadWards(province.code);
  }, []);

  const handleWardSelect = useCallback((ward: Ward) => {
    setSelectedWard(ward);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedProvince || !selectedWard) {
      showErrorToast('Lỗi', 'Vui lòng chọn đầy đủ tỉnh/thành phố và phường/xã');
      return;
    }
    
    if (onChange) {
      // Tạo địa chỉ đầy đủ từ phường và tỉnh đã chọn
      const fullAddress = `${selectedWard.name}, ${selectedProvince.name}`;
      
      const addressData: AddressData = {
        province: selectedProvince,
        ward: selectedWard,
        fullAddress,
        addressCode: {
          provinceCode: selectedProvince.code,
          wardCode: selectedWard.code
        }
      };
      
      // Cập nhật state và gọi onChange
      onChange(addressData);
    }
    setModalVisible(false);
  };

  const AddressItem = memo(function AddressItem({ 
    item, 
    type,
    isSelected,
    onSelect
  }: { 
    item: Province | Ward; 
    type: 'province' | 'ward';
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.name}</Text>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3255FB" />}
      </View>
    </TouchableOpacity>
  ));

  const renderItem = useCallback(({ item, type }: { item: Province | District | Ward; type: 'province' | 'district' | 'ward' }) => {
    const isSelected = type === 'province' 
      ? selectedProvince?.code === item.code
      : type === 'district'
      ? selectedDistrict?.code === item.code
      : selectedWard?.code === item.code;

    const onSelect = () => {
      if (type === 'province') {
        handleProvinceSelect(item as Province);
      } else if (type === 'district') {
        handleDistrictSelect(item as District);
      } else {
        handleWardSelect(item as Ward);
      }
    };

    const displayText = item.typeText 
      ? `${item.typeText} ${item.name}`
      : item.name;

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{displayText}</Text>
          {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3255FB" />}
        </View>
      </TouchableOpacity>
    );
  }, [selectedProvince?.code, selectedDistrict?.code, selectedWard?.code]);

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
          <Text style={[styles.selectorText, !value?.fullAddress && styles.placeholder]}>
            {(() => {
              if (value?.fullAddress) {
                return value.fullAddress;
              }
              if (selectedProvince && selectedWard) {
                return `${selectedWard.name}, ${selectedProvince.name}`;
              }
              return placeholder;
            })()}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.currentArea}>
              <Text style={styles.currentAreaText}>{currentArea}</Text>
            </View>

            <View style={styles.modalBody}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3255FB" />
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadProvinces}>
                    <Text style={styles.retryText}>Thử lại</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listsContainer}>
                  <View style={styles.tabContainer}>
                    <TouchableOpacity 
                      style={[styles.tab, currentStep === 'province' && styles.activeTab]}
                      onPress={() => {
                        setCurrentStep('province');
                        setSelectedProvince(null);
                        setSelectedDistrict(null);
                        setSelectedWard(null);
                      }}
                    >
                      <Text style={[styles.tabText, currentStep === 'province' && styles.activeTabText]}>Tỉnh/Thành</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tab, currentStep === 'district' && styles.activeTab]}
                      disabled={!selectedProvince}
                      onPress={() => selectedProvince && setCurrentStep('district')}
                    >
                      <Text style={[styles.tabText, currentStep === 'district' && styles.activeTabText]}>Quận/Huyện</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tab, currentStep === 'ward' && styles.activeTab]}
                      disabled={!selectedDistrict}
                      onPress={() => selectedDistrict && setCurrentStep('ward')}
                    >
                      <Text style={[styles.tabText, currentStep === 'ward' && styles.activeTabText]}>Phường/Xã</Text>
                    </TouchableOpacity>
                  </View>

                  {currentStep === 'province' ? (
                    <View style={styles.listContainer}>
                      <FlatList
                        data={provinces}
                        keyExtractor={(item) => `province-${item.code}`}
                        renderItem={(props) => renderItem({ ...props, type: 'province' })}
                        style={styles.list}
                        windowSize={5}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                      />
                    </View>
                  ) : currentStep === 'district' ? (
                    <View style={styles.listContainer}>
                      <FlatList
                        data={districts}
                        keyExtractor={(item) => `district-${item.code}`}
                        renderItem={(props) => renderItem({ ...props, type: 'district' })}
                        style={styles.list}
                        windowSize={5}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                      />
                    </View>
                  ) : (
                    <View style={styles.listContainer}>
                      <FlatList
                        data={wards}
                        keyExtractor={(item) => `ward-${item.code}`}
                        renderItem={(props) => renderItem({ ...props, type: 'ward' })}
                        style={styles.list}
                        windowSize={5}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedProvince || !selectedWard) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={!selectedProvince || !selectedWard}
              >
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
  selectedItem: {
    backgroundColor: '#f0f5ff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3255FB',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#3255FB',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentArea: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentAreaText: {
    fontSize: 14,
    color: '#666',
  },
  modalBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listsContainer: {
    flex: 1,
  },
  section: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  list: {
    flex: 1,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#3255FB',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddressSelector;
