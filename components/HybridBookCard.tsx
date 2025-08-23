import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';

interface HybridBookCardProps {
  book: Book;
  onPress: (book: Book) => void;
  onAddToCart?: (book: Book) => void;
  onAddToWishlist?: (book: Book) => void;
  showSourceBadge?: boolean;
}

const HybridBookCard: React.FC<HybridBookCardProps> = ({
  book,
  onPress,
  onAddToCart,
  onAddToWishlist,
  showSourceBadge = true,
}) => {
  const handleAddToCart = () => {
    if (book.source === 'google_books') {
      Alert.alert(
        'Sách từ Google Books',
        'Sách này đến từ Google Books và không thể thêm vào giỏ hàng. Bạn có thể xem thông tin chi tiết hoặc mua từ Google.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xem chi tiết', onPress: () => onPress(book) },
        ]
      );
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(book);
    }
  };

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(book);
    }
  };

  const getSourceBadge = () => {
    if (!showSourceBadge) return null;

    if (book.source === 'google_books') {
      return (
        <View style={[styles.badge, styles.googleBadge]}>
          <Text style={styles.badgeText}>Google</Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, styles.localBadge]}>
        <Text style={styles.badgeText}>Local</Text>
      </View>
    );
  };

  const getPriceDisplay = () => {
    if (book.source === 'google_books') {
      if (book.price && book.price > 0) {
        return `${book.price.toLocaleString()} VNĐ`;
      }
      return 'Miễn phí';
    }
    
    return `${book.price.toLocaleString()} VNĐ`;
  };

  const getStockDisplay = () => {
    if (book.source === 'google_books') {
      return null;
    }
    
    if (book.stock > 0) {
      return (
        <Text style={styles.stockText}>
          Còn {book.stock} cuốn
        </Text>
      );
    }
    
    return (
      <Text style={styles.outOfStockText}>
        Hết hàng
      </Text>
    );
  };

  const getRatingDisplay = () => {
    if (book.averageRating && book.ratingsCount) {
      return (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>
            ⭐ {book.averageRating.toFixed(1)} ({book.ratingsCount})
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(book)}>
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: book.thumbnail || book.cover_image?.[0] || 'https://via.placeholder.com/150x200?text=No+Image'
          }}
          style={styles.image}
          resizeMode="cover"
        />
        {getSourceBadge()}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        
        {getRatingDisplay()}
        
        <Text style={styles.price}>
          {getPriceDisplay()}
        </Text>
        
        {getStockDisplay()}
        
        <View style={styles.actions}>
          {book.source === 'local' && onAddToCart && (
            <TouchableOpacity
              style={[styles.actionButton, book.stock <= 0 && styles.disabledButton]}
              onPress={handleAddToCart}
              disabled={book.stock <= 0}
            >
              <Text style={styles.actionText}>
                {book.stock > 0 ? '+ Giỏ hàng' : 'Hết hàng'}
              </Text>
            </TouchableOpacity>
          )}
          
          {book.source === 'google_books' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.googleButton]}
              onPress={() => onPress(book)}
            >
              <Text style={styles.actionText}>Xem chi tiết</Text>
            </TouchableOpacity>
          )}
          
          {onAddToWishlist && (
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={handleAddToWishlist}
            >
              <Text style={styles.wishlistText}>❤️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  localBadge: {
    backgroundColor: '#3498db',
  },
  googleBadge: {
    backgroundColor: '#e74c3c',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  ratingContainer: {
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    color: '#f39c12',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 6,
  },
  stockText: {
    fontSize: 11,
    color: '#27ae60',
    marginBottom: 8,
  },
  outOfStockText: {
    fontSize: 11,
    color: '#e74c3c',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  googleButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  actionText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  wishlistButton: {
    padding: 6,
  },
  wishlistText: {
    fontSize: 18,
  },
});

export default HybridBookCard;



