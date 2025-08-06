import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AddressService, { AddressData, Province } from '../services/addressService';

interface ProvinceListProps {
  provinces: Province[];
  onSelect: (province: Province) => void;
  error?: string | null;
  onRetry?: () => void;
  searchQuery: string;
}

const ProvinceList: React.FC<ProvinceListProps> = ({ 
  provinces, 
  onSelect, 
  error, 
  onRetry,
  searchQuery 
}) => {
  const filteredProvinces = useMemo(() => {
    if (!searchQuery) return provinces;
    return provinces.filter(province => 
      province.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [provinces, searchQuery]);

  const sections = useMemo(() => {
    const grouped = filteredProvinces.reduce((acc, province) => {
      let key = province.name.charAt(0).toUpperCase();
      if (key.match(/[0-9]/)) key = '#';
      if (!acc[key]) acc[key] = [];
      acc[key].push(province);
      return acc;
    }, {} as Record<string, Province[]>);

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([title, data]) => ({ title, data }));
  }, [filteredProvinces]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item} 
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            {item.name.includes('Thành phố') && (
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>TP</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        style={styles.list}
        stickySectionHeadersEnabled={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        contentContainerStyle={sections.length === 0 ? {flex: 1} : styles.listContent}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, {flex: 1, justifyContent: 'center'}]}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const AddressSelectorScreen = () => {
  const router = useRouter();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProvinces = useMemo(() => async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching provinces...');
      const data = await AddressService.getProvinces(searchQuery);
      console.log('Received provinces:', data);

      if (Array.isArray(data)) {
        setProvinces(data);
        if (data.length === 0) {
          setError('Không tìm thấy tỉnh/thành phố nào');
        }
      } else {
        setError('Dữ liệu không đúng định dạng');
      }
    } catch (err: any) {
      console.error('Error loading provinces:', err);
      setError(err.message || 'Không thể tải danh sách tỉnh/thành phố');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [searchQuery]);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  const handleProvinceSelect = (province: Province) => {
    // Navigate back with the selected province
    const addressData: Partial<AddressData> = {
      province,
      fullAddress: province.name,
      addressCode: {
        provinceCode: province.code,
        wardCode: ''
      }
    };
    router.back();
    // You'll need to implement a way to pass this data back to the previous screen
    // This could be done through a global state management solution or route params
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chọn địa chỉ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
        }}
      />
      
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm nhanh tỉnh thành, phường xã"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              loadProvinces(false);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                loadProvinces();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <Text style={[styles.tabText, styles.tabActive]}>Tỉnh/Thành</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3255FB" style={styles.loading} />
        ) : (
          <ProvinceList
            provinces={provinces}
            onSelect={handleProvinceSelect}
            error={error}
            onRetry={() => loadProvinces()}
            searchQuery={searchQuery}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  tabText: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#666',
  },
  tabActive: {
    color: '#3255FB',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#3255FB',
  },
  cityBadge: {
    backgroundColor: '#3255FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  cityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    flex: 1,
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 16,
  },
  loading: {
    marginTop: 16,
  },
});

export default AddressSelectorScreen;
