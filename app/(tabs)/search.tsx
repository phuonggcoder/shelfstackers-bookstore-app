import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_BOOKS = 'https://server-shelf-stacker.onrender.com/api/books';
const API_CATEGORIES = 'https://server-shelf-stacker.onrender.com/api/categories';

const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const SearchScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'category'>('book');
  const router = useRouter();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadRecentSearches = async () => {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    };
    loadRecentSearches();
  }, []);

  // Search realtime khi searchText thay đổi (debounce 300ms)
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current as any);
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    debounceTimeout.current = setTimeout(() => {
      doSearch(searchText.trim());
    }, 300) as any;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, activeTab]);

  // Tìm kiếm khi nhập
  const doSearch = async (keyword: string) => {
    setResultLoading(true);
    setSearchResults([]);
    try {
      if (activeTab === 'book') {
        const res = await axios.get(`${API_BOOKS}/search?keyword=${encodeURIComponent(keyword)}`);
        setSearchResults(res.data.books || []);
      } else {
        const res = await axios.get(`${API_CATEGORIES}/search?name=${encodeURIComponent(keyword)}`);
        setSearchResults(res.data.categories || []);
      }
    } catch {
      setSearchResults([]);
    }
    setResultLoading(false);
  };

  // Lưu lịch sử và tìm kiếm
  const saveSearch = async (keyword: string) => {
    const cleanKeyword = keyword.trim();
    if (!cleanKeyword) return;
    const stored = await AsyncStorage.getItem('recentSearches');
    const current: string[] = stored ? JSON.parse(stored) : [];
    const newHistory = [cleanKeyword, ...current.filter(item => item !== cleanKeyword)];
    const final = newHistory.slice(0, 10);
    setRecentSearches(final);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(final));
    setSearchText(cleanKeyword);
  };

  const clearSearchHistory = async () => {
    await AsyncStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  const deleteOneKeyword = async (keyword: string) => {
    const newList = recentSearches.filter(item => item !== keyword);
    setRecentSearches(newList);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(newList));
  };

  // Khi click vào kết quả
  const handleResultPress = (item: any) => {
    if (activeTab === 'book') {
      router.push({ pathname: '/book/[id]', params: { id: item._id || item.id } });
    } else {
      router.push({ pathname: '/category/[id]', params: { id: item._id || item.id, name: item.name || item.title } });
    }
    saveSearch(searchText);
  };

  // UI tab
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'book' && styles.tabActive]}
        onPress={() => setActiveTab('book')}
      >
        <Text style={[styles.tabText, activeTab === 'book' && styles.tabTextActive]}>Sách</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'category' && styles.tabActive]}
        onPress={() => setActiveTab('category')}
      >
        <Text style={[styles.tabText, activeTab === 'category' && styles.tabTextActive]}>Danh mục</Text>
      </TouchableOpacity>
    </View>
  );

  // UI grid item
  const ITEM_WIDTH = Math.floor((Dimensions.get('window').width - 40 - 24) / 3); // 40 padding, 24 gap
  const ITEM_HEIGHT = 180;
  const PLACEHOLDER_IMAGE = 'https://i.imgur.com/gTzT0hA.jpeg';

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gridItem, { width: ITEM_WIDTH, height: ITEM_HEIGHT }]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.gridThumbWrap}>
        <Image
          source={{ uri: item.image_url || item.image || PLACEHOLDER_IMAGE }}
          style={styles.gridThumb}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>{item.title || item.name}</Text>
      {activeTab === 'book' && item.author && (
        <Text style={styles.gridAuthor} numberOfLines={1}>{item.author}</Text>
      )}
    </TouchableOpacity>
  );

  // UI grid list
  const renderGridList = (data: any[]) => (
    <FlatList
      data={data}
      renderItem={renderGridItem}
      keyExtractor={item => item._id || item.id}
      numColumns={3}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.gridList}
      ListEmptyComponent={resultLoading ? (
        <ActivityIndicator size="small" color="#5E5CE6" style={{ marginVertical: 10 }} />
      ) : searchText.trim() ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Không tìm thấy kết quả cho từ khóa "{searchText}"</Text>
      ) : null}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <View style={styles.topSearchContainer}>
          <View style={styles.searchSection}>
            <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={activeTab === 'book' ? 'Tìm kiếm sách, tác giả...' : 'Tìm kiếm danh mục...'}
              style={styles.input}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {renderTabBar()}
      </View>
      {/* Nếu searchText rỗng, hiện lịch sử tìm kiếm */}
      {!searchText.trim() && recentSearches.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.All}>
            <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.seeAll}>Xóa</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recentSearches.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#eee',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginRight: 8,
                  marginBottom: 8,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity onPress={() => setSearchText(item)}>
                  <Text>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteOneKeyword(item)}>
                  <Ionicons name="close" size={16} color="#666" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        // Nếu có searchText, chỉ hiện 1 FlatList kết quả
        renderGridList(searchResults)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F8',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: '#5E5CE6',
    padding: 14,
    borderRadius: 15,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F8',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#5E5CE6',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#5E5CE6',
  },
  All: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 10,
  },
  sectionTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  seeAll: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gridList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  gridThumbWrap: {
    width: 80,
    height: 112,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridThumb: {
    width: 80,
    height: 112,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  gridTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridAuthor: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});

export default SearchScreen;