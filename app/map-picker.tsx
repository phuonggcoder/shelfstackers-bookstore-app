import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddressMapSearch from '../components/AddressMapSearch';

// OpenStreetMap OAuth2 Configuration
const OSM_CONFIG = {
  CLIENT_ID: 'IJHMr2iyQskudttECWymcCdxq6hYYT72iE4spiUhwoU',
  BASE_URL: 'https://nominatim.openstreetmap.org',
  USER_AGENT: 'shelfstackers-app/1.0 (https://www.openstreetmap.org)',
  RATE_LIMIT: 1, // 1 request per second
};

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
  const [addressInput, setAddressInput] = useState(params.addressDetail as string || '');
  const [isLoading, setIsLoading] = useState(false);
  const webViewRef = useRef<any>(null);
  const lastRequestTime = useRef<number>(0);

  // Rate limiting function for Nominatim API
  const rateLimitedRequest = useCallback(async (url: string) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (timeSinceLastRequest < OSM_CONFIG.RATE_LIMIT * 1000) {
      const waitTime = (OSM_CONFIG.RATE_LIMIT * 1000) - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime.current = Date.now();
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': OSM_CONFIG.USER_AGENT,
        'Accept': 'application/json',
        'Accept-Language': 'vi,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }, []);

  // Hàm helper để di chuyển map đến vị trí mới với retry mechanism
  const moveMapToLocation = useCallback((lat: number, lon: number, zoom: number = 17) => {
    console.log('moveMapToLocation called with:', { lat, lon, zoom });
    
    if (!webViewRef.current) {
      console.log('WebView ref not ready, retrying in 1 second...');
      setTimeout(() => moveMapToLocation(lat, lon, zoom), 1000);
      return;
    }

    const script = `
      (function() {
        console.log('Executing moveMapToLocation script for:', ${lat}, ${lon}, ${zoom});
        
        function moveMap() {
          if (window.map && typeof window.map.setView === 'function') {
            console.log('Map is ready, setting view to:', ${lat}, ${lon}, ${zoom});
            
            try {
              window.map.setView([${lat}, ${lon}], ${zoom}, {
                animate: true,
                duration: 1.0
              });
              
              // Verify the move was successful
              setTimeout(function() {
                var center = window.map.getCenter();
                console.log('Map center after move:', center.lat, center.lng);
                
                // Check if the move was successful (within 0.001 degrees)
                var latDiff = Math.abs(center.lat - ${lat});
                var lonDiff = Math.abs(center.lng - ${lon});
                
                if (latDiff > 0.001 || lonDiff > 0.001) {
                  console.log('Map move may not have been successful, retrying...');
                  window.map.setView([${lat}, ${lon}], ${zoom}, {
                    animate: true,
                    duration: 1.0
                  });
                }
                
                // Send position update
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'position_update', 
                  lat: center.lat, 
                  lon: center.lng,
                  targetLat: ${lat},
                  targetLon: ${lon}
                }));
              }, 1000);
              
            } catch (error) {
              console.error('Error setting map view:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'map_error', 
                error: error.message 
              }));
            }
          } else {
            console.log('Map not ready, retrying in 500ms...');
            setTimeout(moveMap, 500);
          }
        }
        
        moveMap();
      })();
    `;
    
    try {
      webViewRef.current.injectJavaScript(script);
      console.log('JavaScript injected successfully');
    } catch (error) {
      console.error('Error injecting JavaScript:', error);
    }
  }, []);

  // Hàm kiểm tra map đã sẵn sàng chưa
  const checkMapReady = useCallback(() => {
    if (!webViewRef.current) return false;
    
    const script = `
      (function() {
        if (window.map && typeof window.map.setView === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'map_ready_check', 
            ready: true 
          }));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'map_ready_check', 
            ready: false 
          }));
        }
      })();
    `;
    
    try {
      webViewRef.current.injectJavaScript(script);
    } catch (error) {
      console.error('Error checking map ready:', error);
    }
  }, []);

  const onSelect = useCallback((res: any) => {
    console.log('onSelect received:', res);
    
    if (res && res.type === 'position_update') {
      // Cập nhật vị trí hiện tại mà không confirm
      console.log('Position update:', { 
        current: { lat: res.lat, lon: res.lon },
        target: { lat: res.targetLat, lon: res.targetLon }
      });
      
      setCurrentSelected((prev: any) => ({
        ...prev,
        lat: res.lat,
        lon: res.lon
      }));
    } else if (res && res.type === 'map_error') {
      console.error('Map error:', res.error);
      Alert.alert('Lỗi Map', `Không thể di chuyển map: ${res.error}`);
    } else if (res && res.type === 'map_ready_check') {
      console.log('Map ready check:', res.ready);
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
      setIsLoading(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập vị trí', 'Vui lòng cấp quyền vị trí để sử dụng tính năng này');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      console.log('Current location obtained:', { lat, lon });

      // Kiểm tra xem vị trí hiện tại có nằm trong ward đã chọn không
      let isInWard = true;
      if (allowedBbox) {
        const [latMin, latMax, lonMin, lonMax] = allowedBbox;
        isInWard = (lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax);
        
        if (!isInWard) {
          Alert.alert(
            'Vị trí nằm ngoài phạm vi', 
            `Vị trí hiện tại của bạn nằm ngoài phạm vi ${params.ward}. Bạn có muốn tiếp tục sử dụng vị trí này không?`,
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Tiếp tục', 
                onPress: () => updateMapToLocation(lat, lon, 'Vị trí hiện tại của bạn (ngoài phạm vi)')
              }
            ]
          );
          return;
        }
      }

      // Cập nhật map với vị trí hiện tại
      updateMapToLocation(lat, lon, 'Vị trí hiện tại của bạn');
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [allowedBbox, params.ward]);

  // Hàm helper để cập nhật map đến vị trí mới
  const updateMapToLocation = useCallback((lat: number, lon: number, displayName: string) => {
    // Update currentSelected state
    setCurrentSelected({
      lat: lat,
      lon: lon,
      display_name: displayName,
      type: 'current_location'
    });

    // Di chuyển map đến vị trí mới
    moveMapToLocation(lat, lon, 17);

    // Show success message
    Alert.alert('Thành công', 'Đã cập nhật vị trí hiện tại của bạn');
  }, [moveMapToLocation]);

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

  // Khởi tạo vị trí ban đầu cho map
  useEffect(() => {
    const initializeMapLocation = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing map location with params:', {
          initialLat,
          initialLon,
          ward: params.ward,
          district: params.district,
          province: params.province,
          addressDetail: params.addressDetail
        });

        // Đợi WebView sẵn sàng
        console.log('Waiting for WebView to be ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Ưu tiên 1: Sử dụng tọa độ được truyền vào (nếu có)
        if (initialLat && initialLon) {
          console.log('Using initial coordinates:', { lat: initialLat, lon: initialLon });
          setCurrentSelected({
            lat: initialLat,
            lon: initialLon,
            display_name: params.addressDetail as string || 'Vị trí đã chọn',
            type: 'initial_coordinates'
          });
          
          // Di chuyển map đến vị trí ban đầu
          moveMapToLocation(initialLat, initialLon, 17);
          return;
        }

        // Ưu tiên 2: Tìm kiếm vị trí từ ward, district, province đã chọn
        if (params.ward && params.district && params.province) {
          console.log('Searching for ward location:', { ward: params.ward, district: params.district, province: params.province });
          
          // Tìm vị trí trung tâm của ward
          const wardQuery = `${params.ward}, ${params.district}, ${params.province}`;
          const wardUrl = `${OSM_CONFIG.BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(wardQuery)}&countrycodes=vn&limit=1&addressdetails=1`;
          
          const wardData = await rateLimitedRequest(wardUrl);
          
          if (wardData && wardData.length > 0) {
            const wardResult = wardData[0];
            console.log('Found ward center location:', wardResult);
            
            // Cập nhật currentSelected với vị trí ward
            setCurrentSelected({
              lat: wardResult.lat,
              lon: wardResult.lon,
              display_name: `${params.addressDetail || 'Địa chỉ'}, ${params.ward}`,
              type: 'ward_center',
              address: wardResult.address
            });
            
            // Di chuyển map đến vị trí ward
            moveMapToLocation(wardResult.lat, wardResult.lon, 15);
            return;
          }
        }

        // Ưu tiên 3: Nếu có addressDetail, thử tìm kiếm địa chỉ chính xác
        if (params.addressDetail && params.ward && params.district && params.province) {
          console.log('Searching for exact address:', params.addressDetail);
          
          const searchQuery = `${params.addressDetail}, ${params.ward}, ${params.district}, ${params.province}`;
          const url = `${OSM_CONFIG.BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=1&addressdetails=1`;
          
          const data = await rateLimitedRequest(url);
          
          if (data && data.length > 0) {
            const result = data[0];
            if (result.lat && result.lon) {
              console.log('Found exact location for address:', result);
              
              // Cập nhật currentSelected
              setCurrentSelected({
                lat: result.lat,
                lon: result.lon,
                display_name: result.display_name,
                type: 'address_search',
                address: result.address
              });
              
              // Di chuyển map đến vị trí tìm được
              moveMapToLocation(result.lat, result.lon, 17);
              return;
            }
          }
        }

        // Ưu tiên 4: Sử dụng vị trí mặc định (TP.HCM)
        console.log('Using default location (TP.HCM)');
        const defaultLat = 10.8231;
        const defaultLon = 106.6297;
        
        setCurrentSelected({
          lat: defaultLat,
          lon: defaultLon,
          display_name: 'TP.HCM, Việt Nam',
          type: 'default_location'
        });
        
        // Di chuyển map đến vị trí mặc định
        moveMapToLocation(defaultLat, defaultLon, 10);
        
      } catch (error) {
        console.warn('Failed to initialize map location:', error);
        Alert.alert('Lỗi', 'Không thể khởi tạo vị trí map. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Chạy sau khi component mount và WebView đã sẵn sàng
    const timer = setTimeout(() => {
      initializeMapLocation();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [initialLat, initialLon, params.ward, params.district, params.province, params.addressDetail, rateLimitedRequest]);

  // Kiểm tra map ready sau khi component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Checking if map is ready...');
      checkMapReady();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [checkMapReady]);

  // Hàm tìm kiếm địa chỉ khi người dùng nhập
  const searchAddress = useCallback(async (addressText: string) => {
    if (!addressText || !params.ward || !params.district || !params.province) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ và đảm bảo đã chọn ward, district, province');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Searching for user input address:', addressText);
      
      // Thử tìm kiếm với địa chỉ người dùng nhập + ward + district + province
      const searchQuery = `${addressText}, ${params.ward}, ${params.district}, ${params.province}`;
      const url = `${OSM_CONFIG.BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=1&addressdetails=1`;
      
      const data = await rateLimitedRequest(url);
      
      if (data && data.length > 0) {
        const result = data[0];
        if (result.lat && result.lon) {
          console.log('Found location for user input:', result);
          
          // Di chuyển map đến vị trí tìm được
          moveMapToLocation(result.lat, result.lon, 17);
          
          // Cập nhật currentSelected
          setCurrentSelected({
            lat: result.lat,
            lon: result.lon,
            display_name: result.display_name,
            type: 'user_input_search',
            address: result.address
          });
          
          // Hiển thị thông báo thành công
          Alert.alert('Thành công', `Đã tìm thấy vị trí: ${result.display_name}`);
        }
      } else {
        // Không tìm thấy địa chỉ chính xác, thử tìm với ward center
        console.log('Exact address not found, searching for ward center');
        const wardQuery = `${params.ward}, ${params.district}, ${params.province}`;
        const wardUrl = `${OSM_CONFIG.BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(wardQuery)}&countrycodes=vn&limit=1&addressdetails=1`;
        
        const wardData = await rateLimitedRequest(wardUrl);
        
        if (wardData && wardData.length > 0) {
          const wardResult = wardData[0];
          console.log('Using ward center location:', wardResult);
          
          // Di chuyển map đến vị trí trung tâm ward
          moveMapToLocation(wardResult.lat, wardResult.lon, 15);
          
          // Cập nhật currentSelected với vị trí ward
          setCurrentSelected({
            lat: wardResult.lat,
            lon: wardResult.lon,
            display_name: `${addressText}, ${params.ward}`,
            type: 'ward_center',
            address: wardResult.address
          });
          
          Alert.alert('Thông báo', `Không tìm thấy địa chỉ chính xác. Đã di chuyển đến trung tâm ${params.ward}`);
        } else {
          Alert.alert('Lỗi', 'Không thể tìm thấy vị trí. Vui lòng kiểm tra lại thông tin địa chỉ.');
        }
      }
    } catch (error) {
      console.warn('Failed to search for user input address:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [params.ward, params.district, params.province, rateLimitedRequest]);

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
    // Validate coordinates
    const lat = Number(selectedLocation.lat);
    const lon = Number(selectedLocation.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Lỗi', 'Tọa độ không hợp lệ. Vui lòng thử lại.');
      return;
    }
    
    // If allowedBbox exists, ensure selected is inside
    if (allowedBbox) {
      const [latMin, latMax, lonMin, lonMax] = allowedBbox;
      if (!(lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax)) {
        Alert.alert(
          'Vị trí nằm ngoài phạm vi', 
          `Vị trí bạn chọn nằm ngoài phạm vi ${params.ward}. Vui lòng chọn vị trí trong phạm vi đã chọn hoặc quay lại chọn ward khác.`
        );
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
           <View style={styles.headerTitleContainer}>
             <Text style={styles.headerTitle}>Sửa Vị trí</Text>
             {params.ward && (
               <Text style={styles.wardInfo}>
                 {params.ward}, {params.district}
               </Text>
             )}
           </View>
           <TouchableOpacity 
             onPress={handleRequestLocation} 
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

                 {/* Address Input Field */}
         <View style={styles.addressInputContainer}>
           <View style={styles.inputRow}>
             <TextInput
               style={styles.addressInput}
               placeholder="Nhập địa chỉ của bạn"
               value={addressInput}
               onChangeText={setAddressInput}
               placeholderTextColor="#999"
               onSubmitEditing={() => searchAddress(addressInput)}
               returnKeyType="search"
               editable={!isLoading}
             />
             <TouchableOpacity 
               style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
               onPress={() => searchAddress(addressInput)}
               disabled={isLoading}
             >
               <Ionicons 
                 name={isLoading ? "hourglass" : "search"} 
                 size={20} 
                 color="#fff" 
               />
             </TouchableOpacity>
           </View>
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
          
          {/* Hiển thị thông tin vị trí hiện tại */}
          {currentSelected && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoText}>
                Vị trí: {currentSelected.display_name}
              </Text>
              <Text style={styles.locationInfoText}>
                Tọa độ: {Number(currentSelected.lat).toFixed(6)}, {Number(currentSelected.lon).toFixed(6)}
              </Text>
              {currentSelected.type && (
                <Text style={styles.locationInfoText}>
                  Loại: {currentSelected.type}
                </Text>
              )}
            </View>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <Ionicons name="hourglass" size={32} color="#3255FB" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            </View>
          )}

          {/* Debug button for testing */}
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log('Debug: Testing map movement to TP.HCM');
              moveMapToLocation(10.8231, 106.6297, 15);
            }}
          >
            <Text style={styles.debugButtonText}>Test Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomSafeArea} pointerEvents="box-none">
        <View style={[styles.footer, { bottom: keyboardHeight > 0 ? keyboardHeight : 16 }]} pointerEvents="box-none">
          {isOob ? (
            <Text style={{ color: '#b71c1c', marginBottom: 8, textAlign: 'center' }}>Vị trí đang chọn nằm ngoài phạm vi xã đã chọn.</Text>
          ) : null}
          <TouchableOpacity 
            style={[styles.confirm, isOob && { backgroundColor: '#ccc' }]} 
            onPress={onConfirm} 
            disabled={isOob || isLoading}
          >
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
   headerTitleContainer: {
     flex: 1,
     alignItems: 'center',
   },
   wardInfo: {
     fontSize: 12,
     color: '#666',
     marginTop: 2,
   },
  placeholder: {
    width: 40,
  },
  locationButton: {
    padding: 8,
  },
  locationButtonDisabled: {
    opacity: 0.5,
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
     flex: 1,
     marginRight: 8,
   },
   inputRow: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   searchButton: {
     backgroundColor: '#3255FB',
     padding: 12,
     borderRadius: 8,
     alignItems: 'center',
     justifyContent: 'center',
   },
   searchButtonDisabled: {
     backgroundColor: '#ccc',
   },
     wardInfoContainer: {
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
  },
  locationInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfoText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
