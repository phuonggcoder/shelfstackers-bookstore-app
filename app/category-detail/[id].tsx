import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBooksByCategory, getCategories } from '../../services/api';
import { Book, Category } from '../../types';

const { width, height } = Dimensions.get('window');

const CategoryDetailScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadCategoryData();
  }, [id]);

  useEffect(() => {
    filterBooks();
  }, [searchQuery, books]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load category details
      const categories = await getCategories();
      const currentCategory = categories.find(cat => cat._id === id);
      setCategory(currentCategory || null);
      
      // Load books in category
      const booksData = await getBooksByCategory(String(id));
      setBooks(booksData);
    } catch (err) {
      console.error('Error loading category data:', err);
      setError('Không thể tải dữ liệu danh mục');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    if (!searchQuery.trim()) {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategoryData();
    setRefreshing(false);
  };

  const handleBookPress = (book: Book) => {
    router.push({
      pathname: '/book/[id]',
      params: { id: book._id }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const tagsStyles = {
    p: { marginBottom: 8, lineHeight: 20, color: '#7f8c8d' },
    br: { height: 8 },
    h1: { fontSize: 18, fontWeight: 'bold' as const, marginBottom: 8, color: '#2c3e50' },
    h2: { fontSize: 16, fontWeight: 'bold' as const, marginBottom: 6, color: '#2c3e50' },
    ul: { marginBottom: 8, paddingLeft: 16 },
    li: { marginBottom: 4 },
  };

  const renderBookCard = ({ item }: { item: Book }) => {
    const getBookImage = () => {
      if (item.thumbnail) return item.thumbnail;
      if (item.cover_image && item.cover_image.length > 0) {
        return item.cover_image[0];
      }
      return 'https://i.imgur.com/gTzT0hA.jpeg';
    };

    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.bookImageContainer}>
          <Image
            source={{ uri: getBookImage() }}
            style={styles.bookImage}
            contentFit="cover"
            transition={300}
          />
          <TouchableOpacity style={styles.heartButton}>
            <Ionicons name="heart-outline" size={20} color="#4A90E2" />
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
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đang tải...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Đang tải sách...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name as string}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#4A90E2" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCategoryData}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{name as string}</Text>
          {category?.description && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {category.description.replace(/<[^>]*>/g, '')}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons name={showSearch ? "close" : "search"} size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sách..."
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
        </View>
      )}

      {/* Category Info */}
      {category && (
        <View style={styles.categoryInfo}>
          {category.image && (
            <Image
              source={{ uri: category.image }}
              style={styles.categoryImage}
              contentFit="cover"
            />
          )}
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{category.name}</Text>
            {category.description && (
              <View style={styles.descriptionContainer}>
                {category.description.includes('<') ? (
                  <RenderHTML
                    contentWidth={windowWidth - 120}
                    source={{ html: category.description }}
                    tagsStyles={tagsStyles}
                  />
                ) : (
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                )}
              </View>
            )}
            <Text style={styles.bookCount}>
              {filteredBooks.length} sách trong danh mục
            </Text>
          </View>
        </View>
      )}

      {/* Books List */}
      <View style={styles.booksContainer}>
        <View style={styles.booksHeader}>
          <Text style={styles.booksTitle}>
            {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Sách trong danh mục'}
          </Text>
          <Text style={styles.booksCount}>{filteredBooks.length} sách</Text>
        </View>
        
        {filteredBooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy sách phù hợp' : 'Chưa có sách nào trong danh mục này'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBooks}
            renderItem={renderBookCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#667eea']}
                tintColor="#667eea"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  categoryInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  categoryDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 18,
  },
  bookCount: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  booksContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  booksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  booksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  booksCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  listContainer: {
    paddingBottom: 20,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    gap: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  originalPrice: {
    fontSize: 12,
    color: '#7f8c8d',
    textDecorationLine: 'line-through',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CategoryDetailScreen; 