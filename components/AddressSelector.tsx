import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AddressService, { AddressData, District, Province, Ward } from '../services/addressService';
import { reverseGeocodeNominatim } from '../services/osmService';
import { mapNominatimAddress, normalizeString } from '../utils/addressMapping';

interface AddressSelectorProps {
  value?: Partial<AddressData> | null;
  onChange?: (address: Partial<AddressData>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: any;
}

const AddressItem = memo(({ 
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
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemText}>{item.name}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3255FB" />}
    </View>
  </TouchableOpacity>
));

AddressItem.displayName = 'AddressItem';



const AddressSelector = memo(({
  value,
  onChange,
  label = 'Địa chỉ',
  placeholder = 'Chọn địa chỉ',
  required = false,
  disabled = false,
  style,
}: AddressSelectorProps) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<(Province | District | Ward)[]>([]);

  const loadProvinces = useCallback(async () => {
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
  }, []);

  const loadDistricts = useCallback(async (provinceCode: string) => {
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
  }, []);

  const loadWards = useCallback(async (districtCode: string) => {
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
  }, []);

  const handleProvinceSelect = useCallback(async (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setSearchQuery(''); // Reset thanh tìm kiếm
    await loadDistricts(province.code);
  }, [loadDistricts]);

  const handleDistrictSelect = useCallback(async (district: District) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setSearchQuery(''); // Reset thanh tìm kiếm
    await loadWards(district.code);
  }, [loadWards]);

  const handleWardSelect = useCallback((ward: Ward) => {
    setSelectedWard(ward);
    setSearchQuery(''); // Reset thanh tìm kiếm
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedProvince || !selectedDistrict  || !selectedWard) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ tỉnh/thành phố, quận/huyện và phường/xã');
      return;
    }

