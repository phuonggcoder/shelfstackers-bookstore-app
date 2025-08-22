import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface AddressSuggestion {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

const AddressDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);

  const ward = params.ward as string;
  const district = params.district as string;
  const province = params.province as string;

  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Tìm kiếm trong phạm vi ward đã chọn
      const searchArea = `${ward}, ${district}, ${province}`;
      const fullQuery = `${query}, ${searchArea}`;
      
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fullQuery)}&countrycodes=vn&limit=15&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)'
        }
      });
      
      const data = await response.json();
      
      // Lọc kết quả để chỉ hiển thị những địa chỉ trong phạm vi ward
      const filteredData = data.filter((item: AddressSuggestion) => {
        const address = item.address || {};
        const itemWard = address.suburb || address.city_district || '';
        const itemDistrict = address.city || '';
        const displayName = item.display_name || '';
        
        // Kiểm tra xem địa chỉ có thuộc ward và district đã chọn không
        const inSelectedArea = itemWard.includes(ward) || 
                              itemDistrict.includes(district) ||
                              displayName.includes(ward) || 
                              displayName.includes(district);
        
        return inSelectedArea;
      });
      
      // Nếu không có kết quả lọc được, vẫn hiển thị một số kết quả gốc
      if (filteredData.length === 0 && data.length > 0) {
        setSuggestions(data.slice(0, 5));
      } else {
        setSuggestions(filteredData);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load gợi ý ban đầu khi vào trang
  useEffect(() => {
    loadDefaultSuggestions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchAddress(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (searchQuery.length === 0) {
      // Hiển thị gợi ý mặc định khi chưa nhập gì
      loadDefaultSuggestions();
    }
  }, [searchQuery]);

  const loadDefaultSuggestions = async () => {
    setLoading(true);
    try {
      const searchArea = `${ward}, ${district}, ${province}`;
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchArea)}&countrycodes=vn&limit=10&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)'
        }
      });
      
      const data = await response.json();
      setSuggestions(data.slice(0, 5));
    } catch (error) {
      console.error('Error loading default suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
    
    // Chỉ lấy số nhà và tên đường, không lấy full address
    const address = suggestion.address || {};
    const houseNumber = address.house_number || '';
    const road = address.road || '';
    const addressDetail = [houseNumber, road].filter(Boolean).join(' ');
    
    // Chuyển đến map picker với thông tin đã chọn
    // Chỉ truyền addressDetail, không thay đổi ward/district/province
    const payload = encodeURIComponent(JSON.stringify({
      lat: suggestion.lat,
      lng: suggestion.lon,
      display_name: suggestion.display_name,
      addressDetail: addressDetail || suggestion.display_name
    }));
    
    router.push({
      pathname: '/map-picker',
      params: {
        lat: suggestion.lat,
        lng: suggestion.lon,
        ward,
        district,
        province,
        addressDetail: addressDetail || suggestion.display_name,
        returnTo: 'address-detail',
        preserveAddress: 'true' // Flag để giữ nguyên ward/district/province
      }
    });
  };

  const handleContinueWithInput = () => {
    if (!searchQuery.trim()) return;
    
    // Tạo tọa độ mặc định cho ward (sẽ được cập nhật trong map picker)
    const defaultLat = 10.8760444; // Tọa độ mặc định cho Hồ Chí Minh
    const defaultLng = 106.6365252;
    
    router.push({
      pathname: '/map-picker',
      params: {
        lat: String(defaultLat),
        lng: String(defaultLng),
        ward,
        district,
        province,
        addressDetail: searchQuery.trim(),
        returnTo: 'address-detail',
        preserveAddress: 'true',
        manualInput: 'true' // Flag để biết đây là input thủ công
      }
    });
  };

  const renderSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons name="location" size={20} color="#3255FB" />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle} numberOfLines={2}>
          {item.display_name}
        </Text>
        <Text style={styles.suggestionSubtitle}>
          {item.address?.house_number && `Số ${item.address.house_number}`}
          {item.address?.road && `, ${item.address.road}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ chi tiết</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Ward Info */}
      <View style={styles.wardInfo}>
        <Text style={styles.wardInfoText}>
          Tìm kiếm trong: {ward}, {district}, {province}
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập số nhà, tên đường..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3255FB" />
            <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
          </View>
        ) : suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.place_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          />
                 ) : searchQuery.length >= 2 ? (
           <View style={styles.emptyContainer}>
             <Ionicons name="search-outline" size={64} color="#ccc" />
             <Text style={styles.emptyText}>Không tìm thấy địa chỉ</Text>
             <Text style={styles.emptySubtext}>
               Thử tìm kiếm với từ khóa khác
             </Text>
           </View>
        ) : (
          <View style={styles.initialContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.initialText}>Nhập địa chỉ để tìm kiếm</Text>
            <Text style={styles.initialSubtext}>
              Ví dụ: số nhà, tên đường, tên khu vực
            </Text>
          </View>
        )}
             </View>

       {/* Footer với nút tiếp tục */}
       {searchQuery.trim().length >= 5 && (
         <View style={styles.footer}>
           <TouchableOpacity
             style={styles.continueButton}
             onPress={handleContinueWithInput}
           >
             <Text style={styles.continueButtonText}>
               Tiếp theo
             </Text>
           </TouchableOpacity>
         </View>
       )}
     </SafeAreaView>
   );
 };

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
  placeholder: {
    width: 40,
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
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
  suggestionsList: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  initialText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  initialSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonIcon: {
    marginRight: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

export default AddressDetail; 
