import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';

interface Props {
  book: Book;
  onPress?: (book: Book) => void;
}

const BookGrid4Col: React.FC<Props> = ({ book, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.85}>
      <Image source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
        <Text style={styles.price}>{book.price.toLocaleString()} đ</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  image: {
    width: '100%',
    aspectRatio: 0.7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  info: {
    padding: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#222',
    marginBottom: 1,
  },
  price: {
    color: '#FF5252', // màu đỏ
    fontWeight: 'bold',
    fontSize: 11,
  },
});

export default BookGrid4Col; 