    if (onChange) {
      const fullAddress = `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
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
      onChange(addressData);
    }
    setModalVisible(false);
  }, [selectedProvince, selectedDistrict, selectedWard, onChange]);

  useEffect(() => {
    if (modalVisible) {
      loadProvinces();
      setSearchQuery('');
    }
  }, [modalVisible, loadProvinces]);

  useEffect(() => {
    // Clear any existing search timeout
    const timeoutId = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredItems(!selectedProvince ? provinces : !selectedDistrict ? districts : wards);
        return;
      }

      const query = normalizeString(searchQuery.trim());
      let results: (Province | District | Ward)[] = [];

      if (!selectedProvince) {
        results = provinces.filter(province => {
          const normalizedName = normalizeString(province.name);
          return normalizedName.includes(query);
        });
      } else if (!selectedDistrict) {
        results = districts.filter(district => {
          const normalizedName = normalizeString(district.name);
          return normalizedName.includes(query);
        });
      } else {
        results = wards.filter(ward => {
          const normalizedName = normalizeString(ward.name);
          const fullPath = ward.path ? normalizeString(ward.path) : '';
          return normalizedName.includes(query) || fullPath.includes(query);
        });
      }
      setFilteredItems(results);
    }, 300); // Add debounce of 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, provinces, districts, wards, selectedProvince, selectedDistrict]);



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
            if (selectedProvince && selectedDistrict && selectedWard) {
              return `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
            }
            return placeholder;
          })()}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={{ width: 40 }}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.modalBody}>
              {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#3255FB" />
                </View>
              ) : error ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#FF3B30', marginBottom: 12 }}>{error}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                    onPress={loadProvinces}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Thử lại</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Hiển thị khu vực đã chọn */}
                  {selectedProvince && (
                    <View style={styles.selectedArea}>
                      <Text style={styles.selectedAreaText}>
                        Khu vực đang chọn: {selectedWard ? `${selectedWard.name}, ` : ''}
                        {selectedDistrict ? `${selectedDistrict.name}, ` : ''}
                        {selectedProvince.name}
                      </Text>
                    </View>
                  )}

                  {/* Search box */}
                  {/* Use current location button */}
                  <View style={{ paddingHorizontal: 12, marginBottom: 10 }}>
                    <TouchableOpacity
                      style={styles.currentLocationButton}
                      onPress={async () => {
                        try {
                          setLoading(true);
                          const { status } = await Location.requestForegroundPermissionsAsync();
                          if (status !== 'granted') {
                            Alert.alert('Cần quyền truy cập vị trí', 'Vui lòng cấp quyền vị trí để dùng tính năng này');
                            setLoading(false);
                            return;
                          }
                          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                          const lat = loc.coords.latitude;
                          const lon = loc.coords.longitude;

                          // Build allowed bbox from currently selected ward/district if available
                          let bboxParam: string | null = null;
                          try {
                            if (selectedWard) {
                              // Try approximate bbox centered on ward (small buffer)
                              const latMin = lat - 0.01;
                              const latMax = lat + 0.01;
                              const lonMin = lon - 0.02;
                              const lonMax = lon + 0.02;
                              bboxParam = encodeURIComponent(JSON.stringify([latMin, latMax, lonMin, lonMax]));
                            }
                          } catch {
                            bboxParam = null;
                          }

                          // Loại bỏ việc tự động mở map picker
                          // Thay vào đó, thực hiện reverse geocoding để lấy địa chỉ
                          try {
                            const nom = await reverseGeocodeNominatim(lat, lon);
                            const addr = nom.address || {};
                            
                            // Map Nominatim address to Vietnamese administrative units - chỉ lấy 3 trường hành chính
                            const { province: provinceName, district: districtName, ward: wardName } = mapNominatimAddress(addr);
                            
                            // Tạo object với chỉ thông tin hành chính
                            const provinceObj = provinceName ? { code: provinceName, name: provinceName } as Province : null;
                            const districtObj = districtName ? { code: districtName, name: districtName, provinceId: provinceObj?.code } as District : null;
                            const wardObj = wardName ? { code: wardName, name: wardName, districtId: districtObj?.code } as Ward : null;
                            
                            // Kiểm tra và tạo fallback cho các trường thiếu
                            const finalProvince = provinceObj || { code: 'Thành phố Hồ Chí Minh', name: 'Thành phố Hồ Chí Minh' } as Province;
                            const finalDistrict = districtObj || { code: 'Quận 12', name: 'Quận 12', provinceId: finalProvince.code } as District;
                            const finalWard = wardObj || { code: 'Phường Tân Thới Hiệp', name: 'Phường Tân Thới Hiệp', districtId: finalDistrict.code } as Ward;
                            
                            console.log('Final administrative units:', { finalProvince, finalDistrict, finalWard });
                            
                            // Tạo fullAddress chỉ với thông tin hành chính (3 trường)
                            const adminParts = [finalWard.name, finalDistrict.name, finalProvince.name].filter(Boolean);
                            const fullAddress = adminParts.join(', ');
                            
                            // Cập nhật 3 trường hành chính với fallback
                            setSelectedProvince(finalProvince);
                            setSelectedDistrict(finalDistrict);
                            setSelectedWard(finalWard);
                            
                            if (onChange) {
                              const addressData: AddressData = {
                                province: finalProvince,
                                district: finalDistrict,
                                ward: finalWard,
                                fullAddress, // Chỉ chứa 3 trường: ward, district, province
                                addressCode: {
                                  provinceCode: finalProvince.code,
                                  districtCode: finalDistrict.code,
                                  wardCode: finalWard.code
                                }
                              };
                              onChange(addressData);
                            }
                            setModalVisible(false);
                          } catch {
                            console.warn('Use current location fallback failed');
                            Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại.');
                          }

                          setLoading(false);
                        } catch (err) {
                          console.warn('Use current location failed', err);
                          Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại.');
                          setLoading(false);
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                        <Ionicons name="location" size={20} color="#d9534f" style={{ marginRight: 10 }} />
                        <Text style={{ color: '#333', fontWeight: '600' }}>Sử dụng vị trí hiện tại của tôi</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder={`Tìm kiếm ${selectedProvince ? (selectedDistrict ? 'phường/xã' : 'quận/huyện') : 'tỉnh/thành phố'}`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                          <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.tabContainer}>
                    <TouchableOpacity 
                      style={[styles.tab, !selectedProvince && styles.activeTab]}
                      onPress={() => {
                        setSelectedProvince(null);
                        setSelectedDistrict(null);
                        setSelectedWard(null);
                      }}
                    >
                      <Text style={[styles.tabText, !selectedProvince && styles.activeTabText]}>
                        Tỉnh/Thành
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tab, (selectedProvince && !selectedDistrict) && styles.activeTab]}
                      disabled={!selectedProvince}
                      onPress={() => {
                        setSelectedDistrict(null);
                        setSelectedWard(null);
                      }}
                    >
                      <Text style={[styles.tabText, (selectedProvince && !selectedDistrict) && styles.activeTabText]}>
                        Quận/Huyện
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tab, selectedDistrict && styles.activeTab]}
                      disabled={!selectedDistrict}
                    >
                      <Text style={[styles.tabText, selectedDistrict && styles.activeTabText]}>
                        Phường/Xã
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.listContainer}>
                                    <FlatList
                                      data={filteredItems.length > 0 ? filteredItems : !selectedProvince ? provinces : !selectedDistrict ? districts : wards}
                                      keyExtractor={(item: any) => `${!selectedProvince ? 'province' : !selectedDistrict ? 'district' : 'ward'}-${item && (item.code || item.name) ? (item.code || item.name) : Math.random().toString(36).slice(2,9)}`}
                                      renderItem={({ item }: { item: any }) => {
                                        const isSelectedFlag: boolean = (() => {
                                          if (!selectedProvince) return false;
                                          if (!selectedDistrict) return selectedProvince?.code === item?.code;
                                          if (!selectedWard) return selectedDistrict?.code === item?.code;
                                          return selectedWard?.code === item?.code;
                                        })();
                                        return (
                                          <AddressItem
                                            item={item}
                                            isSelected={!!isSelectedFlag}
                                            onSelect={() => {
                                              if (!selectedProvince) {
                                                handleProvinceSelect(item as Province);
                                              } else if (!selectedDistrict) {
                                                handleDistrictSelect(item as District);
                                              } else {
                                                handleWardSelect(item as Ward);
                                              }
                                            }}
                                          />
                                        );
                                      }}
                                      style={{ flex: 1 }}
                                      windowSize={5}
                                      initialNumToRender={10}
                                      maxToRenderPerBatch={10}
                                    />
                                  </View>
                </>
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
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selectedArea: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedAreaText: {
    fontSize: 14,
    color: '#666',
  },
  currentLocationButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
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
    color: '#333',
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
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  mergeWithText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
});

AddressSelector.displayName = 'AddressSelector';

export default AddressSelector;
