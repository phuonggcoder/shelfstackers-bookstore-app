import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export interface SearchOptions {
  query: string;
  includeLocal: boolean;
  includeGoogle: boolean;
  maxResults: number;
  sortBy: 'relevance' | 'title' | 'price' | 'rating';
  order: 'asc' | 'desc';
  filterFree: boolean;
  filterAvailable: boolean;
}

interface AdvancedSearchBarProps {
  onSearch: (options: SearchOptions) => void;
  placeholder?: string;
  initialOptions?: Partial<SearchOptions>;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  placeholder = 'Tìm kiếm sách...',
  initialOptions,
}) => {
  const [query, setQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    includeLocal: true,
    includeGoogle: true,
    maxResults: 20,
    sortBy: 'relevance',
    order: 'desc',
    filterFree: false,
    filterAvailable: false,
    ...initialOptions,
  });

  const handleSearch = () => {
    if (query.trim()) {
      const options = {
        ...searchOptions,
        query: query.trim(),
      };
      onSearch(options);
    }
  };

  const updateSearchOption = (key: keyof SearchOptions, value: any) => {
    setSearchOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleSearchType = (type: 'local' | 'google') => {
    if (type === 'local') {
      updateSearchOption('includeLocal', !searchOptions.includeLocal);
    } else {
      updateSearchOption('includeGoogle', !searchOptions.includeGoogle);
    }
  };

  const getSearchTypeText = () => {
    if (searchOptions.includeLocal && searchOptions.includeGoogle) {
      return 'Kết hợp';
    } else if (searchOptions.includeLocal) {
      return 'Local';
    } else if (searchOptions.includeGoogle) {
      return 'Google';
    }
    return 'Chọn nguồn';
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.optionsButton}
        onPress={() => setShowOptions(true)}
      >
        <Ionicons name="options" size={20} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Tìm</Text>
      </TouchableOpacity>

      {/* Search Type Indicator */}
      <View style={styles.searchTypeIndicator}>
        <Text style={styles.searchTypeText}>{getSearchTypeText()}</Text>
      </View>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tùy chọn tìm kiếm</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Search Sources */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nguồn tìm kiếm</Text>
                
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Ionicons name="library" size={20} color="#3498db" />
                    <Text style={styles.optionText}>Sách trong kho</Text>
                  </View>
                  <Switch
                    value={searchOptions.includeLocal}
                    onValueChange={() => toggleSearchType('local')}
                    trackColor={{ false: '#767577', true: '#3498db' }}
                    thumbColor={searchOptions.includeLocal ? '#fff' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Ionicons name="globe" size={20} color="#e74c3c" />
                    <Text style={styles.optionText}>Google Books</Text>
                  </View>
                  <Switch
                    value={searchOptions.includeGoogle}
                    onValueChange={() => toggleSearchType('google')}
                    trackColor={{ false: '#767577', true: '#e74c3c' }}
                    thumbColor={searchOptions.includeGoogle ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Results Count */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Số lượng kết quả</Text>
                <View style={styles.numberInputContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={searchOptions.maxResults.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 20;
                      updateSearchOption('maxResults', Math.min(Math.max(num, 5), 50));
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.numberInputLabel}>kết quả</Text>
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
                
                {['relevance', 'title', 'price', 'rating'].map((sortType) => (
                  <TouchableOpacity
                    key={sortType}
                    style={[
                      styles.sortOption,
                      searchOptions.sortBy === sortType && styles.sortOptionActive
                    ]}
                    onPress={() => updateSearchOption('sortBy', sortType)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      searchOptions.sortBy === sortType && styles.sortOptionTextActive
                    ]}>
                      {sortType === 'relevance' && 'Độ liên quan'}
                      {sortType === 'title' && 'Tên sách'}
                      {sortType === 'price' && 'Giá'}
                      {sortType === 'rating' && 'Đánh giá'}
                    </Text>
                    {searchOptions.sortBy === sortType && (
                      <Ionicons name="checkmark" size={16} color="#3498db" />
                    )}
                  </TouchableOpacity>
                ))}

                <View style={styles.orderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      searchOptions.order === 'asc' && styles.orderButtonActive
                    ]}
                    onPress={() => updateSearchOption('order', 'asc')}
                  >
                    <Text style={styles.orderButtonText}>Tăng dần</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      searchOptions.order === 'desc' && styles.orderButtonActive
                    ]}
                    onPress={() => updateSearchOption('order', 'desc')}
                  >
                    <Text style={styles.orderButtonText}>Giảm dần</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filters */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bộ lọc</Text>
                
                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Ionicons name="gift" size={20} color="#f39c12" />
                    <Text style={styles.optionText}>Chỉ sách miễn phí</Text>
                  </View>
                  <Switch
                    value={searchOptions.filterFree}
                    onValueChange={(value) => updateSearchOption('filterFree', value)}
                    trackColor={{ false: '#767577', true: '#f39c12' }}
                    thumbColor={searchOptions.filterFree ? '#fff' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.optionRow}>
                  <View style={styles.optionInfo}>
                    <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                    <Text style={styles.optionText}>Chỉ sách có sẵn</Text>
                  </View>
                  <Switch
                    value={searchOptions.filterAvailable}
                    onValueChange={(value) => updateSearchOption('filterAvailable', value)}
                    trackColor={{ false: '#767577', true: '#27ae60' }}
                    thumbColor={searchOptions.filterAvailable ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => {
                  setShowOptions(false);
                  handleSearch();
                }}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  optionsButton: {
    padding: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchTypeIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 16,
  },
  searchTypeText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  numberInputLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  sortOptionActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 16,
  },
  sortOptionTextActive: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  orderContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  orderButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  orderButtonActive: {
    backgroundColor: '#3498db',
  },
  orderButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvancedSearchBar;



