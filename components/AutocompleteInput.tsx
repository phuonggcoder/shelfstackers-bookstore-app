import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AutocompleteProps {
  type: 'province' | 'district' | 'ward' | 'street';
  query: string;
  onSelect: (item: any) => void;
  parentCode?: string; // province_code for district, district_code for ward
}

const API_BASE = 'https://server-shelf-stacker.onrender.com/api/addresses/autocomplete';

const AutocompleteInput: React.FC<AutocompleteProps> = ({ type, query, onSelect, parentCode }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let url = `${API_BASE}/${type}`;
    if (search.length > 0) {
      url += `?q=${encodeURIComponent(search)}`;
    }
    if (type === 'district' && parentCode) url += (url.includes('?') ? '&' : '?') + `province_code=${parentCode}`;
    if (type === 'ward' && parentCode) url += (url.includes('?') ? '&' : '?') + `district_code=${parentCode}`;
    setLoading(true);
    axios.get(url)
      .then(res => {
        setData(res.data.data || []);
        setShowList(true);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [search, parentCode, type]);

  return (
    <View style={{ width: '100%' }}>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 10, marginBottom: 4 }}
        placeholder={`Tìm kiếm hoặc chọn ${type === 'province' ? 'tỉnh/thành' : type === 'district' ? 'quận/huyện' : 'phường/xã'}`}
        value={search}
        onChangeText={setSearch}
        onFocus={() => setShowList(true)}
      />
      {loading && <ActivityIndicator size="small" color="#4A3780" />}
      {showList && data.length > 0 && (
        <FlatList
          data={data}
          keyExtractor={item => item.code || item.name}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => { onSelect(item); setShowList(false); setSearch(item.name); }}>
              <Text>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    maxHeight: 150,
    marginTop: 2,
    zIndex: 10,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default AutocompleteInput;
