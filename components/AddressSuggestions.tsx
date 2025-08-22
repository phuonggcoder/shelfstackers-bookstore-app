import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddressSuggestion {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

interface Props {
  query: string;
  wardName: string;
  districtName: string;
  provinceName: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  visible: boolean;
}

const AddressSuggestions: React.FC<Props> = ({
  query,
  wardName,
  districtName,
  provinceName,
  onSelect,
  visible,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !query.trim() || !wardName) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // Tìm kiếm địa chỉ trong phạm vi ward
        const searchQuery = `${query}, ${wardName}, ${districtName}, ${provinceName}`;
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5&addressdetails=1&bounded=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'shelfstackers-app/1.0 (youremail@example.com)',
          },
        });
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          const formattedSuggestions = data.map((item, index) => ({
            id: `${item.place_id || index}`,
            display_name: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
            type: item.type || 'unknown',
            importance: item.importance || 0,
          }));
          
          setSuggestions(formattedSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.warn('Failed to fetch address suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [query, wardName, districtName, provinceName, visible]);

  if (!visible) return null;

  const renderSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <Ionicons 
          name="location" 
          size={16} 
          color="#3255FB" 
          style={styles.suggestionIcon}
        />
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle} numberOfLines={2}>
            {item.display_name}
          </Text>
          <Text style={styles.suggestionType}>
            {item.type} • {item.importance.toFixed(2)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          style={styles.suggestionsList}
          showsVerticalScrollIndicator={false}
        />
      ) : query.trim() && !loading ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            Không tìm thấy địa chỉ phù hợp
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },
  suggestionType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
  },
});

export default AddressSuggestions;

