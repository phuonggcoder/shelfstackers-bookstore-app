import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';

interface Props {
  book: Book;
  onPress?: (book: Book) => void;
}

const BookGrid2Col: React.FC<Props> = ({ book, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.85}>
      <Image source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        {book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{book.price.toLocaleString()} đ</Text>
          {book.price && <Text style={styles.oldPrice}>{(book.price * 1.2).toLocaleString()} đ</Text>}
        </View>
        {book.categories && book.categories.length > 0 && (
          <Text style={styles.category} numberOfLines={1}>{
            Array.isArray(book.categories)
              ? (typeof book.categories[0] === 'object' && book.categories[0] && 'name' in book.categories[0]
                  ? book.categories[0].name
                  : String(book.categories[0]))
              : ''
          }</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    aspectRatio: 0.7,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  info: {
    padding: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  author: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 6,
  },
  oldPrice: {
    color: '#aaa',
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  category: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
});

export default BookGrid2Col; 