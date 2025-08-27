import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AddressSelector from '../components/AddressSelector';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import AddressService, { AddressData } from '../services/addressService';

const AddAddress = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { showErrorToast } = useUnifiedModal();
  const params = useLocalSearchParams();
  
  // State cơ bản
  const [loading, setLoading] = useState(false);
  const [addressType, setAddressType] = useState<'office' | 'home'>('office');
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [addressManuallySelected, setAddressManuallySelected] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('[AddAddress] Component mounted with params:', params);
  }, []);

  // Xử lý dữ liệu từ address-detail (luồng mới)
  useEffect(() => {
    if (params.address) {
      try {
        const addressData = JSON.parse(decodeURIComponent(params.address as string));
        console.log('[AddAddress] Received address data from address-detail:', addressData);
        
        // Cập nhật các trường từ dữ liệu nhận được
        if (addressData.street) {
          setAddressDetail(addressData.street);
        }
        
        if (addressData.fullName) {
          setReceiverName(addressData.fullName);
        }
        
        if (addressData.phone) {
          setPhoneNumber(addressData.phone);
        }
        
        // Lưu dữ liệu địa chỉ đã chuẩn bị
        setSelectedAddress(addressData);
        setAddressManuallySelected(true);
        
        console.log('[AddAddress] Successfully processed address data');
        
      } catch (error) {
        console.error('[AddAddress] Error parsing address data:', error);
      }
    }
  }, [params.address]);

  // Debug useEffect để theo dõi selectedAddress
  useEffect(() => {
    console.log('[AddAddress] selectedAddress changed:', {
      hasSelectedAddress: !!selectedAddress,
      fullAddress: selectedAddress?.fullAddress,
      province: selectedAddress?.province?.name,
      district: selectedAddress?.district?.name,
      ward: selectedAddress?.ward?.name,
      addressManuallySelected
    });
  }, [selectedAddress, addressManuallySelected]);

  // Xử lý dữ liệu từ luồng cũ (backward compatibility)
  useEffect(() => {
    const latParam = params.lat as string | undefined;
    const lngParam = params.lng as string | undefined;
    const osmParam = params.osm as string | undefined;
    const wardParam = params.ward as string | undefined;
    const districtParam = params.district as string | undefined;
    const provinceParam = params.province as string | undefined;

    // Nếu đã có dữ liệu từ luồng mới, không xử lý luồng cũ
    if (params.address) {
      console.log('[AddAddress] Skipping old flow - new flow data present');
      return;
    }

    // Xử lý ward, district, province từ params (luồng cũ)
    if (wardParam && districtParam && provinceParam) {
      const wardObj = { code: wardParam, name: wardParam, districtId: districtParam } as any;
      const districtObj = { code: districtParam, name: districtParam, provinceId: provinceParam } as any;
      const provinceObj = { code: provinceParam, name: provinceParam } as any;
      
      console.log('[AddAddress] Setting ward/district/province from old flow params:', { wardParam, districtParam, provinceParam });
      
      setSelectedAddress(prev => ({
        ...prev,
        province: provinceObj,
        district: districtObj,
        ward: wardObj,
        fullAddress: `${wardParam}, ${districtParam}, ${provinceParam}`,
      } as any));
      setAddressManuallySelected(true);
    }

    // Xử lý coordinates từ params (luồng cũ)
    if (latParam && lngParam) {
      const lat = Number(latParam);
      const lng = Number(lngParam);
      
      console.log('[AddAddress] Setting coordinates from old flow params:', { lat, lng });
      
      setSelectedAddress(prev => ({
        ...prev,
        location: {
          type: { type: 'Point' },
          coordinates: [lng, lat]
        },
        osm: {
          lat,
          lng,
          displayName: `Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          raw: {}
        }
      } as any));
    }

    // Xử lý OSM data từ params (luồng cũ)
    if (osmParam) {
      try {
        const decoded = decodeURIComponent(osmParam);
        const payload = JSON.parse(decoded);
        
        console.log('[AddAddress] Setting OSM data from old flow params:', payload);
        
        if (payload.lat && payload.lng) {
          setSelectedAddress(prev => ({
            ...prev,
            location: {
              type: { type: 'Point' },
              coordinates: [payload.lng, payload.lat]
            },
            osm: {
              lat: payload.lat,
              lng: payload.lng,
              displayName: payload.display_name || `Vị trí (${payload.lat.toFixed(6)}, ${payload.lng.toFixed(6)})`,
              raw: payload
            }
          } as any));
        }
      } catch (error) {
        console.error('[AddAddress] Error parsing OSM param:', error);
      }
    }
  }, [params.lat, params.lng, params.osm, params.ward, params.district, params.province, params.address]);

  // Xử lý chọn địa chỉ từ AddressSelector
  const handleAddressSelect = (address: Partial<AddressData>) => {
    console.log('[AddAddress] Address selected from AddressSelector:', address);
    setSelectedAddress(address as AddressData);
    setAddressManuallySelected(true);
  };

  // Function để lấy vị trí hiện tại
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
      console.log('[AddAddress] Current location:', { lat: latitude, lng: longitude });

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
        console.error('[AddAddress] Reverse geocoding failed:', response.status, response.statusText);
        return {
          lat: latitude,
          lng: longitude,
          displayName: 'Vị trí hiện tại'
        };
      }
      
      // Kiểm tra content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[AddAddress] Reverse geocoding returned non-JSON:', contentType);
        return {
          lat: latitude,
          lng: longitude,
          displayName: 'Vị trí hiện tại'
        };
      }
      
      const data = await response.json();
      console.log('[AddAddress] Reverse geocoding result:', data);

      return {
        lat: latitude,
        lng: longitude,
        displayName: data.display_name || 'Vị trí hiện tại'
      };
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[AddAddress] Fetch error:', fetchError);
      return {
        lat: latitude,
        lng: longitude,
        displayName: 'Vị trí hiện tại'
      };
    }
    } catch (error) {
      console.error('[AddAddress] Error getting current location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
      return null;
    }
  };

  // Xử lý lưu địa chỉ
  const handleSaveAddress = async () => {
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ');
      return;
    }

    if (!receiverName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người nhận');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    if (!addressDetail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
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
            // Lưu địa chỉ không có vị trí
            saveAddressWithoutLocation();
          }
        },
        {
          text: 'Lấy vị trí',
          onPress: async () => {
            // Lấy vị trí hiện tại và lưu địa chỉ
            const currentLocation = await getCurrentLocation();
            if (currentLocation) {
              saveAddressWithLocation(currentLocation);
            } else {
              // Nếu không lấy được vị trí, lưu không có vị trí
              saveAddressWithoutLocation();
            }
          }
        }
      ]
    );
  };

  // Function lưu địa chỉ không có vị trí
  const saveAddressWithoutLocation = async () => {
    try {
      setLoading(true);
      
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
        isDefault: false,
        note: '',
        isDraft: false
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

      console.log('[AddAddress] Saving address without location:', addressData);

      // Gọi API lưu địa chỉ
      const result = await AddressService.addAddress(token!, addressData);
      
      console.log('[AddAddress] Address saved successfully:', result);
      
      Alert.alert('Thành công', 'Đã lưu địa chỉ thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('[AddAddress] Error saving address:', error);
      showErrorToast('Lỗi khi lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  // Function lưu địa chỉ với vị trí hiện tại
  const saveAddressWithLocation = async (currentLocation: { lat: number; lng: number; displayName: string }) => {
    try {
      setLoading(true);
      
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
        isDefault: false,
        note: '',
        isDraft: false
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

      console.log('[AddAddress] Saving address with current location:', addressData);

      // Gọi API lưu địa chỉ
      const result = await AddressService.addAddress(token!, addressData);
      
      console.log('[AddAddress] Address saved successfully with location:', result);
      
      Alert.alert('Thành công', 'Đã lưu địa chỉ với vị trí hiện tại thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('[AddAddress] Error saving address with location:', error);
      showErrorToast('Lỗi khi lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                 {/* Header */}
         <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
           <Text style={styles.headerTitle}>Thêm địa chỉ mới</Text>
           <View style={styles.placeholder} />
      </View>

         {/* Address Information */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Thông tin địa chỉ</Text>
          
                     {/* Address Type */}
           <View style={styles.addressTypeContainer}>
          <TouchableOpacity
               style={[styles.addressTypeButton, addressType === 'home' && styles.addressTypeButtonActive]}
               onPress={() => setAddressType('home')}
             >
               <Ionicons name="home" size={20} color={addressType === 'home' ? '#fff' : '#666'} />
               <Text style={[styles.addressTypeText, addressType === 'home' && styles.addressTypeTextActive]}>
                 Nhà riêng
            </Text>
          </TouchableOpacity>

            <TouchableOpacity
               style={[styles.addressTypeButton, addressType === 'office' && styles.addressTypeButtonActive]}
              onPress={() => setAddressType('office')}
            >
               <Ionicons name="business" size={20} color={addressType === 'office' ? '#fff' : '#666'} />
               <Text style={[styles.addressTypeText, addressType === 'office' && styles.addressTypeTextActive]}>
                Văn phòng
              </Text>
            </TouchableOpacity>
          </View>

                                {/* Address Selector */}
           <AddressSelector
             value={selectedAddress}
             onChange={handleAddressSelect}
           />

           {/* Address Detail Input */}
           <View style={styles.inputContainer}>
             <Text style={styles.inputLabel}>Địa chỉ chi tiết</Text>
             <TextInput
               style={styles.textInput}
               value={addressDetail}
               onChangeText={setAddressDetail}
               placeholder="Số nhà, tên đường, tòa nhà..."
               placeholderTextColor="#999"
               multiline
               numberOfLines={3}
             />
           </View>

           {/* Debug Info */}
           {__DEV__ && (
             <View style={styles.debugContainer}>
               <Text style={styles.debugText}>
                 Debug: selectedAddress={selectedAddress ? 'SET' : 'NULL'} | fullAddress="{selectedAddress?.fullAddress || 'N/A'}"
               </Text>
               <Text style={styles.debugText}>
                 Debug: addressDetail="{addressDetail}" | forceUpdate={0}
               </Text>
             </View>
           )}
        </View>

                 {/* Receiver Information */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
           
           {/* Receiver Name */}
           <View style={styles.inputContainer}>
             <Text style={styles.inputLabel}>Họ và tên</Text>
             <TextInput
               style={styles.textInput}
               value={receiverName}
               onChangeText={setReceiverName}
               placeholder="Nhập họ và tên người nhận"
               placeholderTextColor="#999"
             />
           </View>

           {/* Phone Number */}
           <View style={styles.inputContainer}>
             <Text style={styles.inputLabel}>Số điện thoại</Text>
             <TextInput
               style={styles.textInput}
               value={phoneNumber}
               onChangeText={setPhoneNumber}
               placeholder="Nhập số điện thoại"
               placeholderTextColor="#999"
               keyboardType="phone-pad"
             />
           </View>
        </View>

                 {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
             style={[styles.saveButton, loading && styles.saveButtonDisabled]}
             onPress={handleSaveAddress}
            disabled={loading}
          >
             {loading ? (
               <ActivityIndicator color="#fff" size="small" />
             ) : (
               <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
             )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  addressTypeButton: {
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  addressTypeButtonActive: {
    backgroundColor: '#3255FB',
    borderColor: '#3255FB',
  },
  addressTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  addressTypeTextActive: {
    color: '#fff',
  },
  debugContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#3255FB',
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
     textInput: {
     borderWidth: 1,
     borderColor: '#e0e0e0',
    borderRadius: 8,
     paddingHorizontal: 12,
     paddingVertical: 12,
     fontSize: 16,
     color: '#333',
     minHeight: 48,
     textAlignVertical: 'top',
   },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#3255FB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddAddress;
