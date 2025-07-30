import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { getDistricts, getProvinces, getWards, LocationItem } from '../services/addressService';

const SelectLocationScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { level, provinceCode, districtCode } = useLocalSearchParams();

  const [search, setSearch] = useState('');
  const [data, setData] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, level, provinceCode, districtCode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let result: LocationItem[] = [];
      
      if (level === 'province') {
        result = await getProvinces(search);
      } else if (level === 'district' && provinceCode) {
        result = await getDistricts(String(provinceCode), search);
      } else if (level === 'ward' && districtCode) {
        result = await getWards(String(districtCode), search);
      } else {
        console.warn(t('missingRequiredParams'));
        setLoading(false);
        return;
      }
      
      setData(result);
    } catch (err) {
      console.error(t('loadListFailed'), err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: LocationItem) => {
    const keyMap: Record<string, string> = {
      province: 'selected_province',
      district: 'selected_district',
      ward: 'selected_ward',
    };
    const key = keyMap[level as string];
    if (key) {
      await AsyncStorage.setItem(key, JSON.stringify(item));
    }
    router.back();
  };

  const renderItem = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const getTitle = () => {
    switch (level) {
      case 'province':
        return t('selectProvinceCity');
      case 'district':
        return t('selectDistrict');
      case 'ward':
        return t('selectWard');
      default:
        return t('selectAddress');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 60 }} />
      </View>
      
      <TextInput
        style={styles.searchInput}
        placeholder={t('search')}
        value={search}
        onChangeText={setSearch}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#3255FB" style={styles.loading} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search ? t('noResultsFound') : t('loadingData')}
            </Text>
          }
        />
      )}
    </View>
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#3255FB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  searchInput: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  itemText: {
    fontSize: 16,
    color: '#222',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  },
  loading: {
    marginTop: 40,
  },
});

export default SelectLocationScreen; 