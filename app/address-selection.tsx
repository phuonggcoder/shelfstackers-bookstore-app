import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface AddressItem {
  code: string;
  name: string;
  fullName: string;
  districtId?: string;
  provinceId?: string;
}

interface LocationData {
  province?: AddressItem;
  district?: AddressItem;
  ward?: AddressItem;
}

export default function AddressSelection() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<AddressItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({});
  const [currentStep, setCurrentStep] = useState<'province' | 'district' | 'ward'>('province');

  // Rate limiting
  const lastRequestTime = useRef<number>(0);
  const rateLimitedRequest = useCallback(async (url: string) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (timeSinceLastRequest < 1000) { // 1 request per second
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

  // LUỒNG 1: Lấy vị trí hiện tại - Lấy luôn cả latlong và địa chỉ chi tiết
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập vị trí', 'Vui lòng cấp quyền vị trí để tự động xác định địa chỉ');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      console.log('Current location:', { lat, lng });

      // Reverse geocoding để lấy địa chỉ chi tiết
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`;
      const data = await rateLimitedRequest(url);

      if (data && data.address) {
        const address = data.address;
        console.log('Address from current location:', address);
        
        // Tìm province
        const provinceName = address.state || address.province;
        if (provinceName) {
          const provinceResults = await searchProvinces(provinceName);
          if (provinceResults.length > 0) {
            setSelectedLocation(prev => ({ ...prev, province: provinceResults[0] }));
            
            // Tìm district
            const districtName = address.county || address.district;
            if (districtName) {
              const districtResults = await searchDistricts(districtName, provinceResults[0].code);
              if (districtResults.length > 0) {
                setSelectedLocation(prev => ({ ...prev, district: districtResults[0] }));
                
                // Tìm ward
                const wardName = address.suburb || address.neighbourhood || address.city_district;
                if (wardName) {
                  const wardResults = await searchWards(wardName, districtResults[0].code);
                  if (wardResults.length > 0) {
                    setSelectedLocation(prev => ({ ...prev, ward: wardResults[0] }));
                  }
                }
              }
            }
          }
        }

        // Tạo địa chỉ chi tiết từ vị trí hiện tại
        const streetAddress = [
          address.house_number,
          address.road,
          address.suburb || address.neighbourhood,
          address.county,
          address.state
        ].filter(Boolean).join(', ');

        console.log('Street address from current location:', streetAddress);

        // LUỒNG 1: Chuyển thẳng đến add-address với đầy đủ thông tin
        const addressData = {
          province: selectedLocation.province,
          district: selectedLocation.district,
          ward: selectedLocation.ward,
          street: streetAddress,
          fullAddress: `${streetAddress}, ${selectedLocation.ward?.name}, ${selectedLocation.district?.name}, ${selectedLocation.province?.name}`,
          location: {
            type: { type: 'Point' },
            coordinates: [lng, lat]
          },
          osm: {
            lat: lat,
            lng: lng,
            displayName: data.display_name,
            raw: data
          }
        };

        console.log('Address data to send:', addressData);

        const addressParam = encodeURIComponent(JSON.stringify(addressData));
        router.push(`/add-address?address=${addressParam}`);
        
        Alert.alert('Thành công', 'Đã tự động xác định địa chỉ từ vị trí hiện tại của bạn');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể xác định vị trí. Vui lòng chọn thủ công.');
    } finally {
      setIsLoading(false);
    }
  }, [rateLimitedRequest, selectedLocation, router]);

  // Tìm kiếm province
  const searchProvinces = useCallback(async (query: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Vietnam')}&countrycodes=vn&limit=5&addressdetails=1`;
    const data = await rateLimitedRequest(url);
    
    return data
      .filter((item: any) => item.address && item.address.state)
      .map((item: any) => ({
        code: item.address.state_code || item.place_id.toString(),
        name: item.address.state,
        fullName: item.address.state,
        type: 'province'
      }));
  }, [rateLimitedRequest]);

  // Tìm kiếm district
  const searchDistricts = useCallback(async (query: string, provinceCode: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Vietnam')}&countrycodes=vn&limit=5&addressdetails=1`;
    const data = await rateLimitedRequest(url);
    
    return data
      .filter((item: any) => item.address && item.address.county && item.address.state)
      .map((item: any) => ({
        code: item.address.county_code || item.place_id.toString(),
        name: item.address.county,
        fullName: item.address.county,
        provinceId: provinceCode,
        type: 'district'
      }));
  }, [rateLimitedRequest]);

  // Tìm kiếm ward
  const searchWards = useCallback(async (query: string, districtCode: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Vietnam')}&countrycodes=vn&limit=5&addressdetails=1`;
    const data = await rateLimitedRequest(url);
    
    return data
      .filter((item: any) => item.address && (item.address.suburb || item.address.neighbourhood))
      .map((item: any) => ({
        code: item.place_id.toString(),
        name: item.address.suburb || item.address.neighbourhood,
        fullName: item.address.suburb || item.address.neighbourhood,
        districtId: districtCode,
        type: 'ward'
      }));
  }, [rateLimitedRequest]);

  // Tìm kiếm autocomplete
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      let url = '';
      
      switch (currentStep) {
        case 'province':
          url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Vietnam')}&countrycodes=vn&limit=10&addressdetails=1`;
          break;
        case 'district':
          if (!selectedLocation.province) return;
          url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', ' + selectedLocation.province.name + ', Vietnam')}&countrycodes=vn&limit=10&addressdetails=1`;
          break;
        case 'ward':
          if (!selectedLocation.district) return;
          url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', ' + selectedLocation.district.name + ', Vietnam')}&countrycodes=vn&limit=10&addressdetails=1`;
          break;
      }

      const data = await rateLimitedRequest(url);
      
      const results = data
        .filter((item: any) => {
          const address = item.address;
          switch (currentStep) {
            case 'province':
              return address && address.state;
            case 'district':
              return address && address.county && address.state === selectedLocation.province?.name;
            case 'ward':
              return address && (address.suburb || address.neighbourhood) && address.county === selectedLocation.district?.name;
            default:
              return false;
          }
        })
        .map((item: any) => {
          const address = item.address;
          switch (currentStep) {
            case 'province':
              return {
                code: address.state_code || item.place_id.toString(),
                name: address.state,
                fullName: address.state,
                type: 'province'
              };
            case 'district':
              return {
                code: address.county_code || item.place_id.toString(),
                name: address.county,
                fullName: address.county,
                provinceId: selectedLocation.province?.code,
                type: 'district'
              };
            case 'ward':
              return {
                code: item.place_id.toString(),
                name: address.suburb || address.neighbourhood,
                fullName: address.suburb || address.neighbourhood,
                districtId: selectedLocation.district?.code,
                type: 'ward'
              };
            default:
              return null;
          }
        })
        .filter(Boolean);

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [currentStep, selectedLocation, rateLimitedRequest]);

  // Chọn item
  const selectItem = useCallback((item: AddressItem) => {
    setSelectedLocation(prev => ({ ...prev, [currentStep]: item }));
    setSearchText('');
    setSearchResults([]);
    
    // Chuyển sang bước tiếp theo
    switch (currentStep) {
      case 'province':
        setCurrentStep('district');
        break;
      case 'district':
        setCurrentStep('ward');
        break;
      case 'ward':
        // Hoàn thành, chuyển sang trang địa chỉ chi tiết
        const locationData = {
          ...selectedLocation,
          [currentStep]: item
        };
        
        if (locationData.province && locationData.district && locationData.ward) {
          // LUỒNG 2: Chuyển đến address-detail để chọn latlong trên map
          const payload = encodeURIComponent(JSON.stringify(locationData));
          router.push(`/address-detail?location=${payload}`);
        }
        break;
    }
  }, [currentStep, selectedLocation, router]);

  // Xác nhận và chuyển trang
  // LUỒNG 2: Xác nhận lựa chọn - Chỉ chuyển province/district/ward (không có latlong)
  const confirmSelection = useCallback(() => {
    if (!selectedLocation.province || !selectedLocation.district || !selectedLocation.ward) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã');
      return;
    }

    // LUỒNG 2: Chuyển đến address-detail để chọn latlong trên map
    const locationData = {
      province: selectedLocation.province,
      district: selectedLocation.district,
      ward: selectedLocation.ward,
      isFromCurrentLocation: false // Flag để biết đây là từ autocomplete
    };

    const locationParam = encodeURIComponent(JSON.stringify(locationData));
    router.push(`/address-detail?location=${locationParam}`);
  }, [selectedLocation, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText, searchAddress]);

  const renderItem = ({ item }: { item: AddressItem }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => selectItem(item)}
    >
      <Text style={styles.searchItemText}>{item.fullName}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn địa chỉ</Text>
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

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, selectedLocation.province && styles.progressDotActive]} />
          <Text style={styles.progressText}>Tỉnh/Thành</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, selectedLocation.district && styles.progressDotActive]} />
          <Text style={styles.progressText}>Quận/Huyện</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, selectedLocation.ward && styles.progressDotActive]} />
          <Text style={styles.progressText}>Phường/Xã</Text>
        </View>
      </View>

      {/* Current Selection */}
      {selectedLocation.province && (
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>Đã chọn:</Text>
          <Text style={styles.selectionText}>
            {selectedLocation.province.name}
            {selectedLocation.district && ` > ${selectedLocation.district.name}`}
            {selectedLocation.ward && ` > ${selectedLocation.ward.name}`}
          </Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>
          {currentStep === 'province' && 'Tìm tỉnh/thành phố'}
          {currentStep === 'district' && 'Tìm quận/huyện'}
          {currentStep === 'ward' && 'Tìm phường/xã'}
        </Text>
          <TextInput
            style={styles.searchInput}
          placeholder="Nhập để tìm kiếm..."
            value={searchText}
          onChangeText={setSearchText}
          autoFocus={true}
        />
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
            renderItem={renderItem}
          keyExtractor={(item) => item.code}
          style={styles.searchResults}
        />
      )}

      {/* Confirm Button */}
      {selectedLocation.province && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmSelection}
          >
            <Text style={styles.confirmButtonText}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#3255FB',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  selectionContainer: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3255FB',
    marginBottom: 4,
  },
  selectionText: {
    fontSize: 16,
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    marginHorizontal: 16,
  },
  searchItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchItemText: {
    fontSize: 16,
    color: '#333',
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
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
