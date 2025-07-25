import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBooks, getCategories } from '../../services/api';
import { Book, Category } from '../../types';

const { width } = Dimensions.get('window');

const CACHE_KEYS = {
  BOOKS: 'cached_books',
  CATEGORIES: 'cached_categories',
  LAST_UPDATE: 'last_cache_update',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SearchScreen = () => {
  const router = useRouter();
  const { autoFocus } = useLocalSearchParams();
  const searchInputRef = useRef<TextInput>(null);
  const [activeTab, setActiveTab] = useState<'books' | 'categories'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Auto-load data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    filterData();
  }, [searchQuery, books, categories]);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    setShowAllBooks(false);
    setShowAllCategories(false);
  }, [searchQuery]);

  const isCacheValid = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      if (!lastUpdate) return false;
      
      const now = Date.now();
      const lastUpdateTime = parseInt(lastUpdate);
      return (now - lastUpdateTime) < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  };

  const loadCachedData = async () => {
    try {
      const [cachedBooks, cachedCategories] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.BOOKS),
        AsyncStorage.getItem(CACHE_KEYS.CATEGORIES),
      ]);

      if (cachedBooks) {
        setBooks(JSON.parse(cachedBooks));
      }
      if (cachedCategories) {
        setCategories(JSON.parse(cachedCategories));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const saveToCache = async (booksData: Book[], categoriesData: Category[]) => {
    try {
      const now = Date.now();
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.BOOKS, JSON.stringify(booksData)),
        AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(categoriesData)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, now.toString()),
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if cache is valid
      const cacheValid = await isCacheValid();
      
      if (cacheValid) {
        // Load from cache
        await loadCachedData();
        console.log('Data loaded from cache');
      } else {
        // Load from API and update cache
        const [booksData, categoriesData] = await Promise.all([
          getBooks(),
          getCategories()
        ]);
        
        setBooks(booksData);
        setCategories(categoriesData);
        
        // Save to cache
        await saveToCache(booksData, categoriesData);
        console.log('Data loaded from API and cached');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Try to load from cache as fallback
      await loadCachedData();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh from API
      const [booksData, categoriesData] = await Promise.all([
        getBooks(),
        getCategories()
      ]);
      
      setBooks(booksData);
      setCategories(categoriesData);
      
      // Update cache
      await saveToCache(booksData, categoriesData);
      console.log('Data refreshed from API and cached');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredBooks(books);
      setFilteredCategories(categories);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Filter books
    const filteredBooksData = books.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.description?.toLowerCase().includes(query)
    );
    setFilteredBooks(filteredBooksData);

    // Filter categories
    const filteredCategoriesData = categories.filter(category => 
      category.name.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
    setFilteredCategories(filteredCategoriesData);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getBookImage = (book: Book) => {
    if (book.thumbnail) return book.thumbnail;
    if (book.cover_image && book.cover_image.length > 0) {
      return book.cover_image[0];
    }
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  };

  const getCategoryImage = (category: Category) => {
    if (category.image) return category.image;
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  };

  const handleBookPress = (book: Book) => {
    router.push({
      pathname: '/book/[id]',
      params: { id: book._id }
    });
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/category-detail/[id]',
      params: { id: category._id, name: category.name }
    });
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.bookImageContainer}>
        <Image
          source={{ uri: getBookImage(item) }}
          style={styles.bookImage}
          contentFit="cover"
          transition={300}
        />
        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={18} color="#4A90E2" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>
            {formatPrice(item.price)}
          </Text>
          {item.price > 0 && (
            <Text style={styles.originalPrice}>
              {formatPrice(item.price * 1.2)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: getCategoryImage(item) }}
        style={styles.categoryImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.description.replace(/<[^>]*>/g, '')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const ShowAllButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity
      style={{
        borderWidth: 1,
        borderColor: '#007bff',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginVertical: 12,
        marginHorizontal: 16,
      }}
      onPress={onPress}
    >
      <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>Xem tất cả</Text>
    </TouchableOpacity>
  );

  const displayedBooks = showAllBooks ? filteredBooks : filteredBooks.slice(0, 14);
  const displayedCategories = showAllCategories ? filteredCategories : filteredCategories.slice(0, 14);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Tìm kiếm sách, tác giả, danh mục..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#7f8c8d"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilter(!showFilter)}
        >
          <Ionicons name="options-outline" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'books' && styles.tabActive]}
          onPress={() => setActiveTab('books')}
        >
          <Text style={[styles.tabText, activeTab === 'books' && styles.tabTextActive]}>
            Sách ({filteredBooks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.tabActive]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
            Danh mục ({filteredCategories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'books' ? (
            displayedBooks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Không tìm thấy sách phù hợp' : 'Chưa có sách nào'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thử tìm kiếm sách bạn muốn'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayedBooks}
                renderItem={renderBookItem}
                keyExtractor={(item) => item._id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                key="books-list"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListFooterComponent={
                  !showAllBooks && filteredBooks.length > 14 ? (
                    <ShowAllButton onPress={() => router.push({ pathname: '/filtered-books', params: { searchText: searchQuery } })} />
                  ) : null
                }
              />
            )
          ) : (
            displayedCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="grid-outline" size={64} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thử tìm kiếm danh mục bạn muốn'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayedCategories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item._id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                key="categories-list"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListFooterComponent={
                  !showAllCategories && filteredCategories.length > 14 ? (
                    <ShowAllButton onPress={() => setShowAllCategories(true)} />
                  ) : null
                }
              />
            )
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  tabTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 150, // Increase padding even more for floating tab bar
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  bookImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  originalPrice: {
    fontSize: 11,
    color: '#7f8c8d',
    textDecorationLine: 'line-through',
  },
  categoryCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: 120,
  },
  categoryInfo: {
    padding: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
});

export default SearchScreen;