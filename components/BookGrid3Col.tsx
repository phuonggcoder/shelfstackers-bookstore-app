import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';

interface Props {
  book: Book;
  onPress?: (book: Book) => void;
}

const BookGrid3Col: React.FC<Props> = ({ book, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.85}>
      <Image source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{book.price.toLocaleString()} đ</Text>
          {book.price && <Text style={styles.oldPrice}>{(book.price * 1.2).toLocaleString()} đ</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    margin: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  image: {
    width: '100%',
    aspectRatio: 0.7,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  info: {
    padding: 7,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#222',
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
    fontSize: 13,
    marginRight: 4,
  },
  oldPrice: {
    color: '#aaa',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
});

export default BookGrid3Col; 