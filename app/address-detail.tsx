import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AddressMapSearch from '../components/AddressMapSearch';

interface LocationData {
  province?: {
    code: string;
    name: string;
    fullName: string;
  };
  district?: {
    code: string;
    name: string;
    fullName: string;
    provinceId: string;
  };
  ward?: {
    code: string;
    name: string;
    fullName: string;
    districtId: string;
  };
  // Các trường cho luồng vị trí hiện tại
  isFromCurrentLocation?: boolean;
  latlong?: {
    lat: number;
    lng: number;
  };
  streetAddress?: string;
  displayName?: string;
  address?: any;
}

interface AddressSuggestion {
  lat: number;
  lng: number;
  display_name: string;
  address: any;
}

export default function AddressDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [locationData, setLocationData] = useState<LocationData>({});
  const [streetAddress, setStreetAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AddressSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 10.8231, lng: 106.6297 }); // TP.HCM default
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef<any>(null);
  const lastRequestTime = useRef<number>(0);

  // Rate limiting
  const rateLimitedRequest = useCallback(async (url: string) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (timeSinceLastRequest < 1000) {
      const waitTime = 1000 - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime.current = Date.now();
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'shelfstackers-app/1.0 (https://www.openstreetmap.org)',
        'Accept': 'application/json',
        'Accept-Language': 'vi,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }, []);

  // Khởi tạo dữ liệu từ params
  useEffect(() => {
    if (params.location) {
      try {
        const location = JSON.parse(decodeURIComponent(params.location as string));
        setLocationData(location);
        console.log('Location data received:', location);
        
        // LUỒNG 2: Từ autocomplete - Chỉ có province/district/ward
        if (!location.isFromCurrentLocation && location.ward && location.district && location.province) {
          console.log('Processing autocomplete flow');
          // Tìm tọa độ trung tâm của ward để load map
          initializeMapCenter(location);
        }
      } catch (error) {
        console.error('Error parsing location data:', error);
        Alert.alert('Lỗi', 'Không thể xử lý dữ liệu địa chỉ');
      }
    }
  }, [params.location]);

  // Khởi tạo tọa độ trung tâm map
  const initializeMapCenter = useCallback(async (location: LocationData) => {
    try {
      setIsLoading(true);
      console.log('Initializing map center for:', location);
      
      // Tìm tọa độ trung tâm của ward
      const wardQuery = `${location.ward?.name}, ${location.district?.name}, ${location.province?.name}`;
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(wardQuery)}&countrycodes=vn&limit=1&addressdetails=1`;
      
      console.log('Searching for ward center:', wardQuery);
      const data = await rateLimitedRequest(url);
      console.log('Ward center search result:', data);
      
      if (data && data.length > 0) {
        const result = data[0];
        const newCenter = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        console.log('Setting map center to:', newCenter);
        setMapCenter(newCenter);
        
        // Di chuyển map đến vị trí mới
        moveMapToLocation(newCenter.lat, newCenter.lng, 15);
      } else {
        console.warn('No ward center found, using default location');
        // Fallback to default location
        const defaultCenter = { lat: 10.8231, lng: 106.6297 }; // TP.HCM
        setMapCenter(defaultCenter);
        moveMapToLocation(defaultCenter.lat, defaultCenter.lng, 10);
      }
    } catch (error) {
      console.error('Error initializing map center:', error);
      // Fallback to default location
      const defaultCenter = { lat: 10.8231, lng: 106.6297 }; // TP.HCM
      setMapCenter(defaultCenter);
      moveMapToLocation(defaultCenter.lat, defaultCenter.lng, 10);
    } finally {
      setIsLoading(false);
    }
  }, [rateLimitedRequest]);

  // Di chuyển map đến vị trí
  const moveMapToLocation = useCallback((lat: number, lng: number, zoom: number = 17) => {
    if (!webViewRef.current || !mapReady) {
      console.log('Map not ready, retrying in 1 second...');
      setTimeout(() => moveMapToLocation(lat, lng, zoom), 1000);
      return;
    }

    console.log('Moving map to location:', { lat, lng, zoom });
    try {
      // Use the new moveToLocation function
      if (webViewRef.current.moveToLocation) {
        webViewRef.current.moveToLocation(lat, lng, zoom);
      } else {
        // Fallback to injectJavaScript
        const script = `
          if (window.map) {
            console.log('Moving map to location:', ${lat}, ${lng}, ${zoom});
            window.map.setView([${lat}, ${lng}], ${zoom}, {
              animate: true,
              duration: 1.0
            });
            
            // Force a redraw to ensure the map updates
            setTimeout(() => {
              if (window.map) {
                window.map.invalidateSize();
              }
            }, 100);
          } else {
            console.log('Map not available yet');
          }
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (error) {
      console.error('Error moving map:', error);
    }
  }, [mapReady]);

  // Tìm kiếm địa chỉ với autocomplete
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || !locationData.ward || !locationData.district || !locationData.province) {
      setSuggestions([]);
      return;
    }

    try {
      // Tìm kiếm trong phạm vi ward đã chọn
      const searchQuery = `${query}, ${locationData.ward.name}, ${locationData.district.name}, ${locationData.province.name}`;
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=10&addressdetails=1&bounded=1`;
      
      const data = await rateLimitedRequest(url);
      
      const results = data
        .filter((item: any) => {
          const address = item.address;
          // Kiểm tra xem kết quả có thuộc ward đã chọn không
          return address && 
                 (address.suburb === locationData.ward?.name || 
                  address.neighbourhood === locationData.ward?.name ||
                  address.city_district === locationData.ward?.name) &&
                 address.county === locationData.district?.name &&
                 address.state === locationData.province?.name;
        })
        .map((item: any) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          display_name: item.display_name,
          address: item.address
        }));

      setSuggestions(results);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    }
  }, [locationData, rateLimitedRequest]);

  // Lấy vị trí hiện tại
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Getting current location...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập vị trí', 'Vui lòng cấp quyền vị trí để sử dụng tính năng này');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      console.log('Current location obtained:', { lat, lng });

      // Kiểm tra xem vị trí có nằm trong ward đã chọn không
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
      console.log('Reverse geocoding URL:', url);
      
      const data = await rateLimitedRequest(url);
      console.log('Reverse geocoding result:', data);

      if (data && data.address) {
        const address = data.address;
        console.log('Address details:', address);
        
        const isInWard = address.suburb === locationData.ward?.name || 
                        address.neighbourhood === locationData.ward?.name ||
                        address.city_district === locationData.ward?.name;

        console.log('Is in ward:', isInWard, 'Ward name:', locationData.ward?.name);

        if (!isInWard && locationData.ward?.name) {
          Alert.alert(
            'Vị trí nằm ngoài phạm vi', 
            `Vị trí hiện tại của bạn nằm ngoài phạm vi ${locationData.ward?.name}. Bạn có muốn tiếp tục sử dụng vị trí này không?`,
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Tiếp tục', 
                onPress: () => {
                  console.log('User chose to continue with out-of-bounds location');
                  setSelectedLocation({
                    lat,
                    lng,
                    display_name: data.display_name,
                    address: data.address
                  });
                  moveMapToLocation(lat, lng, 17);
                }
              }
            ]
          );
          return;
        }

        // Vị trí nằm trong ward hoặc không có ward restriction, cập nhật
        console.log('Setting selected location to current position');
        setSelectedLocation({
          lat,
          lng,
          display_name: data.display_name,
          address: data.address
        });
        
        // Cập nhật map center và di chuyển map
        setMapCenter({ lat, lng });
        
        // Đợi map sẵn sàng rồi mới di chuyển
        setTimeout(() => {
          moveMapToLocation(lat, lng, 17);
        }, 500);
        
        Alert.alert('Thành công', 'Đã cập nhật vị trí hiện tại của bạn');
      } else {
        console.warn('No address data from reverse geocoding');
        // Still set the location even without address data
        setSelectedLocation({
          lat,
          lng,
          display_name: `Vị trí hiện tại (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          address: null
        });
        
        // Cập nhật map center và di chuyển map
        setMapCenter({ lat, lng });
        
        // Đợi map sẵn sàng rồi mới di chuyển
        setTimeout(() => {
          moveMapToLocation(lat, lng, 17);
        }, 500);
        
        Alert.alert('Thành công', 'Đã cập nhật vị trí hiện tại của bạn');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [locationData, rateLimitedRequest, moveMapToLocation]);

  // Xử lý sự kiện từ map
  const onMapSelect = useCallback((data: any) => {
    if (data && data.type === 'position_update') {
      // Cập nhật vị trí từ marker trên map
      setSelectedLocation(prev => prev ? {
        ...prev,
        lat: data.lat,
        lng: data.lon
      } : null);
    } else if (data && data.type === 'confirm') {
      // Người dùng xác nhận vị trí trên map
      setSelectedLocation({
        lat: data.lat,
        lng: data.lon,
        display_name: data.display_name || '',
        address: data.address
      });
    } else if (data && data.type === 'map_ready') {
      setMapReady(true);
    }
  }, []);

  // Xác nhận và lưu địa chỉ
  const confirmAddress = useCallback(() => {
    if (!streetAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    if (!locationData.province || !locationData.ward) {
      Alert.alert('Lỗi', 'Thiếu thông tin tỉnh/thành phố hoặc phường/xã');
      return;
    }

    // Kiểm tra xem đã có latlong chưa
    if (!selectedLocation) {
      Alert.alert(
        'Cần cập nhật vị trí',
        'Để tính phí vận chuyển chính xác, vui lòng cập nhật vị trí của bạn. Bạn có muốn sử dụng vị trí hiện tại không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Cập nhật vị trí', 
            onPress: () => {
              console.log('User chose to update location');
              getCurrentLocation();
            }
          }
        ]
      );
      return;
    }

    // Tạo địa chỉ theo format yêu cầu
    const addressData = {
      // Thông tin người nhận (sẽ được điền ở trang add-address)
      fullName: '', // Sẽ được điền sau
      phone: '', // Sẽ được điền sau
      email: '', // Không bắt buộc
      
      // Thông tin địa chỉ
      street: streetAddress.trim(),
      
      // Thông tin hành chính
      ward: {
        code: locationData.ward.code,
        name: locationData.ward.name,
        districtId: locationData.ward.districtId,
        fullName: locationData.ward.fullName
      },
      province: {
        code: locationData.province.code,
        name: locationData.province.name
      },
      district: locationData.district ? {
        code: locationData.district.code,
        name: locationData.district.name,
        provinceId: locationData.district.provinceId
      } : undefined,
      
      // Tọa độ
      location: selectedLocation ? {
        type: { type: 'Point' },
        coordinates: [selectedLocation.lng, selectedLocation.lat] // [longitude, latitude]
      } : undefined,
      
      // Dữ liệu OSM
      osm: selectedLocation ? {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        displayName: selectedLocation.display_name,
        raw: selectedLocation.address
      } : undefined,
      
      // Địa chỉ đầy đủ (tự động sinh)
      fullAddress: `${streetAddress.trim()}, ${locationData.ward.name}, ${locationData.district?.name || ''}, ${locationData.province.name}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, ''),
      
      // Thông tin khác
      adminType: 'new',
      isDefault: false,
      note: '',
      isDraft: false
    };

    // Chuyển về trang add-address với dữ liệu đã chuẩn bị
    const payload = encodeURIComponent(JSON.stringify(addressData));
    router.push(`/add-address?address=${payload}`);
  }, [streetAddress, locationData, selectedLocation, router, getCurrentLocation]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(streetAddress);
    }, 500);

    return () => clearTimeout(timer);
  }, [streetAddress, searchAddress]);

  // Update map when mapCenter changes
  useEffect(() => {
    if (mapReady && mapCenter) {
      console.log('Map center changed, updating map:', mapCenter);
      moveMapToLocation(mapCenter.lat, mapCenter.lng, 15);
    }
  }, [mapCenter, mapReady, moveMapToLocation]);

  // Xử lý khởi tạo map sau khi locationData đã được set
  useEffect(() => {
    if (locationData && !locationData.isFromCurrentLocation && locationData.ward && locationData.district && locationData.province) {
      console.log('Initializing map for autocomplete flow');
      initializeMapCenter(locationData);
    }
  }, [locationData, initializeMapCenter]);

  const renderSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setSelectedLocation(item);
        setStreetAddress(item.display_name.split(',')[0] || ''); // Lấy phần đầu làm street address
        setSuggestions([]);
        moveMapToLocation(item.lat, item.lng, 17);
      }}
    >
      <Text style={styles.suggestionText}>{item.display_name}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
    >
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ chi tiết</Text>
          <TouchableOpacity 
            onPress={getCurrentLocation}
            style={[styles.locationButton, isLoading && styles.locationButtonDisabled]}
            disabled={isLoading}
          >
            <Ionicons 
              name={isLoading ? "hourglass" : "locate"} 
              size={24} 
              color={isLoading ? "#999" : "#3255FB"} 
            />
          </TouchableOpacity>
      </View>

        {/* Location Info */}
        {locationData.province && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoText}>
              {locationData.ward?.name}, {locationData.district?.name}, {locationData.province.name}
            </Text>
            {locationData.isFromCurrentLocation && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="location" size={16} color="#3255FB" />
                <Text style={{ marginLeft: 4, color: '#3255FB', fontSize: 12 }}>Từ vị trí hiện tại</Text>
              </View>
            )}
            {/* Location Status Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons 
                name={selectedLocation ? "checkmark-circle" : "alert-circle"} 
                size={16} 
                color={selectedLocation ? "#4CAF50" : "#FF9800"} 
              />
              <Text style={{ 
                marginLeft: 4, 
                color: selectedLocation ? '#4CAF50' : '#FF9800', 
                fontSize: 12 
              }}>
                {selectedLocation ? 'Đã có vị trí' : 'Chưa có vị trí - cần cập nhật'}
              </Text>
            </View>
          </View>
        )}

        {/* Address Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Địa chỉ chi tiết (số nhà, tên đường)</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Nhập địa chỉ chi tiết..."
            value={streetAddress}
            onChangeText={setStreetAddress}
            autoFocus={true}
          />

      {/* Suggestions */}
          {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
              keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
              style={styles.suggestionsList}
            />
          )}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <AddressMapSearch 
            initialLat={mapCenter.lat} 
            initialLon={mapCenter.lng} 
            onSelect={onMapSelect}
            ref={webViewRef}
          />
          
          {/* Selected Location Info */}
          {selectedLocation && (
            <View style={styles.selectedLocationInfo}>
              <Text style={styles.selectedLocationText}>
                Vị trí: {selectedLocation.display_name}
             </Text>
              <Text style={styles.selectedLocationText}>
                Tọa độ: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </Text>
          </View>
        )}
             </View>

        {/* Confirm Button */}
         <View style={styles.footer}>
           <TouchableOpacity
            style={[styles.confirmButton, (!streetAddress.trim() || !locationData.province) && styles.confirmButtonDisabled]}
            onPress={confirmAddress}
            disabled={!streetAddress.trim() || !locationData.province}
           >
            <Text style={styles.confirmButtonText}>
              {selectedLocation ? 'Tiếp tục' : 'Tiếp tục (cần cập nhật vị trí)'}
            </Text>
           </TouchableOpacity>
         </View>
     </SafeAreaView>
    </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  locationButton: {
    padding: 8,
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  locationInfo: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  locationInfoText: {
    fontSize: 16,
    color: '#3255FB',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  suggestionsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedLocationInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedLocationText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#3255FB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
