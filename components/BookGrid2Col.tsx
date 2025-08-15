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
  const discount = getDiscountPercent(book._id || '');
  const fakeOriginalPrice = Math.round(book.price / (1 - discount / 100));
  
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(book)} activeOpacity={0.85}>
      {/* Badge giảm giá ở góc trên bên phải */}
      <View style={styles.badgeTopRight}>
        <Text style={styles.badgeText}>-{discount}%</Text>
      </View>
      <View style={styles.imagesRow}>
        <Image
          source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || '' }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        {book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{book.price?.toLocaleString()} đ</Text>
          <Text style={styles.oldPrice}>{fakeOriginalPrice.toLocaleString()} đ</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 270,
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 8,
    padding: 8,
    elevation: 3,
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 170,
    backgroundColor: '#fff',
    position: 'relative',
  },
  mainImage: {
    width: 120,
    height: 165,
    borderRadius: 12,
    alignSelf: 'center',
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'space-between',
    height: 80,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    minHeight: 34,
  },
  author: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 6,
  },
  oldPrice: {
    color: '#aaa',
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginRight: 4,
    marginLeft: 0,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E53935',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});

export default BookGrid2Col; 