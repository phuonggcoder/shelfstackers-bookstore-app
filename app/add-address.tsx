import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { mapNominatimAddress, stripPrefixes } from '../utils/addressMapping';

const AddAddress = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { showErrorToast } = useUnifiedModal();
  const [loading, setLoading] = useState(false);
  const [addressType, setAddressType] = useState<'office' | 'home'>('office');
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  
  // Debug log để theo dõi addressDetail state
  useEffect(() => {
    console.log('[AddAddress] addressDetail state changed:', addressDetail);
  }, [addressDetail]);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  
  // Load selectedAddress from storage on mount
  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem('tempSelectedAddress');
        if (savedAddress) {
          const parsedAddress = JSON.parse(savedAddress);
          console.log('[AddAddress] Restored selectedAddress from storage:', parsedAddress);
          setSelectedAddress(parsedAddress);
          setAddressManuallySelected(true);
        }
      } catch (e) {
        console.warn('[AddAddress] Failed to load selectedAddress from storage:', e);
      }
    };
    
    loadSelectedAddress();
    console.log('[AddAddress] Component mounted/params changed');
    
    return () => {
      console.log('[AddAddress] Component unmounting or params changing');
    };
  }, []);

  // Save selectedAddress to storage whenever it changes
  useEffect(() => {
    const saveSelectedAddress = async () => {
      try {
        if (selectedAddress) {
          await AsyncStorage.setItem('tempSelectedAddress', JSON.stringify(selectedAddress));
          console.log('[AddAddress] Saved selectedAddress to storage');
        } else {
          await AsyncStorage.removeItem('tempSelectedAddress');
          console.log('[AddAddress] Removed selectedAddress from storage');
        }
      } catch (e) {
        console.warn('[AddAddress] Failed to save selectedAddress to storage:', e);
      }
    };
    
    saveSelectedAddress();
  }, [selectedAddress]);
  const [houseNumber, setHouseNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  // when true, do not let map reverse-geocode overwrite province/district/ward
  const [addressManuallySelected, setAddressManuallySelected] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [processedOsmParam, setProcessedOsmParam] = useState<string | null>(null);
  const params = useLocalSearchParams();


  const latParam = params.lat as string | undefined;
  const lngParam = params.lng as string | undefined;
  const osmParam = params.osm as string | undefined;
  const wardParam = params.ward as string | undefined;
  const districtParam = params.district as string | undefined;
  const provinceParam = params.province as string | undefined;
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapSearch, setShowMapSearch] = useState(false);
  const [mapInitialPos, setMapInitialPos] = useState<{ lat: number; lon: number } | null>(null);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  // use refs to guard duplicate processing reliably
  const lastProcessedRef = useRef<string | null>(null);

  // Handle ward, district, province from params (from address-detail page) - OUTSIDE useEffect
  useEffect(() => {
    if (wardParam && districtParam && provinceParam) {
      const wardObj = { code: wardParam, name: wardParam, districtId: districtParam } as any;
      const districtObj = { code: districtParam, name: districtParam, provinceId: provinceParam } as any;
      const provinceObj = { code: provinceParam, name: provinceParam } as any;
      
      console.log('[AddAddress] Setting ward/district/province from params:', { wardParam, districtParam, provinceParam });
      
      setSelectedAddress(prev => ({
        ...prev,
        province: provinceObj,
        district: districtObj,
        ward: wardObj,
        fullAddress: `${wardParam}, ${districtParam}, ${provinceParam}`,
      } as any));
      setAddressManuallySelected(true); // Đánh dấu là đã chọn thủ công
    }
  }, [wardParam, districtParam, provinceParam]);

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

  useEffect(() => {
    // determine incoming coordinates (priority: osmParam payload > latParam/lngParam)
    let incomingLat: number | null = null;
    let incomingLng: number | null = null;
    if (osmParam) {
      try {
        const decoded = decodeURIComponent(osmParam);
        const payload = JSON.parse(decoded);
        if (payload && payload.lat && payload.lng) {
          incomingLat = Number(payload.lat);
          incomingLng = Number(payload.lng);
        }
      } catch (e) {
        console.warn('Could not parse osm param', e);
      }
    }
    if ((incomingLat === null || incomingLng === null) && latParam && lngParam) {
      incomingLat = Number(latParam);
      incomingLng = Number(lngParam);
    }

    // guard against duplicate processing (synchronous, reliable)
    const key = `${incomingLat?.toFixed(6) || 'null'},${incomingLng?.toFixed(6) || 'null'},${osmParam || 'null'}`;
    if (lastProcessedRef.current === key) {
      console.log('[AddAddress] Duplicate processing detected, skipping:', key);
      return;
    }
    lastProcessedRef.current = key;

    // Check if addressDetail is provided in the payload (from address-detail page or map picker)
    const payloadInfo = osmParam ? (() => {
      try {
        const decoded = decodeURIComponent(osmParam);
        const payload = JSON.parse(decoded);
        return {
          addressDetail: payload.addressDetail || '',
          addressDetailOnly: payload.addressDetailOnly || false,
          lat: payload.lat || null,
          lng: payload.lng || null
        };
      } catch (e) {
        return { addressDetail: '', addressDetailOnly: false, lat: null, lng: null };
      }
    })() : { addressDetail: '', addressDetailOnly: false, lat: null, lng: null };
    
    // Nếu chỉ cập nhật addressDetail (từ map picker với preserveAddress)
    if (payloadInfo.addressDetailOnly) {
      // Guard để tránh xử lý lại cùng một osmParam
      if (processedOsmParam === osmParam) {
        console.log('[AddAddress] Already processed this osmParam, skipping');
        return;
      }
      
      console.log('[AddAddress] Updating addressDetail only, preserving existing ward/district/province');
      console.log('[AddAddress] payloadInfo:', payloadInfo);
      
      // Đánh dấu đã xử lý osmParam này
      setProcessedOsmParam(osmParam || null);
      
      // Cập nhật addressDetail
      console.log('[AddAddress] Setting addressDetail to:', payloadInfo.addressDetail);
      setAddressDetail(payloadInfo.addressDetail);
      
      // Đảm bảo selectedAddress không bị mất
      console.log('[AddAddress] Current selectedAddress before update:', {
        hasSelectedAddress: !!selectedAddress,
        fullAddress: selectedAddress?.fullAddress,
        province: selectedAddress?.province?.name,
        district: selectedAddress?.district?.name,
        ward: selectedAddress?.ward?.name
      });
      
      // Force component re-render
      setForceUpdate(prev => prev + 1);
      
      // Cập nhật coordinates nếu có
      if (payloadInfo.lat && payloadInfo.lng) {
        setPickedCoords({ lat: payloadInfo.lat, lng: payloadInfo.lng });
        console.log('[AddAddress] Updated coordinates:', { lat: payloadInfo.lat, lng: payloadInfo.lng });
      }
      
      return;
    }

    if (incomingLat === null || incomingLng === null) {
      // If no coordinates but we have ward params, just return (ward params already handled above)
      return;
    }

    setPickedCoords({ lat: incomingLat, lng: incomingLng });

    // call Nominatim reverse to populate addressDetail if empty and resolve admin units
    (async () => {
      try {
        console.log('[AddAddress] osm param detected', { lat: incomingLat, lng: incomingLng });
        const nom = await (await import('../services/osmService')).reverseGeocodeNominatim(incomingLat, incomingLng);
        console.log('[AddAddress] nominatim result', nom && { display_name: nom.display_name, address: nom?.address });
        // Extract street/house from nominatim and set addressDetail if empty
        const nomAddr = nom && nom.address ? nom.address : null;
        const detectedRoad = nomAddr ? (nomAddr.road || nomAddr.pedestrian || nomAddr.cycleway || nomAddr.residential || nomAddr.street || '') : '';
        const detectedHouse = nomAddr ? (nomAddr.house_number || nomAddr.housenumber || '') : '';
        if (detectedRoad && !streetName) setStreetName(detectedRoad);
        if (detectedHouse && !houseNumber) setHouseNumber(detectedHouse);
        
        if (payloadInfo.addressDetail && payloadInfo.addressDetail.trim()) {
          setAddressDetail(payloadInfo.addressDetail);
        } else if ((!addressDetail || !addressDetail.trim()) && (detectedRoad || detectedHouse)) {
          setAddressDetail([detectedHouse, detectedRoad].filter(Boolean).join(' '));
        }
        
        // Nếu không có ward/district/province params, chỉ cập nhật addressDetail
        // không cập nhật ward/district/province từ OSM
        if (!wardParam && !districtParam && !provinceParam) {
          console.log('[AddAddress] Only updating addressDetail, preserving existing ward/district/province');
          return;
        }

        const addr = nomAddr;
        if (!addr) {
          return;
        }

        // Map Nominatim address to Vietnamese administrative units
        const { province: provinceName, district: districtName, ward: wardName } = mapNominatimAddress(addr);

        const normalize = (s?: string | null) => {
          if (!s) return '';
          return stripPrefixes(s);
        };

        try {
          let resolvedProvince: any = null;
          let resolvedDistrict: any = null;
          let resolvedWard: any = null;

          if (provinceName) {
            try {
              const provinces = await AddressService.getProvinces(provinceName);
              const pn = normalize(provinceName);
              resolvedProvince = provinces.find((p: any) => normalize(p.name) === pn) || provinces.find((p: any) => normalize(p.name).includes(pn) || pn.includes(normalize(p.name)));
              if (!resolvedProvince) {
                const search = await AddressService.searchAll(provinceName);
                resolvedProvince = search.find((s: any) => s.level === 'province');
              }
            } catch (e) {
              console.warn('[AddAddress] province resolution failed', e);
            }
          }

          if (districtName) {
            try {
              if (resolvedProvince && resolvedProvince.code) {
                const districts = await AddressService.getDistricts(resolvedProvince.code, districtName);
                const dn = normalize(districtName);
                resolvedDistrict = districts.find((d: any) => normalize(d.name) === dn) || districts.find((d: any) => normalize(d.name).includes(dn) || dn.includes(normalize(d.name)));
              }
              if (!resolvedDistrict) {
                const search = await AddressService.searchAll(districtName);
                resolvedDistrict = search.find((s: any) => s.level === 'district');
              }
            } catch (e) {
              console.warn('[AddAddress] district resolution failed', e);
            }
          }

          if (wardName) {
            try {
              if (resolvedDistrict && resolvedDistrict.code) {
                const wards = await AddressService.getWards(resolvedDistrict.code, wardName);
                const wn = normalize(wardName);
                resolvedWard = wards.find((w: any) => normalize(w.name) === wn) || wards.find((w: any) => normalize(w.name).includes(wn) || wn.includes(normalize(w.name)));
              }
              if (!resolvedWard) {
                const search = await AddressService.searchAll(wardName);
                resolvedWard = search.find((s: any) => s.level === 'ward');
              }
            } catch (e) {
              console.warn('[AddAddress] ward resolution failed', e);
            }
          }

          const provinceObj = resolvedProvince || (provinceName ? { code: provinceName, name: provinceName } : null);
          const districtObj = resolvedDistrict || (districtName ? { code: districtName, name: districtName, provinceId: provinceObj?.code } : null);
          const wardObj = resolvedWard || (wardName ? { code: wardName, name: wardName, districtId: districtObj?.code, fullName: wardName } : null);

          const newSelected = {
            province: provinceObj || undefined,
            district: districtObj || undefined,
            ward: wardObj || undefined,
            fullAddress: nom.display_name || undefined,
          };
          console.log('[AddAddress] resolved address objects', newSelected);
          setSelectedAddress(prev => ({
            ...prev,
            // Chỉ cập nhật nếu chưa có hoặc không phải manual selection
            province: (addressManuallySelected && prev?.province) ? prev.province : (newSelected.province || prev?.province),
            district: (addressManuallySelected && prev?.district) ? prev.district : (newSelected.district || prev?.district),
            ward: (addressManuallySelected && prev?.ward) ? prev.ward : (newSelected.ward || prev?.ward),
            fullAddress: (addressManuallySelected && prev?.fullAddress) ? prev.fullAddress : (newSelected.fullAddress || prev?.fullAddress),
          } as any));
        } catch (e) {
          console.warn('Failed to resolve administrative units', e);
          const province = provinceName ? { code: provinceName, name: provinceName } : null;
          const district = districtName ? { code: districtName, name: districtName } : null;
          const ward = wardName ? { code: wardName, name: wardName } : null;
          console.log('[AddAddress] fallback address names', { province, district, ward });
          setSelectedAddress(prev => ({
            ...prev,
            province: (addressManuallySelected && prev?.province) ? prev.province : (province || prev?.province),
            district: (addressManuallySelected && prev?.district) ? prev.district : (district || prev?.district),
            ward: (addressManuallySelected && prev?.ward) ? prev.ward : (ward || prev?.ward),
            fullAddress: (addressManuallySelected && prev?.fullAddress) ? prev.fullAddress : ((nom && nom.display_name) || prev?.fullAddress),
          } as any));
        }
      } catch (e) {
        console.warn('Failed to reverse nominatim', e);
        // keep current state if reverse fails
      }
    })();
  }, [latParam, lngParam, osmParam, addressManuallySelected, houseNumber, streetName, processedOsmParam]);

  const handleAddressChange = async (address: any) => {
    // user explicitly selected address parts (province/district/ward) => treat as manual selection
    setSelectedAddress(address);
    setAddressManuallySelected(true);
    
    // Không tự động mở map picker khi chọn địa chỉ
    // Map picker chỉ mở khi người dùng nhập địa chỉ chi tiết
  };

  const handleMapSearchSelect = (res: { lat: number; lon: number; display_name: string; address?: any }) => {
    setPickedCoords({ lat: res.lat, lng: res.lon });
    // fill street/house when available
    const nomAddr = res.address || {};
    const detectedRoad = nomAddr.road || nomAddr.pedestrian || nomAddr.residential || nomAddr.street || '';
    const detectedHouse = nomAddr.house_number || nomAddr.housenumber || '';
    if (detectedRoad) setStreetName(prev => prev || detectedRoad);
    if (detectedHouse) setHouseNumber(prev => prev || detectedHouse);
    
    // Map address using the same helper function
    const { province, district, ward } = mapNominatimAddress(nomAddr);
    
    // set full address preview with mapped administrative units
    setSelectedAddress(prev => ({ 
      ...(prev || {}), 
      fullAddress: prev?.fullAddress || res.display_name,
      province: prev?.province || (province ? { code: province, name: province } : undefined),
      district: prev?.district || (district ? { code: district, name: district } : undefined),
      ward: prev?.ward || (ward ? { code: ward, name: ward } : undefined)
    } as any));
    setShowMapSearch(false);
  };

  const handleAddressSuggestionSelect = (suggestion: any) => {
    setPickedCoords({ lat: suggestion.lat, lng: suggestion.lon });
    setAddressDetail(suggestion.display_name);
    setShowAddressSuggestions(false);
  };

  // Hàm mở map picker khi nhập địa chỉ chi tiết
  const openMapPicker = async () => {
    if (!selectedAddress?.ward?.name) {
      showErrorToast(t('error'), 'Vui lòng chọn phường/xã trước');
      return;
    }

    try {
      let searchQuery = '';
      let initialLat = 0;
      let initialLng = 0;

      if (addressDetail.trim()) {
        // Nếu có địa chỉ chi tiết, tìm kiếm theo đó
        searchQuery = `${addressDetail}, ${selectedAddress.ward.name}, ${selectedAddress.district?.name}, ${selectedAddress.province?.name}`;
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=1&addressdetails=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)' } });
        const data = await res.json();
        
        if (data && data.length) {
          initialLat = Number(data[0].lat);
          initialLng = Number(data[0].lon);
        }
      }

      // Nếu không tìm thấy hoặc không có địa chỉ chi tiết, sử dụng vị trí trung tâm ward
      if (!initialLat && !initialLng) {
        const wardQuery = `${selectedAddress.ward.name}, ${selectedAddress.district?.name}, ${selectedAddress.province?.name}`;
        const wardUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(wardQuery)}&countrycodes=vn&limit=1`;
        const wardRes = await fetch(wardUrl, { headers: { 'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)' } });
        const wardData = await wardRes.json();
        
        if (wardData && wardData.length) {
          initialLat = Number(wardData[0].lat);
          initialLng = Number(wardData[0].lon);
        }
      }

      // Fallback: sử dụng vị trí hiện tại nếu có
      if (!initialLat && !initialLng) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            initialLat = location.coords.latitude;
            initialLng = location.coords.longitude;
          }
        } catch (e) {
          console.warn('Failed to get current location', e);
        }
      }

      // Tạo bbox giới hạn trong phạm vi ward
      const latMin = initialLat - 0.01;
      const latMax = initialLat + 0.01;
      const lonMin = initialLng - 0.01;
      const lonMax = initialLng + 0.01;
      const bboxParam = encodeURIComponent(JSON.stringify([latMin, latMax, lonMin, lonMax]));
      
      router.push({ 
        pathname: '/map-picker', 
        params: { 
          lat: String(initialLat), 
          lng: String(initialLng), 
          allowed: bboxParam,
          ward: selectedAddress.ward.name,
          district: selectedAddress.district?.name,
          province: selectedAddress.province?.name,
          addressDetail: addressDetail.trim()
        } 
      });
    } catch (e) {
      console.warn('[AddAddress] failed to open map picker', e);
      showErrorToast(t('error'), 'Không thể mở bản đồ. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      showErrorToast(t('error'), t('pleaseLoginToAddAddress'));
      return;
    }

    // Validate fields strictly as backend expects
    if (!receiverName.trim()) {
      Alert.alert(t('error'), t('pleaseEnterFullName'));
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert(t('error'), t('pleaseEnterPhoneNumber'));
      return;
    }
    // Vietnamese phone validation (10 digits, valid prefix)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const validPrefixes = [
      '086','096','097','098','032','033','034','035','036','037','038','039',
      '088','091','094','083','084','085','081','082',
      '089','090','093','070','079','077','076','078',
      '092','056','058','099','059',
    ];
    if (cleanPhone.length !== 10 || !validPrefixes.some(prefix => cleanPhone.startsWith(prefix))) {
      Alert.alert(t('error'), t('invalidPhoneNumber'));
      return;
    }
    if (!selectedAddress || !selectedAddress.province || !selectedAddress.district || !selectedAddress.ward) {
      showErrorToast(t('error'), t('pleaseSelectCompleteAddress'));
      return;
    }
    if (!addressDetail.trim()) {
      Alert.alert(t('error'), t('pleaseEnterDetailedAddress'));
      return;
    }
    // Validate province/district/ward are objects with code+name
    const { province, district, ward } = selectedAddress;
    if (!province.code || !province.name) {
      Alert.alert(t('error'), t('pleaseSelectProvince'));
      return;
    }
    if (!district.code || !district.name) {
      Alert.alert(t('error'), t('pleaseSelectDistrict'));
      return;
    }
    if (!ward.code || !ward.name) {
      Alert.alert(t('error'), t('pleaseSelectWard'));
      return;
    }

    setLoading(true);
    try {
      // Prepare address payload according to backend schema
      const addressPayload: any = {
        fullName: receiverName.trim(),
        phone: cleanPhone,
        street: addressDetail.trim(),
        province: {
          code: province.code,
          name: province.name,
          type: province.type,
          typeText: province.typeText,
          slug: province.slug,
          autocompleteType: province.autocompleteType || 'oapi'
        },
        district: {
          code: district.code,
          name: district.name,
          provinceId: province.code,
          type: district.type,
          typeText: district.typeText,
          autocompleteType: district.autocompleteType || 'oapi'
        },
        ward: {
          code: ward.code,
          name: ward.name,
          districtId: district.code,
          type: ward.type,
          typeText: ward.typeText,
          autocompleteType: ward.autocompleteType || 'oapi',
          fullName: ward.fullName,
          path: ward.path
        },
        isDefault: false,
        type: addressType,
        note: ''
      };

      // Add location data if coordinates are available
      if (pickedCoords) {
        addressPayload.location = {
          lat: pickedCoords.lat,
          lng: pickedCoords.lng
        };
      }

      // Add OSM data if available from Nominatim
      if (pickedCoords && selectedAddress.fullAddress) {
        addressPayload.osm = {
          lat: pickedCoords.lat,
          lng: pickedCoords.lng,
          displayName: selectedAddress.fullAddress,
          raw: {
            display_name: selectedAddress.fullAddress,
            lat: pickedCoords.lat,
            lon: pickedCoords.lng
          }
        };
      }

      await AddressService.addAddress(token, addressPayload);
      
      // Clear temp storage on success
      try {
        await AsyncStorage.removeItem('tempSelectedAddress');
        console.log('[AddAddress] Cleared temp storage on success');
      } catch (e) {
        console.warn('[AddAddress] Failed to clear temp storage:', e);
      }
      
      Alert.alert(t('success'), t('addressAddedSuccessfully'), [
        {
          text: t('ok'),
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Create address failed:', error);
      showErrorToast(t('error'), t('cannotAddAddressPleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  // No need to format fullAddress on FE, BE will handle it
  const formatAddress = () => {
    if (!selectedAddress) return '';
    const parts = [
      [houseNumber, streetName].filter(Boolean).join(' '),
      selectedAddress.ward?.name,
      selectedAddress.district?.name,
      selectedAddress.province?.name
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={undefined}
    >
      <View style={[styles.headerContainer, { marginTop: 24 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← {t('goBack')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('newAddress')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.formContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('recipientInformation')}</Text>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder={t('fullName')}
            style={styles.input}
            value={receiverName}
            onChangeText={setReceiverName}
          />
          <TextInput
            placeholder={t('phoneNumber')}
            keyboardType="phone-pad"
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('addressInformation')}</Text>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AddressSelector value={selectedAddress || undefined} onChange={handleAddressChange} />
              {/* Debug info */}
              <Text style={{ fontSize: 10, color: 'blue', marginTop: 4 }}>
                Debug: selectedAddress={selectedAddress ? 'SET' : 'NULL'} | 
                fullAddress="{selectedAddress?.fullAddress || 'NONE'}"
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ chi tiết</Text>
          
          <TouchableOpacity
            style={styles.addressDetailContainer}
            onPress={() => {
              if (selectedAddress?.ward?.name) {
                router.push({
                  pathname: '/address-detail',
                  params: {
                    ward: selectedAddress.ward.name,
                    district: selectedAddress.district?.name || '',
                    province: selectedAddress.province?.name || ''
                  }
                });
              }
            }}
            disabled={!selectedAddress?.ward?.name}
          >
            <View style={styles.addressDetailInputContainer}>
              <Text style={addressDetail ? styles.addressDetailText : styles.addressDetailPlaceholder}>
                {addressDetail || "Tên đường, Toà nhà, Số nhà."}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
            {/* Debug info */}
            <Text style={{ fontSize: 10, color: 'red', marginTop: 4 }}>
              Debug: addressDetail="{addressDetail}" | forceUpdate={forceUpdate}
            </Text>
          </TouchableOpacity>



          {/* Hướng dẫn sử dụng */}
          {selectedAddress?.ward?.name && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>
                Hướng dẫn sử dụng
              </Text>
              <View style={styles.suggestionsList}>
                <View style={styles.suggestionItem}>
                  <Ionicons name="information-circle" size={16} color="#3255FB" style={styles.suggestionIcon} />
                  <Text style={styles.suggestionText}>
                    1. Nhấn vào ô "Địa chỉ chi tiết" để tìm kiếm
                  </Text>
                </View>
                <View style={styles.suggestionItem}>
                  <Ionicons name="information-circle" size={16} color="#3255FB" style={styles.suggestionIcon} />
                  <Text style={styles.suggestionText}>
                    2. Nhập số nhà, tên đường để tìm vị trí chính xác
                  </Text>
                </View>
                <View style={styles.suggestionItem}>
                  <Ionicons name="information-circle" size={16} color="#3255FB" style={styles.suggestionIcon} />
                  <Text style={styles.suggestionText}>
                    3. Chọn địa chỉ và xác nhận vị trí trên bản đồ
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Nhấn vào ô địa chỉ chi tiết để tìm kiếm và chọn vị trí chính xác
            </Text>
          </View>
        </View>

        {formatAddress() && (
          <View style={styles.addressPreview}>
            <Text style={styles.previewTitle}>{t('selectedAddress')}:</Text>
            <Text style={styles.previewText}>{formatAddress()}</Text>
          </View>
        )}

        {pickedCoords && (
          <View style={[styles.addressPreview, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.previewTitle}>Vị trí đã chọn:</Text>
            <Text style={styles.previewText}>Lat: {pickedCoords.lat.toFixed(6)}, Lng: {pickedCoords.lng.toFixed(6)}</Text>
          </View>
        )}

        <View style={styles.typeContainer}>
          <Text style={styles.switchLabel}>{t('addressType')}</Text>
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
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
        </View>
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {t('complete')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  body: { 
    flex: 1 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { 
    fontSize: 16, 
    color: '#3255FB' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  formContainer: { 
    padding: 16 
  },
  section: {
    marginBottom: 24,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    marginTop: 16,
    color: '#000' 
  },
  inputGroup: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16 
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
    backgroundColor: '#fff',
  },

  addressPreview: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3255FB',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  switchContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: { 
    fontSize: 16, 
    color: '#000' 
  },
  typeContainer: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24 
  },
  typeButtons: { 
    flexDirection: 'row', 
    marginTop: 12 
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  typeButtonActive: { 
    backgroundColor: '#3255FB', 
    borderColor: '#3255FB' 
  },
  typeText: { 
    fontSize: 14, 
    color: '#666' 
  },
  typeTextActive: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#3255FB',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  addressSelector: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  addressSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  addressSelectorContent: {
    flex: 1,
  },
  addressSelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressSelectorValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  addressSelectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  addressDetailContainer: {
    marginBottom: 12,
  },
  addressDetailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },
  addressDetailInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  suggestionsContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  addressDetailButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  addressDetailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressDetailText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  addressDetailPlaceholder: {
    color: '#999',
  },
});

export default AddAddress;
