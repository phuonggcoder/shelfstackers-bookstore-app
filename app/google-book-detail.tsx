import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import googleBooksService, { GoogleBook } from '../services/googleBooksService';

const GoogleBookDetailScreen: React.FC = () => {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<GoogleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      loadBookDetails();
    }
  }, [bookId]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      const bookData = await googleBooksService.getBookById(bookId);
      setBook(bookData);
    } catch (error) {
      console.error('Error loading book details:', error);
      setError('Không thể tải thông tin sách');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyBook = async () => {
    if (book?.saleInfo?.buyLink) {
      try {
        await Linking.openURL(book.saleInfo.buyLink);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể mở liên kết mua sách');
      }
    } else {
      Alert.alert('Thông báo', 'Liên kết mua sách không có sẵn');
    }
  };

  const handlePreviewBook = async () => {
    if (book?.volumeInfo?.previewLink) {
      try {
        await Linking.openURL(book.volumeInfo.previewLink);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể mở xem trước sách');
      }
    } else {
      Alert.alert('Thông báo', 'Xem trước sách không có sẵn');
    }
  };

  const handleInfoLink = async () => {
    if (book?.volumeInfo?.infoLink) {
      try {
        await Linking.openURL(book.volumeInfo.infoLink);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể mở thông tin sách');
      }
    }
  };

  const formatPrice = (price?: { amount: number; currencyCode: string }) => {
    if (!price) return 'Không có thông tin giá';
    
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: price.currencyCode,
    });
    
    return formatter.format(price.amount);
  };

  const renderRating = () => {
    const rating = book?.volumeInfo?.averageRating;
    const ratingsCount = book?.volumeInfo?.ratingsCount;
    
    if (!rating) return null;

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= rating ? 'star' : 'star-outline'}
              size={20}
              color={star <= rating ? '#f39c12' : '#ddd'}
            />
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating.toFixed(1)} ({ratingsCount} đánh giá)
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Đang tải thông tin sách...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy sách'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBookDetails}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const volumeInfo = book.volumeInfo;
  const saleInfo = book.saleInfo;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {volumeInfo.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Book Cover */}
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: volumeInfo.imageLinks?.large ||
                   volumeInfo.imageLinks?.medium ||
                   volumeInfo.imageLinks?.small ||
                   volumeInfo.imageLinks?.thumbnail ||
                   'https://via.placeholder.com/300x400?text=No+Image'
            }}
            style={styles.coverImage}
            resizeMode="contain"
          />
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>Google Books</Text>
          </View>
        </View>

        {/* Book Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{volumeInfo.title}</Text>
          
          {volumeInfo.authors && (
            <Text style={styles.author}>
              Tác giả: {volumeInfo.authors.join(', ')}
            </Text>
          )}

          {renderRating()}

          {volumeInfo.publisher && (
            <Text style={styles.publisher}>
              Nhà xuất bản: {volumeInfo.publisher}
            </Text>
          )}

          {volumeInfo.publishedDate && (
            <Text style={styles.publishedDate}>
              Ngày xuất bản: {volumeInfo.publishedDate}
            </Text>
          )}

          {volumeInfo.pageCount && (
            <Text style={styles.pageCount}>
              Số trang: {volumeInfo.pageCount}
            </Text>
          )}

          {volumeInfo.language && (
            <Text style={styles.language}>
              Ngôn ngữ: {volumeInfo.language.toUpperCase()}
            </Text>
          )}

          {volumeInfo.categories && (
            <View style={styles.categoriesContainer}>
              <Text style={styles.categoriesTitle}>Thể loại:</Text>
              <View style={styles.categoriesList}>
                {volumeInfo.categories.map((category, index) => (
                  <View key={index} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Price Information */}
          {saleInfo && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceTitle}>Thông tin giá:</Text>
              {saleInfo.listPrice && (
                <Text style={styles.price}>
                  Giá niêm yết: {formatPrice(saleInfo.listPrice)}
                </Text>
              )}
              {saleInfo.retailPrice && (
                <Text style={styles.price}>
                  Giá bán: {formatPrice(saleInfo.retailPrice)}
                </Text>
              )}
              {!saleInfo.listPrice && !saleInfo.retailPrice && (
                <Text style={styles.price}>Miễn phí</Text>
              )}
            </View>
          )}

          {/* Description */}
          {volumeInfo.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Mô tả:</Text>
              <Text style={styles.description}>{volumeInfo.description}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {saleInfo?.buyLink && (
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyBook}>
              <Ionicons name="cart-outline" size={20} color="white" />
              <Text style={styles.buyButtonText}>Mua sách</Text>
            </TouchableOpacity>
          )}

          {volumeInfo.previewLink && (
            <TouchableOpacity style={styles.previewButton} onPress={handlePreviewBook}>
              <Ionicons name="eye-outline" size={20} color="#3498db" />
              <Text style={styles.previewButtonText}>Xem trước</Text>
            </TouchableOpacity>
          )}

          {volumeInfo.infoLink && (
            <TouchableOpacity style={styles.infoButton} onPress={handleInfoLink}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoButtonText}>Thông tin chi tiết</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  coverContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    position: 'relative',
  },
  coverImage: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  sourceBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  publisher: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  publishedDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pageCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  language: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976d2',
  },
  priceContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default GoogleBookDetailScreen;



