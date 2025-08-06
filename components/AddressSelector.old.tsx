import { useRouter } from 'expo-router';
import React, { useEffect, useState, memo, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import AddressService, { AddressData, Province } from '../services/addressService';

interface Ward {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
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

const AddressItemComponent = memo(({ 
  item, 
  isSelected, 
  onSelect 
}: { 
  item: Province | Ward; 
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
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modalVisible) {
      loadProvinces();
    }
  }, [modalVisible]);

  useEffect(() => {
    let area = 'Khu vực đang chọn: ';
    if (selectedProvince) {
      area += selectedProvince.name;
      if (selectedWard) {
        area += ', ' + selectedWard.name;
      }
    } else {
      area += 'Chưa chọn';
    }
    setCurrentArea(area);
  }, [selectedProvince, selectedWard]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getProvinces();
      if (response && Array.isArray(response)) {
        setProvinces(response.map(p => ({ code: p.code, name: p.name })));
      } else {
        setError('Không thể tải danh sách tỉnh/thành phố');
      }
    } catch {
      setError('Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ tỉnh/thành phố và phường/xã');
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

  const renderItem = useCallback(({ item, type }: { item: Province | Ward; type: 'province' | 'ward' }) => {
    const isSelected = type === 'province' 
      ? selectedProvince?.code === item.code
      : selectedWard?.code === item.code;

    const onSelect = () => {
      if (type === 'province') {
        handleProvinceSelect(item as Province);
      } else {
        handleWardSelect(item as Ward);
      }
    };

    return (
      <AddressItem
        item={item}
        type={type}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    );
  }, [selectedProvince?.code, selectedWard?.code]);

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
                      style={[styles.tab, !selectedProvince && styles.activeTab]}
                      onPress={() => selectedProvince && setSelectedProvince(null)}
                    >
                      <Text style={[styles.tabText, !selectedProvince && styles.activeTabText]}>Tỉnh/Thành</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tab, selectedProvince && styles.activeTab]}
                      disabled={!selectedProvince}
                    >
                      <Text style={[styles.tabText, selectedProvince && styles.activeTabText]}>Phường/Xã</Text>
                    </TouchableOpacity>
                  </View>

                  {!selectedProvince ? (
                    <View style={styles.listContainer}>
                      <FlatList
                        data={provinces}
                        keyExtractor={(item) => `province-${item.code}-${Date.now()}`}
                        renderItem={(props) => renderItem({ ...props, type: 'province' })}
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
                        keyExtractor={(item) => `ward-${selectedProvince?.code}-${item.code}-${Date.now()}`}
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