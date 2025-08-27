import React, { memo } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../types';

interface OptimizedBookItemProps {
  book: Book;
  onPress: (book: Book) => void;
  itemWidth: number;
  fixedHeight: number;
  itemPerRow: number;
}

const OptimizedBookItem = memo(({ 
  book, 
  onPress, 
  itemWidth, 
  fixedHeight, 
  itemPerRow 
}: OptimizedBookItemProps) => {
  const handlePress = () => {
    onPress(book);
  };

  const getImageSource = () => {
    if (book.thumbnail) {
      return { uri: book.thumbnail };
    }
    if (book.cover_image && book.cover_image.length > 0) {
      return { uri: book.cover_image[0] };
    }
    return { uri: 'https://i.imgur.com/gTzT0hA.jpeg' };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const renderGridItem = () => {
    const isSmallGrid = itemPerRow >= 3;
    
    return (
      <TouchableOpacity
        style={[
          styles.bookCard,
          { 
            width: itemWidth, 
            height: fixedHeight,
            marginBottom: 18,
            marginHorizontal: 4
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={getImageSource()}
            style={styles.bookImage}
            resizeMode="cover"
          />
          {book.discount_percentage && book.discount_percentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{book.discount_percentage}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bookInfo}>
          <Text 
            style={[styles.bookTitle, isSmallGrid && styles.smallBookTitle]} 
            numberOfLines={isSmallGrid ? 2 : 3}
          >
            {book.title}
          </Text>
          
          {book.author && (
            <Text 
              style={[styles.bookAuthor, isSmallGrid && styles.smallBookAuthor]} 
              numberOfLines={1}
            >
              {book.author}
            </Text>
          )}
          
          <View style={styles.priceContainer}>
            {book.discount_percentage && book.discount_percentage > 0 ? (
              <>
                <Text style={styles.originalPrice}>
                  {formatPrice(book.price)}
                </Text>
                <Text style={styles.discountedPrice}>
                  {formatPrice(book.price * (1 - book.discount_percentage / 100))}
                </Text>
              </>
            ) : (
              <Text style={styles.price}>
                {formatPrice(book.price)}
              </Text>
            )}
          </View>
          
          {book.stock !== undefined && (
            <View style={styles.stockContainer}>
              <Ionicons 
                name={book.stock > 0 ? "checkmark-circle" : "close-circle"} 
                size={12} 
                color={book.stock > 0 ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[
                styles.stockText, 
                { color: book.stock > 0 ? "#4CAF50" : "#F44336" }
              ]}>
                {book.stock > 0 ? `Còn ${book.stock}` : 'Hết hàng'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return renderGridItem();
});

OptimizedBookItem.displayName = 'OptimizedBookItem';

const styles = StyleSheet.create({
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '60%',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookInfo: {
    padding: 8,
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  smallBookTitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  smallBookAuthor: {
    fontSize: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 10,
    marginLeft: 4,
  },
});

export default OptimizedBookItem;





