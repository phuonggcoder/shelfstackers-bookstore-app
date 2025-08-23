import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdvancedSearchBar, { SearchOptions } from '../components/AdvancedSearchBar';
import HybridBookCard from '../components/HybridBookCard';
import hybridBookService, { HybridSearchResult } from '../services/hybridBookService';
import { Book } from '../types';

const HybridSearchScreen: React.FC = () => {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<HybridSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (options: SearchOptions) => {
    if (!options.query.trim()) return;

    setLoading(true);
    try {
      const results = await hybridBookService.hybridSearch({
        query: options.query,
        includeLocal: options.includeLocal,
        includeGoogle: options.includeGoogle,
        maxResults: options.maxResults,
        sortBy: options.sortBy,
        order: options.order,
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện tìm kiếm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: Book) => {
    if (book.source === 'google_books') {
      router.push({
        pathname: '/google-book-detail',
        params: { bookId: book._id }
      });
    } else {
      router.push({
        pathname: '/book/[id]',
        params: { id: book._id }
      });
    }
  };

  const handleAddToCart = async (book: Book) => {
    try {
      Alert.alert('Thành công', `Đã thêm "${book.title}" vào giỏ hàng`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng');
    }
  };

  const handleAddToWishlist = async (book: Book) => {
    try {
      Alert.alert('Thành công', `Đã thêm "${book.title}" vào danh sách yêu thích`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm vào danh sách yêu thích');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tìm kiếm sách</Text>
      </View>

      <AdvancedSearchBar onSearch={handleSearch} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : searchResults ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            Tìm thấy {searchResults.combined.length} kết quả
          </Text>
          
          <FlatList
            data={searchResults.combined}
            renderItem={({ item }) => (
              <HybridBookCard
                book={item}
                onPress={handleBookPress}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                showSourceBadge={true}
              />
            )}
            keyExtractor={(item) => `${item.source}-${item._id}`}
            numColumns={2}
            contentContainerStyle={styles.booksGrid}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nhập từ khóa để tìm kiếm sách</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    padding: 16,
    fontSize: 14,
    color: '#666',
    backgroundColor: 'white',
  },
  booksGrid: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default HybridSearchScreen;
