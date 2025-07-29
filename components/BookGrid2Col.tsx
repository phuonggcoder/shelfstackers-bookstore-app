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

const BookGrid2Col: React.FC<Props> = ({ book, onPress }) => {
  const percent = getDiscountPercent(book._id || '');
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.85}>
      {/* Badge giảm giá + hash id */}
      {book._id && (
        <View style={styles.badgeDiscount}>
          <Text style={styles.badgeDiscountText}>-{percent}%</Text>
        </View>
      )}
      <Image source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        {book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{book.price.toLocaleString()} đ</Text>
          {book.price && <Text style={styles.oldPrice}>{(book.price * 1.2).toLocaleString()} đ</Text>}
        </View>
        {book.categories && book.categories.length > 0 && (
          <Text style={styles.category} numberOfLines={1}>
            {Array.isArray(book.categories)
              ? (typeof book.categories[0] === 'object' && book.categories[0] && 'name' in book.categories[0]
                  ? book.categories[0].name
                  : String(book.categories[0]))
              : ''}
          </Text>
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
    height: 300,
  },
  image: {
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 0.7,
    maxHeight: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  info: {
    padding: 10,
    minHeight: 90,
    justifyContent: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
    minHeight: 44, // Đảm bảo luôn chiếm 2 dòng
    lineHeight: 22,
  },
  author: {
    fontSize: 13,
    color: '#8D6E63', // nâu nhạt
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    color: '#FF5252', // màu đỏ
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
  badgeDiscount: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  badgeDiscountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default BookGrid2Col; 