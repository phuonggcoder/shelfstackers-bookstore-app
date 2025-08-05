import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AddressService, { LocationItem } from '../services/addressService';

type AddressMode = '34-provinces' | '63-provinces';

interface AddressSelectionParams {
  type: 'province' | 'district' | 'ward';
  provinceCode?: string;
  districtCode?: string;
  title?: string;
  mode?: AddressMode;
}

const AddressSelection = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<AddressSelectionParams>();

  // Mode state: '34-provinces' or '63-provinces'
  const [mode, setMode] = useState<AddressMode>('63-provinces');
  const [searchText, setSearchText] = useState('');
  const [allItems, setAllItems] = useState<LocationItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LocationItem[]>([]);
  const [sectionedData, setSectionedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [isModeSwitching, setIsModeSwitching] = useState(false);

  // Load mode from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const storedMode = await AsyncStorage.getItem('address_mode');
      if (storedMode === '34-provinces' || storedMode === '63-provinces') {
        setMode(storedMode);
      }
    })();
  }, []);




  const getTitle = () => {
    switch (params.type) {
      case 'province':
        return t('selectProvince') || 'Tỉnh/Thành phố';
      case 'district':
        return t('selectDistrict') || 'Quận/Huyện';
      case 'ward':
        return t('selectWard') || 'Phường/Xã';
      default:
        return params.title || t('selectLocation') || 'Chọn địa điểm';
    }
  };

  // Fetch data based on step and mode
  const fetchData = async () => {
    setLoading(true);
    try {
      let result: LocationItem[] = [];
      if (params.type === 'province') {
        // Province list by mode
        result = await AddressService.getProvincesByMode(mode, searchText);
      } else if (params.type === 'district' && params.provinceCode && mode === '63-provinces') {
        result = await AddressService.getDistrictsByMode(params.provinceCode, mode, searchText);
      } else if (params.type === 'ward') {
        if (mode === '34-provinces' && params.provinceCode) {
          result = await AddressService.getWardsByMode(undefined, params.provinceCode, mode, searchText);
        } else if (mode === '63-provinces' && params.districtCode) {
          result = await AddressService.getWardsByMode(params.districtCode, undefined, mode, searchText);
        }
      }
      setAllItems(result);
      setFilteredItems(result);
      createSectionedData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSectionedData = (items: LocationItem[]) => {
    // Group items by first letter
    const grouped = items.reduce((acc, item) => {
      const firstLetter = item.name.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(item);
      return acc;
    }, {} as Record<string, LocationItem[]>);

    // Convert to section list format and sort
    const sections = Object.keys(grouped)
      .sort()
      .map(letter => ({
        title: letter,
        data: grouped[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }));

    setSectionedData(sections);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    
    if (text.trim() === '') {
      setFilteredItems(allItems);
      createSectionedData(allItems);
    } else {
      const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
      createSectionedData(filtered);
    }
  };

  const handleItemSelect = (item: LocationItem) => {
    setSelectedItem(item);
  };

  const handleItemPress = async (item: LocationItem) => {
    try {
      if (params.type === 'province') {
        await AsyncStorage.setItem('selected_province', JSON.stringify(item));
        await AsyncStorage.removeItem('selected_district');
        await AsyncStorage.removeItem('selected_ward');
        if (mode === '63-provinces') {
          // Next: district
          router.push({
            pathname: '/address-selection',
            params: {
              type: 'district',
              provinceCode: item.code,
              mode,
              title: t('selectDistrict') || 'Quận/Huyện',
            },
          } as any);
        } else {
          // Next: ward (skip district)
          router.push({
            pathname: '/address-selection',
            params: {
              type: 'ward',
              provinceCode: item.code,
              mode,
              title: t('selectWard') || 'Phường/Xã',
            },
          } as any);
        }
      } else if (params.type === 'district') {
        await AsyncStorage.setItem('selected_district', JSON.stringify(item));
        await AsyncStorage.removeItem('selected_ward');
        // Next: ward
        router.push({
          pathname: '/address-selection',
          params: {
            type: 'ward',
            provinceCode: params.provinceCode,
            districtCode: item.code,
            mode,
            title: t('selectWard') || 'Phường/Xã',
          },
        } as any);
      } else if (params.type === 'ward') {
        await AsyncStorage.setItem('selected_ward', JSON.stringify(item));
        router.back();
      }
    } catch (error) {
      console.error('Error saving selection:', error);
    }
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;

    try {
      // Store the selected item based on type
      if (params.type === 'province') {
        await AsyncStorage.setItem('selected_province', JSON.stringify(selectedItem));
        // Clear district and ward when province changes
        await AsyncStorage.multiRemove(['selected_district', 'selected_ward']);
        
        // Auto-navigate to district selection
        (router as any).push(`/address-selection?type=district&provinceCode=${selectedItem.id}&title=${encodeURIComponent('Quận/Huyện')}`);
      } else if (params.type === 'district') {
        await AsyncStorage.setItem('selected_district', JSON.stringify(selectedItem));
        // Clear ward when district changes
        await AsyncStorage.removeItem('selected_ward');
        
        // Auto-navigate to ward selection
        (router as any).push(`/address-selection?type=ward&districtCode=${selectedItem.id}&provinceCode=${params.provinceCode}&title=${encodeURIComponent('Phường/Xã')}`);
      } else if (params.type === 'ward') {
        await AsyncStorage.setItem('selected_ward', JSON.stringify(selectedItem));
        
        // Go back to add-address page after selecting ward
        router.back();
      }
    } catch (error) {
      console.error('Error saving selection:', error);
    }
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        selectedItem?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handleItemPress(item)}
    >
      <Text style={[
        styles.itemText,
        selectedItem?.id === item.id && styles.selectedItemText
      ]}>
        {item.name}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );

  // Fetch data when step or mode changes
  useEffect(() => {
    fetchData();
  }, [params.type, params.provinceCode, params.districtCode, mode]);

  // Handle mode toggle (only at province step)
  const handleModeToggle = async (newMode: boolean) => {
    setIsModeSwitching(true);
    const selectedMode: AddressMode = newMode ? '34-provinces' : '63-provinces';
    try {
      await AsyncStorage.setItem('address_mode', selectedMode);
      await AsyncStorage.multiRemove(['selected_province', 'selected_district', 'selected_ward']);
      setMode(selectedMode);
      setSelectedItem(null);
      setAllItems([]);
      setFilteredItems([]);
      setSectionedData([]);
      // Reload province list
      router.replace({
        pathname: '/address-selection',
        params: {
          type: 'province',
          mode: selectedMode,
        },
      } as any);
    } catch (error) {
      console.error('Error switching address mode:', error);
    } finally {
      setIsModeSwitching(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchLocation') || 'Tìm nhanh tỉnh thành, quận huyện, phường xã'}
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading || isModeSwitching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3255FB" />
            <Text style={styles.loadingText}>{isModeSwitching ? (t('switchingMode') || 'Đang chuyển chế độ...') : (t('loading') || 'Đang tải...')}</Text>
          </View>
        ) : (
          <SectionList
            sections={sectionedData}
            keyExtractor={(item, idx) => `${item.id}_${idx}`}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={true}
          />
        )}
      </View>

      {/* Confirm Button - Only show for ward selection or when user wants to confirm */}
      {selectedItem && params.type === 'ward' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              {t('confirm') || 'Xác nhận'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mode Toggle - Only show at province step */}
      {params.type === 'province' && (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#f5f5f5', borderTopWidth: 1, borderTopColor: '#e0e0e0'}}>
          <Text style={{marginHorizontal: 8, fontSize: 14, color: '#333'}}>63 Tỉnh/Thành</Text>
          <TouchableOpacity onPress={() => handleModeToggle(mode !== '34-provinces')}>
            <View style={{width: 50, height: 30, backgroundColor: '#e0e0e0', borderRadius: 16, justifyContent: 'center'}}>
              <View style={{width: 24, height: 24, borderRadius: 12, backgroundColor: mode === '34-provinces' ? '#3255FB' : '#fff', marginLeft: mode === '34-provinces' ? 24 : 2, borderWidth: 1, borderColor: '#ccc'}} />
            </View>
          </TouchableOpacity>
          <Text style={{marginHorizontal: 8, fontSize: 14, color: '#333'}}>34 Tỉnh/Thành</Text>
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
  list: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  itemText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedItemText: {
    color: '#3255FB',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddressSelection;
