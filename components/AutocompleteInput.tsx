import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AddressService, { LocationItem } from '../services/addressService';

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  value: LocationItem | null;
  onSelect: (item: LocationItem) => void;
  level: 'province' | 'district' | 'ward';
  provinceId?: string;
  districtId?: string;
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  onSelect,
  level,
  provinceId,
  districtId,
  disabled = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchText.trim()) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchText, level, provinceId, districtId]);

  const fetchSuggestions = async () => {
    if (disabled) return;
    
    setLoading(true);
    try {
      let result: LocationItem[] = [];
      
      if (level === 'province') {
        result = await AddressService.getProvinces(searchText);
      } else if (level === 'district' && provinceId) {
        result = await AddressService.getDistrictsLegacy(provinceId, searchText);
      } else if (level === 'ward' && districtId) {
        result = await AddressService.getWardsLegacy(districtId, searchText);
      }
      
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: LocationItem) => {
    onSelect(item);
    setSearchText('');
    setShowSuggestions(false);
  };

  const handleFocus = async () => {
    if (!disabled) {
      // Load initial data when focus
      setLoading(true);
      try {
        let result: LocationItem[] = [];
        
        if (level === 'province') {
          result = await AddressService.getProvinces('');
        } else if (level === 'district' && provinceId) {
          result = await AddressService.getDistrictsLegacy(provinceId, '');
        } else if (level === 'ward' && districtId) {
          result = await AddressService.getWardsLegacy(districtId, '');
        }
        
        setSuggestions(result);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching initial suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    onSelect(null as any);
    setSearchText('');
    setShowSuggestions(false);
  };

  const renderSuggestion = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.suggestionText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, disabled && styles.disabledInput]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value ? value.name : searchText}
          onChangeText={setSearchText}
          onFocus={handleFocus}
          editable={!disabled}
          placeholderTextColor="#999"
        />
        {value && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
        {loading && (
          <ActivityIndicator size="small" color="#3255FB" style={styles.loading} />
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestion}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  loading: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AutocompleteInput;
