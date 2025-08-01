import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BookCard from '../../components/BookCard';
import { useCategoryBooks } from '../../hooks/useCategoryBooks';
import { getBooks } from '../../services/api';
import { Book } from '../../types';

const CategoryScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const { books, loading, error } = useCategoryBooks(String(id));
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const books = await getBooks();
        setAllBooks(books);
      } catch (error) {
        console.error('Error fetching all books:', error);
      }
    };
    fetchAllBooks();
  }, []);

  useEffect(() => {
    if (allBooks.length > 0 && books.length > 0) {
      // Lọc ra sách không thuộc danh mục hiện tại
      const otherBooks = allBooks.filter(book => 
        !books.some(categoryBook => categoryBook._id === book._id)
      );
      
      // Lấy random 6 cuốn sách
      const shuffled = otherBooks.sort(() => 0.5 - Math.random());
      setRecommendedBooks(shuffled.slice(0, 6));
    }
  }, [allBooks, books]);

  const renderCategoryBooks = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{name || 'Danh mục'}</Text>
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      <FlatList
        data={books}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <BookCard book={item} />}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={loading ? <Text>Đang tải...</Text> : <Text>Không có sách nào trong danh mục này.</Text>}
        scrollEnabled={false}
      />
    </View>
  );

  const renderRecommendedBooks = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sách gợi ý</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/filtered-books')}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={recommendedBooks}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <BookCard book={item} />}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={<Text>Không có sách gợi ý.</Text>}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{name || 'Danh mục'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCategoryBooks()}
        {renderRecommendedBooks()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30, // Thêm padding top để tránh tai thỏ
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    gap: 16,
  },
  placeholder: {
    width: 40, // Adjust as needed for spacing
  },
});

export default CategoryScreen;