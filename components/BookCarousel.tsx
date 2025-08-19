import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import BookCard from './BookCard';

type Props = {
  title: string;
  books: Book[];
  categoryId?: string;
  categoryName?: string;
};

const CARD_WIDTH = 130;
const CARD_MARGIN = 15;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

const BookCarousel = ({ title, books, categoryId, categoryName }: Props) => {
  const router = useRouter();
  if (!books || books.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {categoryId && categoryName && (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/category/[id]',
                params: { id: categoryId, name: categoryName }
              });
            }}
          >
            <Feather name="arrow-right" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={books}
        renderItem={({ item }) => <BookCard book={item} />}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        disableIntervalMomentum
  contentContainerStyle={{ paddingRight: 24 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default memo(BookCarousel); 