import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddressSelector from '../components/AddressSelector';

import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import AddressService, { AddressData } from '../services/addressService';

const EditAddressScreen = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showErrorToast } = useUnifiedModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State cơ bản
  const [addressType, setAddressType] = useState<'office' | 'home'>('office');
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [addressManuallySelected, setAddressManuallySelected] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('[EditAddress] Component mounted with id:', id);
  }, [id]);

  // Debug useEffect để theo dõi selectedAddress
  useEffect(() => {
    console.log('[EditAddress] selectedAddress changed:', {
      hasSelectedAddress: !!selectedAddress,
      fullAddress: selectedAddress?.fullAddress,
      province: selectedAddress?.province?.name,
      district: selectedAddress?.district?.name,
      ward: selectedAddress?.ward?.name,
      addressManuallySelected
    });
  }, [selectedAddress, addressManuallySelected]);

  const fetchAddress = useCallback(async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const addresses = await AddressService.getAddresses(token);
      const addressToEdit = addresses.find(addr => addr._id === id);
      
      if (addressToEdit) {
        console.log('[EditAddress] Fetched address to edit:', addressToEdit);
        
        // Cập nhật form data
        setReceiverName(addressToEdit.fullName || '');
        setPhoneNumber(addressToEdit.phone || '');
        setAddressDetail(addressToEdit.street || '');
        setAddressType(addressToEdit.type || 'office');
        
        // Chuẩn bị selectedAddress từ dữ liệu đã lưu
        const addressData: AddressData = {
          fullName: addressToEdit.fullName || '',
          phone: addressToEdit.phone || '',
          street: addressToEdit.street || '',
          province: addressToEdit.province ? {
            code: addressToEdit.province.code || addressToEdit.province.name,
            name: addressToEdit.province.name
          } : undefined,
          district: addressToEdit.district ? {
            code: addressToEdit.district.code || addressToEdit.district.name,
            name: addressToEdit.district.name,
            provinceId: addressToEdit.district.provinceId
          } : undefined,
          ward: addressToEdit.ward ? {
            code: addressToEdit.ward.code || addressToEdit.ward.name,
            name: addressToEdit.ward.name,
            districtId: addressToEdit.ward.districtId,
            fullName: addressToEdit.ward.fullName
          } : undefined,
          location: addressToEdit.location,
          osm: addressToEdit.osm,
          fullAddress: addressToEdit.fullAddress,
          adminType: 'new',
          isDefault: addressToEdit.isDefault || false,
          note: addressToEdit.note || '',
          isDraft: false
        };
        
        setSelectedAddress(addressData);
        setAddressManuallySelected(true);
        
        console.log('[EditAddress] Processed address data:', addressData);
      } else {
        showErrorToast('Lỗi', 'Không tìm thấy địa chỉ');
        router.back();
      }
    } catch (error) {
      console.error('[EditAddress] Error fetching address:', error);
      showErrorToast('Lỗi', 'Không thể tải thông tin địa chỉ');
    } finally {
      setLoading(false);
    }
  }, [id, token, router, showErrorToast]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  // Function lấy vị trí hiện tại
  const getCurrentLocation = async (): Promise<{ lat: number; lng: number; displayName: string } | null> => {
    try {
      // Kiểm tra quyền truy cập vị trí
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập vị trí để lấy tọa độ hiện tại');
        return null;
      }

      // Lấy vị trí hiện tại
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const { latitude, longitude } = location.coords;
      console.log('[EditAddress] Current location:', { lat: latitude, lng: longitude });

      // Reverse geocoding để lấy địa chỉ với timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'ShelfStackers-App/1.0'
            }
          }
        );
        clearTimeout(timeoutId);
        
        // Kiểm tra response status
        if (!response.ok) {
          console.error('[EditAddress] Reverse geocoding failed:', response.status, response.statusText);
          return {
            lat: latitude,
            lng: longitude,
            displayName: 'Vị trí hiện tại'
          };
        }
        
        // Kiểm tra content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[EditAddress] Reverse geocoding returned non-JSON:', contentType);
          return {
            lat: latitude,
            lng: longitude,
            displayName: 'Vị trí hiện tại'
          };
        }
        
        const data = await response.json();
        console.log('[EditAddress] Reverse geocoding result:', data);

        return {
          lat: latitude,
          lng: longitude,
          displayName: data.display_name || 'Vị trí hiện tại'
        };
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('[EditAddress] Fetch error:', fetchError);
        return {
          lat: latitude,
          lng: longitude,
          displayName: 'Vị trí hiện tại'
        };
      }
    } catch (error) {
      console.error('[EditAddress] Error getting current location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
      return null;
    }
  };

  // Function lưu địa chỉ không có vị trí
  const saveAddressWithoutLocation = async () => {
    try {
      setSaving(true);
      
      if (!selectedAddress) {
        Alert.alert('Lỗi', 'Không có dữ liệu địa chỉ');
        return;
      }
      
      // Chuẩn bị dữ liệu địa chỉ theo format BE yêu cầu
      const addressData: any = {
        // Thông tin người nhận (bắt buộc)
        fullName: receiverName.trim(),
        phone: phoneNumber.trim(),
        
        // Thông tin địa chỉ (bắt buộc)
        street: addressDetail.trim(),
        
        // Thông tin hành chính (ít nhất 1 trong 2: ward HOẶC province)
        province: selectedAddress.province ? {
          code: selectedAddress.province.code,
          name: selectedAddress.province.name
        } : undefined,
        district: selectedAddress.district ? {
          code: selectedAddress.district.code,
          name: selectedAddress.district.name,
          provinceId: selectedAddress.district.provinceId
        } : undefined,
        ward: selectedAddress.ward ? {
          code: selectedAddress.ward.code,
          name: selectedAddress.ward.name,
          districtId: selectedAddress.ward.districtId,
          fullName: selectedAddress.ward.fullName
        } : undefined,
        
        // Thông tin khác
        adminType: 'new',
        isDefault: selectedAddress.isDefault || false,
        note: selectedAddress.note || '',
        isDraft: false,
        type: addressType
      };

      // Chỉ thêm location nếu có coordinates hợp lệ
      if (selectedAddress.location && 
          selectedAddress.location.coordinates && 
          Array.isArray(selectedAddress.location.coordinates) &&
          selectedAddress.location.coordinates.length === 2 &&
          !Number.isNaN(selectedAddress.location.coordinates[0]) &&
          !Number.isNaN(selectedAddress.location.coordinates[1]) &&
          selectedAddress.location.coordinates[0] !== 0 &&
          selectedAddress.location.coordinates[1] !== 0) {
        addressData.location = {
          type: 'Point',
          coordinates: [
            selectedAddress.location.coordinates[0], // longitude
            selectedAddress.location.coordinates[1]  // latitude
          ]
        };
      }

      // Chỉ thêm OSM nếu có dữ liệu hợp lệ
      if (selectedAddress.osm && 
          selectedAddress.osm.lat && 
          selectedAddress.osm.lng &&
          !Number.isNaN(selectedAddress.osm.lat) &&
          !Number.isNaN(selectedAddress.osm.lng)) {
        addressData.osm = {
          lat: selectedAddress.osm.lat,
          lng: selectedAddress.osm.lng,
          displayName: selectedAddress.osm.displayName,
          raw: selectedAddress.osm.raw
        };
      }

      console.log('[EditAddress] Updating address without location:', addressData);

      // Gọi API cập nhật địa chỉ
      await AddressService.updateAddress(token!, id as string, addressData);
      
      console.log('[EditAddress] Address updated successfully');
      
      Alert.alert('Thành công', 'Đã cập nhật địa chỉ thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('[EditAddress] Error updating address:', error);
      showErrorToast('Lỗi khi cập nhật địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  // Function lưu địa chỉ với vị trí hiện tại
  const saveAddressWithLocation = async (currentLocation: { lat: number; lng: number; displayName: string }) => {
    try {
      setSaving(true);
      
      if (!selectedAddress) {
        Alert.alert('Lỗi', 'Không có dữ liệu địa chỉ');
        return;
      }
      
      // Chuẩn bị dữ liệu địa chỉ theo format BE yêu cầu
      const addressData: any = {
        // Thông tin người nhận (bắt buộc)
        fullName: receiverName.trim(),
        phone: phoneNumber.trim(),
        
        // Thông tin địa chỉ (bắt buộc)
        street: addressDetail.trim(),
        
        // Thông tin hành chính (ít nhất 1 trong 2: ward HOẶC province)
        province: selectedAddress.province ? {
          code: selectedAddress.province.code,
          name: selectedAddress.province.name
        } : undefined,
        district: selectedAddress.district ? {
          code: selectedAddress.district.code,
          name: selectedAddress.district.name,
          provinceId: selectedAddress.district.provinceId
        } : undefined,
        ward: selectedAddress.ward ? {
          code: selectedAddress.ward.code,
          name: selectedAddress.ward.name,
          districtId: selectedAddress.ward.districtId,
          fullName: selectedAddress.ward.fullName
        } : undefined,
        
        // Thông tin khác
        adminType: 'new',
        isDefault: selectedAddress.isDefault || false,
        note: selectedAddress.note || '',
        isDraft: false,
        type: addressType
      };

      // Thêm vị trí hiện tại
      addressData.location = {
        type: 'Point',
        coordinates: [currentLocation.lng, currentLocation.lat] // [longitude, latitude]
      };

      addressData.osm = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        displayName: currentLocation.displayName,
        raw: { display_name: currentLocation.displayName }
      };

      console.log('[EditAddress] Updating address with current location:', addressData);

      // Gọi API cập nhật địa chỉ
      await AddressService.updateAddress(token!, id as string, addressData);
      
      console.log('[EditAddress] Address updated successfully with location');
      
      Alert.alert('Thành công', 'Đã cập nhật địa chỉ với vị trí hiện tại thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('[EditAddress] Error updating address with location:', error);
      showErrorToast('Lỗi khi cập nhật địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  // Function xử lý lưu địa chỉ
  const handleSaveAddress = async () => {
    // Validation
    if (!receiverName.trim()) {
      showErrorToast('Lỗi', 'Vui lòng nhập tên người nhận');
      return;
    }

    if (!phoneNumber.trim()) {
      showErrorToast('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    if (!addressDetail.trim()) {
      showErrorToast('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    if (!selectedAddress || !addressManuallySelected) {
      showErrorToast('Lỗi', 'Vui lòng chọn địa chỉ hành chính');
      return;
    }

    // Hiển thị dialog xác nhận lấy vị trí
    Alert.alert(
      'Xác nhận vị trí',
      'Bạn có muốn lấy vị trí hiện tại để cập nhật vào địa chỉ không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
            saveAddressWithoutLocation();
          }
        },
        {
          text: 'Lấy vị trí',
          onPress: async () => {
            const currentLocation = await getCurrentLocation();
            if (currentLocation) {
              saveAddressWithLocation(currentLocation);
            } else {
              saveAddressWithoutLocation();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3255FB" />
        <Text style={styles.loadingText}>Đang tải thông tin địa chỉ...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa địa chỉ</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Thông tin liên hệ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên người nhận *</Text>
              <TextInput
                style={styles.input}
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder="Nhập tên người nhận"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại *</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Địa chỉ hành chính */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ hành chính</Text>
            
            <AddressSelector
              onChange={(addressData) => {
                console.log('[EditAddress] Address selected from AddressSelector:', addressData);
                setSelectedAddress(addressData);
                setAddressManuallySelected(true);
              }}
              defaultValue={selectedAddress}
            />
          </View>

          {/* Địa chỉ chi tiết */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Địa chỉ chi tiết</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa chỉ chi tiết *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={addressDetail}
                onChangeText={setAddressDetail}
                placeholder="Nhập số nhà, tên đường, phường/xã..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Cài đặt */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loại địa chỉ</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, addressType === 'home' && styles.typeButtonActive]}
                  onPress={() => setAddressType('home')}
                >
                  <Text style={[styles.typeText, addressType === 'home' && styles.typeTextActive]}>
                    Nhà
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, addressType === 'office' && styles.typeButtonActive]}
                  onPress={() => setAddressType('office')}
                >
                  <Text style={[styles.typeText, addressType === 'office' && styles.typeTextActive]}>
                    Văn phòng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.defaultToggle}
              onPress={() => setSelectedAddress(prev => prev ? { ...prev, isDefault: !prev.isDefault } : null)}
            >
              <Ionicons
                name={selectedAddress?.isDefault ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedAddress?.isDefault ? '#3255FB' : '#666'}
              />
              <Text style={styles.defaultText}>Đặt làm địa chỉ mặc định</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveAddress}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Cập nhật địa chỉ</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  defaultText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3255FB',
    borderColor: '#3255FB',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditAddressScreen;
