import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';

interface Props {
  book: Book;
  onPress?: (book: Book) => void;
}

// Badge giảm giá random cố định theo _id
function getDiscountPercent(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Giới hạn từ 10 đến 50%
  const percent = Math.abs(hash % 41) + 10;
  return percent;
}

const BookGrid3Col: React.FC<Props> = ({ book, onPress }) => {
  const percent = getDiscountPercent(book._id || '');
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.85}>
      <Image source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{book.price.toLocaleString()} đ</Text>
          
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
    minHeight: 56,
    justifyContent: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#222',
    marginBottom: 2,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    color: '#FF5252', // màu đỏ
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 4,
  },
  badgeDiscount: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    alignSelf: 'center',
  },
  badgeDiscountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default BookGrid3Col; 
