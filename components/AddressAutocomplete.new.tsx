import debounce from 'lodash/debounce';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AddressService, { AddressData, Province, Ward } from '../services/addressService';

interface AddressAutocompleteProps {
  onAddressSelect?: (address: AddressData) => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ onAddressSelect }) => {
  const { t } = useTranslation();
  // States for data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // States for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provinceQuery, setProvinceQuery] = useState('');
  const [wardQuery, setWardQuery] = useState('');
  const [showProvinces, setShowProvinces] = useState(false);
  const [showWards, setShowWards] = useState(false);

  // Debounced search functions
  const debouncedSearchProvinces = debounce(async (query: string) => {
    if (query.length >= 2) {
      try {
        setLoading(true);
        const results = await AddressService.getProvinces(query);
        setProvinces(results);
        setShowProvinces(true);
      } catch {
        setError(t('cannotLoadCategories'));
      } finally {
        setLoading(false);
      }
    }
  }, 300);

  const debouncedSearchWards = debounce(async (provinceCode: string, query: string) => {
    if (query.length >= 2) {
      try {
        setLoading(true);
        const results = await AddressService.getWards(provinceCode, query);
        setWards(results);
        setShowWards(true);
      } catch {
        setError(t('cannotLoadWards') || 'Error');
      } finally {
        setLoading(false);
      }
    }
  }, 300);

  // Load initial data
  useEffect(() => {
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProvinces = async (query: string = '') => {
    try {
      setLoading(true);
      const results = await AddressService.getProvinces(query);
      setProvinces(results);
      setShowProvinces(true);
    } catch {
      setError(t('cannotLoadCategories'));
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async (provinceCode: string) => {
    try {
      setLoading(true);
      const results = await AddressService.getWards(provinceCode);
      setWards(results);
      setShowWards(true);
    } catch {
      setError(t('cannotLoadWards') || 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Handle selections
  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setProvinceQuery(province.name);
    setShowProvinces(false);
    setSelectedWard(null);
    setWardQuery('');
    loadWards(province.code);
  };

  const handleWardSelect = (ward: Ward) => {
    setSelectedWard(ward);
    setWardQuery(ward.name);
    setShowWards(false);

    if (selectedProvince && onAddressSelect) {
      onAddressSelect({
        province: selectedProvince,
  district: { code: '', name: '', provinceId: '', type: '', typeText: '', autocompleteType: 'oapi' },
        ward: ward,
        fullAddress: `${ward.name}, ${selectedProvince.name}`,
        addressCode: {
          provinceCode: selectedProvince.code,
          districtCode: '',
          wardCode: ward.code
        }
      });
    }
  };

  // Render list items
  const renderProvinceItem = ({ item }: { item: Province }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleProvinceSelect(item)}
    >
  <Text style={styles.itemText}>{item.name}</Text>
  <Text style={styles.itemCode}>{t('code') || 'Mã'}: {item.code}</Text>
    </TouchableOpacity>
  );

  const renderWardItem = ({ item }: { item: Ward }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleWardSelect(item)}
    >
  <Text style={styles.itemText}>{item.name}</Text>
  <Text style={styles.itemCode}>{t('code') || 'Mã'}: {item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {error && (
        <TouchableOpacity
          style={styles.errorContainer}
          onPress={() => setError(null)}
        >
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('provinceCity')}</Text>
        <TextInput
          style={styles.input}
          value={provinceQuery}
          onChangeText={(text) => {
            setProvinceQuery(text);
            debouncedSearchProvinces(text);
          }}
          placeholder={t('enterProvinceCity')}
          onFocus={() => setShowProvinces(true)}
        />
        {showProvinces && (
          <View style={styles.dropdown}>
            {loading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <FlatList
                data={provinces}
                renderItem={renderProvinceItem}
                keyExtractor={(item) => item.code}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        )}
      </View>

      {selectedProvince && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('ward')}</Text>
          <TextInput
            style={styles.input}
            value={wardQuery}
            onChangeText={(text) => {
              setWardQuery(text);
              if (selectedProvince) {
                debouncedSearchWards(selectedProvince.code, text);
              }
            }}
            placeholder={t('enterWard')}
            onFocus={() => setShowWards(true)}
          />
          {showWards && (
            <View style={styles.dropdown}>
              {loading ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : (
                <FlatList
                  data={wards}
                  renderItem={renderWardItem}
                  keyExtractor={(item) => item.code}
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>
          )}
        </View>
      )}

      {selectedProvince && selectedWard && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{t('selectedAddress')}</Text>
          <Text style={styles.summaryText}>
            {selectedWard.name}, {selectedProvince.name}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  retryText: {
    color: '#c62828',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
  },
  list: {
    backgroundColor: 'white',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  itemText: {
    fontSize: 16,
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
  },
  summary: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
  },
});

export default AddressAutocomplete;
