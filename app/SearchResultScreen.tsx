import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BOOKS = 'https://server-shelf-stacker.onrender.com/api/books';
const API_CATEGORIES = 'https://server-shelf-stacker.onrender.com/api/categories';

const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const SearchResultScreen = () => {
  const { keyword } = useLocalSearchParams<{ keyword: string }>();
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookRes, catRes] = await Promise.all([
        axios.get(API_BOOKS),
        axios.get(API_CATEGORIES),
      ]);
      setBooks(bookRes.data.books || []);
      setCategories(catRes.data.categories || []);
    } catch {}
    setIsLoading(false);
  };

  const cleanedKeyword = keyword ? removeAccents((keyword as string).trim().toLowerCase()) : '';
  const words = cleanedKeyword.split(/\s+/).filter(w => w.length > 0); // fix: allow 1 ký tự

  const isExactMatch = (title: string) => {
    const normalized = removeAccents(title.toLowerCase());
    return normalized.includes(cleanedKeyword) && cleanedKeyword.length > 0;
  };

  const isPartialMatch = (title: string) => {
    const normalized = removeAccents(title.toLowerCase());
    return words.some(word => normalized.includes(word)) && !isExactMatch(title);
  };

  const exactMatchedBooks = books.filter(book => isExactMatch(book.title));
  const partialMatchedBooks = books
    .filter(book => isPartialMatch(book.title))
    .filter(book => !exactMatchedBooks.some(b => b._id === book._id));

  const matchedCategories = categories.filter(category =>
    removeAccents(category.name.toLowerCase()).includes(cleanedKeyword)
  );

  const groupBooksByCategory = (bookList: typeof books) =>
    categories
      .map(category => {
        const categoryBooks = bookList.filter(book =>
          book.categories?.some((cat: any) => cat._id === category._id)
        );
        return { category, books: categoryBooks };
      })
      .filter(group => group.books.length > 0);

  const exactBooksByCategory = groupBooksByCategory(exactMatchedBooks);
  const partialBooksByCategory = groupBooksByCategory(partialMatchedBooks);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A3780" />
      </View>
    );
  }

  const hasResults = exactBooksByCategory.length > 0 || partialBooksByCategory.length > 0;

  if (!hasResults) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy kết quả cho từ khóa: "{keyword}"</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Kết quả tìm kiếm cho: "{keyword}"</Text>

      {/* Danh mục liên quan */}
      {matchedCategories.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.subTitle}>Danh mục liên quan:</Text>
          {matchedCategories.map(category => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryBox}
              onPress={() =>
                router.push({
                  pathname: '/category/[id]',
                  params: { id: category._id, name: category.name },
                })
              }
            >
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sách khớp hoàn toàn */}
      {exactBooksByCategory.map(({ category, books }) => (
        <View key={`exact-${category._id}`} style={{ marginBottom: 20 }}>
          <Text style={styles.subTitle}>{`Kết quả - ${category.name}`}</Text>
          {books.map(book => (
            <View key={book._id} style={styles.bookBox}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>Tác giả: {book.author}</Text>
            </View>
          ))}
        </View>
      ))}

      {/* Gợi ý gần đúng */}
      {partialBooksByCategory.map(({ category, books }) => (
        <View key={`partial-${category._id}`} style={{ marginBottom: 20 }}>
          <Text style={styles.subTitle}>{`Gợi ý - ${category.name}`}</Text>
          {books.map(book => (
            <View key={book._id} style={styles.bookBox}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>Tác giả: {book.author}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4A3780',
  },
  categoryBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  bookBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  bookTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  bookAuthor: {
    color: '#666',
    fontSize: 13,
  },
});

export default SearchResultScreen;
