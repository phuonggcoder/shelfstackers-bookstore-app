import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddressService, { AddressData, Province, Ward } from '../services/addressService';

interface AddressAutocompleteProps {
  onAddressSelect?: (address: AddressData) => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onAddressSelect }) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('');
  const [wardSearchQuery, setWardSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state for showing/hiding dropdown lists
  const [showProvinces, setShowProvinces] = useState(false);
  const [showWards, setShowWards] = useState(false);

  useEffect(() => {
    loadProvinces();
  }, []);

  // Load provinces with optional search
  const loadProvinces = async (searchQuery: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await AddressService.getAllProvinces(searchQuery);

      if (response.success) {
        setProvinces(response.data);
        setShowProvinces(true);
      } else {
        setError('Không thể tải danh sách tỉnh/thành phố');
        console.error('Province loading error:', response.errors);
      }
    } catch (err) {
      setError('Không thể tải danh sách tỉnh/thành phố');
      console.error('Province loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load wards for selected province with optional search
  const loadWards = async (provinceCode: string, searchQuery: string = '') => {
    try {
      setLoadingWards(true);
      setError(null);
      const response = await AddressService.getWardsByProvince(provinceCode, searchQuery);

      if (response.success) {
        setWards(response.data);
        setSelectedWard(null);
        setShowWards(true);
      } else {
        setError('Không thể tải danh sách phường/xã');
        console.error('Wards loading error:', response.errors);
      }
    } catch (err) {
      setError('Không thể tải danh sách phường/xã');
      console.error('Wards loading error:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Handle province selection
  const handleProvinceSelect = (province: Province) => {
    console.log('Selected province:', province);
    setSelectedProvince(province);
    setSelectedWard(null);
    setProvinceSearchQuery(province.name);
    setWardSearchQuery('');
    setShowProvinces(false);
    setShowWards(false);
    
    // Load wards for selected province
    loadWards(province.code);
  };

  // Handle ward selection
  const handleWardSelect = (ward: Ward) => {
    console.log('Selected ward:', ward);
    setSelectedWard(ward);
    setWardSearchQuery(ward.name);
    setShowWards(false);
    
    if (onAddressSelect && selectedProvince) {
      onAddressSelect({
        province: selectedProvince,
        ward: ward,
        fullAddress: `${ward.name}, ${selectedProvince.name}`,
        addressCode: {
          provinceCode: selectedProvince.code,
          wardCode: ward.code
        }
      });
    }
  };

  // Handle province search input change
  const handleProvinceSearchChange = (text: string) => {
    setProvinceSearchQuery(text);
    setSelectedProvince(null);
    setSelectedWard(null);
    setWards([]);
    setShowWards(false);

    if (text.length >= 2) {
      setTimeout(() => {
        if (text === provinceSearchQuery) {
          loadProvinces(text);
        }
      }, 300);
    } else if (text.length === 0) {
      loadProvinces();
    } else {
      setShowProvinces(false);
    }
  };

  // Handle ward search input change
  const handleWardSearchChange = (text: string) => {
    setWardSearchQuery(text);
    setSelectedWard(null);

    if (selectedProvince) {
      if (text.length >= 2) {
        setTimeout(() => {
          if (text === wardSearchQuery) {
            loadWards(selectedProvince.code, text);
          }
        }, 300);
      } else if (text.length === 0) {
        loadWards(selectedProvince.code);
      } else {
        setShowWards(false);
      }
    }
  };

  const renderProvinceItem = ({ item }: { item: Province }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleProvinceSelect(item)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.itemCode}>Mã: {item.code}</Text>
    </TouchableOpacity>
  );

  // Removed invalid properties from Ward rendering logic
  const renderWardItem = ({ item }: { item: Ward }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleWardSelect(item)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <View style={styles.wardDetails}>
        <Text style={styles.itemCode}>Mã: {item.code}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && provinces.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <TouchableOpacity 
          style={styles.errorContainer}
          onPress={() => {
            setError(null);
            if (!selectedProvince) {
              loadProvinces(provinceSearchQuery);
            } else {
              loadWards(selectedProvince.code, wardSearchQuery);
            }
          }}
        >
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.retryText}>Nhấn để thử lại</Text>
        </TouchableOpacity>
      )}
      
      {/* Province Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Tỉnh/Thành phố *</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tỉnh/thành phố..."
          value={provinceSearchQuery}
          onChangeText={handleProvinceSearchChange}
          onFocus={() => {
            setShowProvinces(true);
            setShowWards(false);
            if (provinces.length === 0) {
              loadProvinces();
            }
          }}
        />
        
        {showProvinces && (
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text>Đang tìm kiếm...</Text>
              </View>
            ) : provinces.length > 0 ? (
              <FlatList
                data={provinces}
                keyExtractor={(item) => item.code}
                renderItem={renderProvinceItem}
                style={styles.list}
                maxToRenderPerBatch={10}
                windowSize={10}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  Không tìm thấy tỉnh/thành phố nào
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Ward Selection */}
      {selectedProvince && (
        <View style={styles.section}>
          <Text style={styles.label}>Phường/Xã/Thị trấn *</Text>
          <Text style={styles.selectedProvinceText}>
            Đã chọn: {selectedProvince.name}
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm phường/xã/thị trấn..."
            value={wardSearchQuery}
            onChangeText={handleWardSearchChange}
            onFocus={() => {
              setShowWards(true);
              setShowProvinces(false);
              if (wards.length === 0) {
                loadWards(selectedProvince.code);
              }
            }}
          />
          
          {showWards && (
            <View style={styles.listContainer}>
              {loadingWards ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text>Đang tìm kiếm...</Text>
                </View>
              ) : wards.length > 0 ? (
                <FlatList
                  data={wards}
                  keyExtractor={(item) => item.code}
                  renderItem={renderWardItem}
                  style={styles.list}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    Không tìm thấy phường/xã/thị trấn nào
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Selected Address Summary */}
      {selectedProvince && selectedWard && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Địa chỉ đã chọn:</Text>
          <Text style={styles.summaryText}>
            {selectedWard.name}, {selectedProvince.name}
          </Text>
          <Text style={styles.summaryCode}>
            Mã: {selectedProvince.code} - {selectedWard.code}
          </Text>
        </View>
      )}
      
      {/* Debug info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Debug: Provinces:{provinces.length} Wards:{wards.length}
          </Text>
          <Text style={styles.debugText}>
            Loading: {loading ? 'Provinces' : ''} {loadingWards ? 'Wards' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  selectedProvinceText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  listContainer: {
    marginTop: 4,
  },
  list: {
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  wardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 14,
  },
  retryText: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  noDataContainer: {
    padding: 20,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  noDataText: {
    textAlign: 'center',
    color: '#856404',
    fontSize: 14,
  },
  summaryContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  summaryCode: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default AddressAutocomplete;