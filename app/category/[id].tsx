import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import BookCard from '../../components/BookCard';
import { useData } from '../../context/DataContext';

const CategoryScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const { books } = useData();

  // Lọc sách theo categoryId, so sánh chắc chắn đúng kiểu
  const filteredBooks = books.filter(book =>
    Array.isArray(book.categories) &&
    book.categories.some(cat => {
      if (typeof cat === 'string') return cat === String(id);
      if (typeof cat === 'object' && cat && cat._id) return String(cat._id) === String(id);
      return false;
    })
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name || 'Danh mục'}</Text>
      <FlatList
        data={filteredBooks}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <BookCard book={item} />}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text>Không có sách nào trong danh mục này.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
});

export default CategoryScreen; 