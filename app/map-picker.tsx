import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddressMapSearch from '../components/AddressMapSearch';

export default function MapPicker() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialLat = params.lat ? Number(params.lat) : undefined;
  const initialLon = params.lng ? Number(params.lng) : undefined;
  // allowed bbox passed as comma separated in params.allowed? or use params.wkt?
  const allowedRaw = params.allowed as string | undefined;
  let allowedBbox: [number, number, number, number] | null = null;
  if (allowedRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(allowedRaw));
      if (Array.isArray(parsed) && parsed.length === 4) allowedBbox = parsed as any;
  } catch {
  }
  }

  const [currentSelected, setCurrentSelected] = useState<any>(null);
  const [isOob, setIsOob] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const webViewRef = useRef<any>(null);

  const onSelect = useCallback((res: any) => {
    if (res && res.type === 'position_update') {
      // Cập nhật vị trí hiện tại mà không confirm
      setCurrentSelected((prev: any) => ({
        ...prev,
        lat: res.lat,
        lon: res.lon
      }));
    } else {
      setCurrentSelected(res);
      if (res && res.type === 'oob') {
        setIsOob(true);
      } else {
        setIsOob(false);
        // Tự động cập nhật vị trí khi map thay đổi
        if (res && res.type === 'confirm') {
          console.log('Location confirmed:', res);
        }
      }
    }
  }, []);

  const handleRequestLocation = useCallback(async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập vị trí', 'Vui lòng cấp quyền vị trí để sử dụng tính năng này');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      // Send location to WebView
      if (webViewRef.current) {
        const script = `
          if (window.map) {
            window.map.setView([${lat}, ${lon}], 17);
            // Trigger position update
            var center = window.map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'position_update', 
              lat: center.lat, 
              lon: center.lng 
            }));
          }
        `;
        webViewRef.current.injectJavaScript(script);
      }

      console.log('Location updated:', { lat, lon });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
      setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : 300);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Tìm kiếm vị trí chính xác hơn khi có manualInput
  useEffect(() => {
    if (params.manualInput === 'true' && params.addressDetail) {
      // Tìm kiếm vị trí chính xác hơn cho địa chỉ thủ công
      const searchAddress = async () => {
        try {
          const searchQuery = `${params.addressDetail}, ${params.ward}, ${params.district}, ${params.province}`;
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=1`;
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)'
            }
          });
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            const result = data[0];
            // Cập nhật vị trí ban đầu nếu tìm thấy
            if (result.lat && result.lon) {
              console.log('Found better location for manual input:', result);
              // Có thể cập nhật vị trí ban đầu ở đây nếu cần
            }
          }
        } catch (error) {
          console.warn('Failed to search for manual input address:', error);
        }
      };
      
      searchAddress();
    }
  }, [params.manualInput, params.addressDetail, params.ward, params.district, params.province]);

  const onConfirm = useCallback(() => {
    // Tự động lấy vị trí hiện tại của marker nếu chưa có currentSelected
    if (!currentSelected) {
      // Lấy vị trí trung tâm của map (marker position)
      const centerLat = initialLat || 10.8760444;
      const centerLon = initialLon || 106.6365252;
      
      // Tạo currentSelected từ vị trí trung tâm
      const autoSelected = {
        lat: centerLat,
        lon: centerLon,
        display_name: params.addressDetail as string || '',
        type: 'auto'
      };
      
      setCurrentSelected(autoSelected);
      
      // Tiếp tục với vị trí tự động
      handleConfirmWithLocation(autoSelected);
      return;
    }
    
    handleConfirmWithLocation(currentSelected);
  }, [currentSelected, initialLat, initialLon, params.addressDetail]);

  const handleConfirmWithLocation = useCallback((selectedLocation: any) => {
    // If allowedBbox exists, ensure selected is inside
    if (allowedBbox) {
      const lat = Number(selectedLocation.lat);
      const lon = Number(selectedLocation.lon);
      const [latMin, latMax, lonMin, lonMax] = allowedBbox;
      if (!(lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax)) {
        Alert.alert('Vị trí nằm ngoài phạm vi xã đã chọn. Vui lòng chọn trong phạm vi.');
        return;
      }
    }

    // Check if we should return to address-detail page
    if (params.returnTo === 'address-detail') {
      // Nếu có flag preserveAddress, chỉ truyền street address detail
      if (params.preserveAddress === 'true') {
        // Lấy street address từ Nominatim address hoặc display_name
        let streetAddress = '';
        
        if (selectedLocation.address) {
          // Ưu tiên lấy từ address object của Nominatim
          const addr = selectedLocation.address;
          const houseNumber = addr.house_number || addr.housenumber || '';
          const road = addr.road || addr.pedestrian || addr.cycleway || addr.residential || addr.street || '';
          streetAddress = [houseNumber, road].filter(Boolean).join(' ');
        }
        
        // Fallback: lấy từ display_name nếu không có address object
        if (!streetAddress && selectedLocation.display_name) {
          const displayParts = selectedLocation.display_name.split(', ');
          // Lấy phần đầu (street name) bỏ qua phần cuối (ward, district, province)
          streetAddress = displayParts[0] || '';
        }
        
        // Fallback: sử dụng params.addressDetail nếu có
        if (!streetAddress) {
          streetAddress = params.addressDetail as string || '';
        }
        
        console.log('[MapPicker] Sending addressDetailOnly:', { streetAddress, originalDisplay: selectedLocation.display_name });
        
        const payload = encodeURIComponent(JSON.stringify({ 
          addressDetailOnly: true,
          addressDetail: streetAddress,
          lat: selectedLocation.lat,
          lng: selectedLocation.lon
        }));
        router.push(`/add-address?osm=${payload}`);
      } else {
        // Return to add-address with the selected address
        const payload = encodeURIComponent(JSON.stringify({ 
          lat: selectedLocation.lat, 
          lng: selectedLocation.lon, 
          display_name: selectedLocation.display_name,
          addressDetail: selectedLocation.display_name || params.addressDetail
        }));
        router.push(`/add-address?osm=${payload}&ward=${params.ward}&district=${params.district}&province=${params.province}`);
      }
    } else {
      // return to add-address with osm param payload
      const payload = encodeURIComponent(JSON.stringify({ 
        lat: selectedLocation.lat, 
        lng: selectedLocation.lon, 
        display_name: selectedLocation.display_name,
        addressDetail: selectedLocation.display_name
      }));
      router.push(`/add-address?osm=${payload}`);
    }
      }, [allowedBbox, router, params]);



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sửa Vị trí</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Address Input Field */}
        <View style={styles.addressInputContainer}>
          <TextInput
            style={styles.addressInput}
            placeholder="Nhập địa chỉ của bạn"
            value={params.addressDetail as string || ''}
            onChangeText={(text) => {
              // Có thể thêm logic tìm kiếm địa chỉ ở đây
            }}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.mapWrap}>
          <AddressMapSearch 
            initialLat={initialLat} 
            initialLon={initialLon} 
            allowedBbox={allowedBbox} 
            onSelect={onSelect}
            onRequestLocation={handleRequestLocation}
            ref={webViewRef}
          />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomSafeArea} pointerEvents="box-none">
        <View style={[styles.footer, { bottom: keyboardHeight > 0 ? keyboardHeight : 16 }]} pointerEvents="box-none">
          {isOob ? (
            <Text style={{ color: '#b71c1c', marginBottom: 8, textAlign: 'center' }}>Vị trí đang chọn nằm ngoài phạm vi xã đã chọn.</Text>
          ) : null}
          <TouchableOpacity style={[styles.confirm, isOob && { backgroundColor: '#ccc' }]} onPress={onConfirm} disabled={isOob}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeArea: { flex: 1 },
  bottomSafeArea: { backgroundColor: '#fff', paddingBottom: 12 },
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
  addressInputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addressInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  wardInfo: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  wardInfoText: {
    fontSize: 14,
    color: '#3255FB',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  addressDetailText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  manualInputNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  mapWrap: { flex: 1, marginBottom: 96 },
  footer: { 
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  confirm: { 
    backgroundColor: '#FF6B35', 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderRadius: 10, 
    alignItems: 'center',
    width: '92%'
  }
});
