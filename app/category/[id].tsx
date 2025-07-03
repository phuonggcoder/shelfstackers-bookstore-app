import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import BookCard from '../../components/BookCard';
import { useCategoryBooks } from '../../hooks/useCategoryBooks';

const CategoryScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const { books, loading, error } = useCategoryBooks(String(id));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name || 'Danh mục'}</Text>
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      <FlatList
        data={books}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <BookCard book={item} />}
        numColumns={3}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={loading ? <Text>Đang tải...</Text> : <Text>Không có sách nào trong danh mục này.</Text>}
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