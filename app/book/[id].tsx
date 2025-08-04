import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BookCard from '../../components/BookCard';
import CustomLoginDialog from '../../components/BottomAlert';
import CartAddedDialog from '../../components/CartAddedDialog';
import CartIconWithBadge from '../../components/CartIconWithBadge';
import CustomOutOfStockAlert from '../../components/CustomOutOfStockAlert';
import ReviewCard from '../../components/ReviewCard';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { addToCart, addToWishlist, getBookById, getBooksByCategory, getWishlist, removeFromWishlist } from '../../services/api';
import ReviewService, { Review, ReviewSummary } from '../../services/reviewService';
import { Book } from '../../types';
import { formatVND } from '../../utils/format';
import { getUserId } from '../../utils/reviewUtils';

// Helper function to format publication date
const formatPublicationDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 25) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const BookDetailsScreen = () => {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);

  const footerAnim = useRef(new Animated.Value(0)).current;
  const lastOffsetY = useRef(0);
  const { token, user } = useAuth();
  const [addingCart, setAddingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Animated overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' });

  const [outOfStock, setOutOfStock] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [quantity, setQuantity] = useState(1);
  const intervalRef = useRef<any>(null);
  const handleIncrease = () => setQuantity(q => Math.min(q + 1, 99));
  const handleDecrease = () => setQuantity(q => Math.max(q - 1, 1));
  const startHold = (type: 'inc' | 'dec') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (type === 'inc') handleIncrease();
      else handleDecrease();
    }, 120);
  };
  const stopHold = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const { cartCount, cartJustAdded, setCartJustAdded, fetchCartCount, hasFetched } = useCart();
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);

  const [showQtyModal, setShowQtyModal] = useState(false);
  const [inputQty, setInputQty] = useState(quantity.toString());
  const [qtyError, setQtyError] = useState('');
  const inputQtyRef = useRef<TextInput>(null);
  const maxQty = book?.stock || 99;
  
  // Review summary state
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [loadingReviewSummary, setLoadingReviewSummary] = useState(false);
  
  // Review list state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  
  // Description state
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const [isLongContent, setIsLongContent] = useState(false);

  // Memoize values to prevent unnecessary re-renders
  const tagsStyles = useMemo(() => ({
    b: { fontWeight: 'bold' as const },
    strong: { fontWeight: 'bold' as const },
    i: { fontStyle: 'italic' as const },
    em: { fontStyle: 'italic' as const },
    p: { marginBottom: 10, lineHeight: 22, color: '#333' },
    br: { height: 10 },
    h1: { fontSize: 24, fontWeight: 'bold' as const, marginBottom: 12 },
    h2: { fontSize: 20, fontWeight: 'bold' as const, marginBottom: 10 },
    ul: { marginBottom: 10, paddingLeft: 20 },
    li: { marginBottom: 6 },
  }), []);

  const contentWidth = useMemo(() => width, [width]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const diff = offsetY - lastOffsetY.current;

    if (diff > 0 && offsetY > 100) { // Scrolling down
      Animated.timing(footerAnim, {
        toValue: 100 + insets.bottom,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (diff < 0 || offsetY <= 0) { // Scrolling up or at the top
      Animated.timing(footerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    lastOffsetY.current = offsetY;
  };

  useEffect(() => {
    if (id) {
      const fetchBook = async () => {
        try {
          const fetchedBook = await getBookById(id as string);
          setBook(fetchedBook);
        } catch (error) {
          console.error('Failed to fetch book details:', error);
        }
      };
      fetchBook();
    }
  }, [id]);

  useEffect(() => {
    if (book && token) {
      const checkFavorite = async () => {
        try {
          const books = await getWishlist(token);
          setIsFavorite(books.some((b: any) => b._id === book._id));
        } catch (error) {
          console.error('Error checking favorite status:', error);
          setIsFavorite(false);
        }
      };
      checkFavorite();
    }
  }, [book, token]);

  useEffect(() => {
    if (book && (book.stock === 0 || book.stock === undefined)) {
      setOutOfStock(true);
    }
  }, [book]);

  useEffect(() => {
    if (book && book.categories && book.categories.length > 0) {
      const fetchRelated = async () => {
        try {
          const books = await getBooksByCategory(book.categories[0]._id);
          // Loại bỏ sách hiện tại khỏi danh sách liên quan
          setRelatedBooks(books.filter(b => b._id !== book._id));
        } catch (e) {
          setRelatedBooks([]);
        }
      };
      fetchRelated();
    }
  }, [book]);

  // Fetch review summary and reviews when book is loaded
  useEffect(() => {
    if (book && token) {
      const fetchReviewData = async () => {
        try {
          setLoadingReviewSummary(true);
          setLoadingReviews(true);
          setReviewError(null);
          
          // Fetch review summary
          const summary = await ReviewService.getProductReviewSummary(book._id, token);
          setReviewSummary(summary);
          
          // Fetch first few reviews
          const reviewsResponse = await ReviewService.getProductReviews(book._id, 1, 3, token);
          setReviews(reviewsResponse.reviews);
        } catch (error) {
          console.error('Error fetching review data:', error);
          setReviewError('Không thể tải đánh giá. Vui lòng thử lại sau.');
        } finally {
          setLoadingReviewSummary(false);
          setLoadingReviews(false);
        }
      };
      fetchReviewData();
    }
  }, [book, token]);

  // Show/hide overlay with animation when alert changes
  useEffect(() => {
    if (showLoginAlert) {
      setOverlayVisible(true);
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setOverlayVisible(false));
    }
  }, [showLoginAlert]);

  useEffect(() => {
    if (token && !hasFetched) fetchCartCount(token);
  }, [token, hasFetched]);

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  const images = (() => {
    const allImages: string[] = [];
    
    // Add thumbnail first if available
    if (book.thumbnail && book.thumbnail.trim() !== '') {
      allImages.push(book.thumbnail);
    }
    
    // Add all cover images
    if (book.cover_image && Array.isArray(book.cover_image)) {
      book.cover_image.forEach(img => {
        if (img && img.trim() !== '' && !allImages.includes(img)) {
          allImages.push(img);
        }
      });
    }
    
    // If no images found, use default
    if (allImages.length === 0) {
      allImages.push('https://i.imgur.com/gTzT0hA.jpeg');
    }
    
    console.log('Book images:', {
      thumbnail: book.thumbnail,
      cover_image: book.cover_image,
      finalImages: allImages
    });
    
    return allImages;
  })();

  // Helper function to validate image URL
  const getValidImageUrl = (url: string) => {
    if (!url || url.trim() === '') return 'https://i.imgur.com/gTzT0hA.jpeg';
    return url;
  };

  // Fallback image component
  const FallbackImage = () => (
    <View style={[styles.sliderImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons name="image-outline" size={60} color="#ccc" />
      <Text style={{ color: '#ccc', marginTop: 10 }}>Không có hình ảnh</Text>
    </View>
  );

  const onMomentumScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const truncatedHtml = isExpanded ? book.description : book.description.slice(0, 200) + '...';

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 1500);
  };

  const handleFavorite = async (bookId: string | string[] | undefined) => {
    if (!token || !bookId) {
      setShowLoginDialog(true);
      return;
    }

    
    try {
      if (isFavorite) {
        // Xóa khỏi wishlist
        await removeFromWishlist(token, bookId as string);
        setIsFavorite(false);
        showToast('Đã xóa khỏi danh sách yêu thích');
      } else {
        // Thêm vào wishlist
        const res = await addToWishlist(token, bookId as string);
        console.log('Add to wishlist response:', res);
        setIsFavorite(true);
        showToast('Đã thêm vào danh sách yêu thích');
      }
    } catch (e: any) {
      console.error('Favorite error:', e);
      showToast('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!token) {
      setShowLoginDialog(true);
      return;
    }
    if (!book) return;
    setAddingCart(true);
    try {
      await addToCart(token, book._id, quantity);
      setShowCartDialog(true);
      fetchCartCount(token);
      setCartJustAdded(true);
      setTimeout(() => setCartJustAdded(false), 500);
    } finally {
      setAddingCart(false);
    }
  };

  // Buy now: sang trang order review
  const handleBuyNow = () => {
    if (!token) {
      setShowLoginDialog(true);
      return;
    }
    if (!book) return;
    
    // Add book to cart first, then navigate to order review
    const addBookToCartAndNavigate = async () => {
      try {
        await addToCart(token, book._id, quantity);
        // Navigate to order review with the book ID
        router.push({ 
          pathname: '/order-review', 
          params: { bookId: book._id } 
        });
      } catch (error) {
        console.error('Error adding book to cart for buy now:', error);
        Alert.alert(t('error'), t('cannotAddProductToCart'));
      }
    };
    
    addBookToCartAndNavigate();
  };

  const openFullscreenImage = (index: number) => {
    setFullscreenImageIndex(index);
    setShowFullscreenImage(true);
  };

  // Khi nhấn vào số lượng
  const handleQtyPress = () => {
    setInputQty(quantity.toString());
    setQtyError('');
    setShowQtyModal(true);
    setTimeout(() => inputQtyRef.current?.focus(), 300);
  };
  const handleQtyConfirm = () => {
    const val = parseInt(inputQty, 10);
    if (isNaN(val) || val < 1) {
      setQtyError(t('quantityMustBeGreaterThanZero'));
      return;
    }
    if (val > maxQty) {
      setQtyError(t('onlyLeftProducts', { count: maxQty }));
      return;
    }
    setQuantity(val);
    setShowQtyModal(false);
  };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      {/* Overlay: phủ toàn màn hình, click vào sẽ tắt alert, nằm dưới BottomAlert */}
      {overlayVisible && (
        <TouchableWithoutFeedback onPress={() => setShowLoginAlert(false)}>
          <Animated.View
            pointerEvents="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              opacity: overlayAnim,
              zIndex: 10,
            }}
          />
        </TouchableWithoutFeedback>
      )}
      {/* BottomAlert nằm trên overlay */}
      <CustomLoginDialog
        visible={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLogin={() => {
          setShowLoginDialog(false);
          router.push('/(auth)/login');
        }}
        message={t('loginRequiredForFeature')}
      />
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: false, // Show header background
          headerStyle: {
            backgroundColor: '#fff', // White background
          },
          headerTitle: '', // No title
          headerTintColor: 'black', // Make back icon black
          headerShadowVisible: true, // Show subtle shadow/border (Expo Router/NativeStack)
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={{ marginRight: 15 }} onPress={() => handleFavorite(id)}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#4A90E2' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 15 }}>
                <Ionicons name="share-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/cart')}>
                <View style={{ alignItems: 'center', height: 40, justifyContent: 'center' }}>
                  <CartIconWithBadge count={cartCount} animated={cartJustAdded} />
                </View>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} onScroll={handleScroll} scrollEventThrottle={16}>
        {/* Custom Header: Nổi trên cùng */}
        <View style={{
          position: 'absolute',
          top: insets.top - 20,
          left: 0,
          right: 0,
          zIndex: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 10,
          height: 10 + insets.top,
          backgroundColor: '#fff',
          opacity: 1,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: 'transparent', borderRadius: 20 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={{ marginRight: 15, padding: 8, backgroundColor: 'transparent', borderRadius: 20 }} onPress={() => handleFavorite(id)}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#4A90E2' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginRight: 15, padding: 8, backgroundColor: 'transparent', borderRadius: 20 }}>
              <Ionicons name="share-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/cart')}>
              <View style={{ alignItems: 'center', height: 40, justifyContent: 'center' }}>
                <CartIconWithBadge count={cartCount} animated={cartJustAdded} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {images.length > 1 ? (
          <View style={styles.sliderContainer}>
            {/* Debug info in development */}
            {/* {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>Debug: {images.length} images found</Text>
                <Text style={styles.debugText}>Current: {activeIndex + 1}</Text>
              </View>
            )} */}
            <FlatList
              ref={flatListRef}
              data={images}
              renderItem={({ item, index }) => (
                <View style={[styles.slideContainer, { width }]}>
                  <TouchableOpacity 
                    onPress={() => openFullscreenImage(index)}
                    activeOpacity={0.9}
                    style={styles.imageTouchable}
                  >
                    {item && item.trim() !== '' ? (
                      <Image
                        source={{ uri: getValidImageUrl(item) }}
                        style={styles.sliderImage}
                        contentFit="cover"
                        transition={300}
                        onError={(error) => {
                          console.log('Image load error:', error);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', item);
                        }}
                      />
                    ) : (
                      <FallbackImage />
                    )}
                  </TouchableOpacity>
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>{index + 1} / {images.length}</Text>
                  </View>
                </View>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              keyExtractor={(item, index) => `${item}-${index}`}
              decelerationRate="fast"
              snapToInterval={width}
              snapToAlignment="center"
            />
            <View style={styles.pagination}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index ? styles.activeDot : null,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.sliderContainer}>
            <View style={[styles.slideContainer, { width }]}>
              <TouchableOpacity 
                onPress={() => openFullscreenImage(0)}
                activeOpacity={0.9}
                style={styles.imageTouchable}
              >
                {images[0] && images[0].trim() !== '' ? (
                  <Image
                    source={{ uri: getValidImageUrl(images[0]) }}
                    style={styles.sliderImage}
                    contentFit="cover"
                    transition={300}
                    onError={(error) => {
                      console.log('Single image load error:', error);
                    }}
                    onLoad={() => {
                      console.log('Single image loaded successfully:', images[0]);
                    }}
                  />
                ) : (
                  <FallbackImage />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
          {/* Title, price, discount badge ra ngoài, ngay dưới hình ảnh */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 6, textAlign: 'left' }}>{book.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#E53935', marginRight: 10 }}>{formatVND(book.price)}</Text>
            <View style={{ backgroundColor: '#E53935', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 0 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>-{getDiscountPercent(book._id)}%</Text>
            </View>
          </View>
        </View>

        {/* Author section moved above the grey box */}
        <View style={styles.authorContainer}>
          <Text style={styles.sectionTitle}>Tác giả</Text>
          <View style={styles.authorInfo}>
            <View>
              <Text style={styles.authorName}>{truncateText(book.author, 30)}</Text>
            </View>
          </View>
        </View>

        {/* Gộp mô tả và thông tin sản phẩm */}
        <View style={styles.infoSectionBox}>
          <View style={styles.detailTable}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thể loại:</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                {book.categories && book.categories.length > 0 ? truncateText(book.categories.map((c: any) => c.name).join(', '), 20) : '-'}
              </Text>
            </View>
            <View style={styles.separator} />
            {(book as any).supplier && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nhà cung cấp:</Text>
                  <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                    {truncateText((book as any).supplier, 20)}
                  </Text>
                </View>
                <View style={styles.separator} />
              </>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nhà xuất bản:</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                {truncateText(book.publisher || '-', 20)}
              </Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày xuất bản:</Text>
              <Text style={styles.detailValue}>{formatPublicationDate(book.publication_date)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngôn ngữ:</Text>
              <Text style={styles.detailValue}>{book.language || '-'}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tồn kho:</Text>
              <Text style={styles.detailValue}>{book.stock}</Text>
            </View>
          </View>
          
          {/* Mô tả với giới hạn 10 dòng và hiệu ứng fade */}
          {(() => {
            const LINE_HEIGHT = 22; // lineHeight from the Text style
            const MAX_LINES = 10; // Giới hạn 10 dòng
            const SHOW_LINES = 12; // Hiển thị 12 dòng nếu nội dung dài
            const FADE_START_LINE = 10; // Bắt đầu fade từ dòng 11
            const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;
            const SHOW_HEIGHT = LINE_HEIGHT * SHOW_LINES;
            
            const handleDescriptionLayout = (event: any) => {
              const { height } = event.nativeEvent.layout;
              setDescriptionHeight(height);
              setIsLongContent(height > MAX_HEIGHT);
            };
            
            const plainText = book.description?.replace(/<[^>]+>/g, '') || '';
            
            // Estimate if content is long based on character count and line breaks
            const estimatedLines = Math.ceil(plainText.length / 50) + (plainText.match(/\n/g) || []).length;
            const isEstimatedLong = estimatedLines > 8; // Nếu > 8 dòng thì coi là dài
            
            // Use estimated length for initial render, then use actual measurement
            const shouldShowExtended = isLongContent || (isEstimatedLong && descriptionHeight === 0);
            
            return (
              <>
                {/* Container cho mô tả và fade effect */}
                <View style={{ position: 'relative', marginBottom: 8 }}>
                  <Text 
                    style={{ 
                      fontSize: 15, 
                      color: '#333', 
                      lineHeight: LINE_HEIGHT, 
                      textAlign: 'justify',
                      ...(shouldShowExtended && { height: SHOW_HEIGHT })
                    }}
                    onLayout={handleDescriptionLayout}
                    numberOfLines={shouldShowExtended ? SHOW_LINES : undefined}
                  >
                    {plainText}
                  </Text>
                  
                  {/* Fading effect overlay for long content - fade từ dòng 11-13 */}
                  {shouldShowExtended && (
                    <View style={styles.fadeOverlay}>
                      <LinearGradient
                        colors={['transparent', '#F3F4F8', '#F3F4F8']}
                        locations={[0, 0.3, 1]}
                        style={styles.fadeGradient}
                      />
                    </View>
                  )}
                </View>
                
                {/* Button luôn hiển thị nếu có nội dung mô tả - tách riêng khỏi fade effect */}
                {plainText.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => router.push({ pathname: '/book-detail-info', params: { id: book._id } })} 
                    style={{ alignSelf: 'center', marginBottom: 20, backgroundColor: '#f6f6fa', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#5E5CE6', fontWeight: 'bold', fontSize: 15 }}>Xem thông tin chi tiết</Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </View>

        <View style={{ height: 10 }} />
        
        {/* Review Section */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>Đánh giá sản phẩm</Text>
            <TouchableOpacity 
              style={styles.viewAllReviewsButton}
              onPress={() => router.push({
                pathname: '/product-reviews',
                params: { productId: id as string }
              })}
            >
              <Text style={styles.viewAllReviewsText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={16} color="#3255FB" />
            </TouchableOpacity>
          </View>
          
          {/* Review Summary */}
          {loadingReviewSummary ? (
            <View style={styles.reviewPlaceholder}>
              <ActivityIndicator size="small" color="#3255FB" />
              <Text style={styles.reviewPlaceholderText}>Đang tải đánh giá...</Text>
            </View>
          ) : reviewSummary && reviewSummary.totalReviews > 0 ? (
            <View style={styles.reviewSummary}>
              <View style={styles.reviewRating}>
                <Text style={styles.reviewRatingText}>{reviewSummary.averageRating.toFixed(1)}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= reviewSummary.averageRating ? "star" : "star-outline"}
                      size={16}
                      color={star <= reviewSummary.averageRating ? "#FFD700" : "#CCC"}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCountText}>
                  {reviewSummary.totalReviews} đánh giá
                </Text>
              </View>
              <View style={styles.reviewDistribution}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewSummary.ratingCounts[rating as keyof typeof reviewSummary.ratingCounts] || 0;
                  const percentage = reviewSummary.totalReviews > 0 
                    ? (count / reviewSummary.totalReviews) * 100 
                    : 0;
                  return (
                    <View key={rating} style={styles.ratingBar}>
                      <Text style={styles.ratingLabel}>{rating}★</Text>
                      <View style={styles.ratingBarContainer}>
                        <View 
                          style={[
                            styles.ratingBarFill, 
                            { width: `${percentage}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.ratingCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.reviewPlaceholder}>
              <Ionicons name="star-outline" size={48} color="#CCC" />
              <Text style={styles.reviewPlaceholderText}>Chưa có đánh giá nào</Text>
              <Text style={styles.reviewPlaceholderSubtext}>
                Hãy là người đầu tiên đánh giá sản phẩm này
              </Text>
              {user && (
                <TouchableOpacity 
                  style={styles.writeReviewButtonPlaceholder}
                  onPress={() => router.push({
                    pathname: '/product-reviews',
                    params: { productId: id as string }
                  })}
                >
                  <Ionicons name="pencil" size={18} color="white" />
                  <Text style={styles.writeReviewButtonPlaceholderText}>Viết đánh giá đầu tiên</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Review List */}
          {loadingReviews ? (
            <View style={styles.reviewListLoading}>
              <ActivityIndicator size="small" color="#3255FB" />
              <Text style={styles.reviewListLoadingText}>Đang tải đánh giá...</Text>
            </View>
          ) : reviewError ? (
            <View style={styles.reviewError}>
              <Ionicons name="alert-circle-outline" size={24} color="#E53935" />
              <Text style={styles.reviewErrorText}>{reviewError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  if (book && token) {
                    const fetchReviewData = async () => {
                      try {
                        setLoadingReviews(true);
                        setReviewError(null);
                        const reviewsResponse = await ReviewService.getProductReviews(book._id, 1, 3, token);
                        setReviews(reviewsResponse.reviews);
                      } catch (error) {
                        console.error('Error retrying review fetch:', error);
                        setReviewError('Không thể tải đánh giá. Vui lòng thử lại sau.');
                      } finally {
                        setLoadingReviews(false);
                      }
                    };
                    fetchReviewData();
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : reviews.length > 0 ? (
            <View style={styles.reviewListContainer}>
              <Text style={styles.reviewListTitle}>Đánh giá gần đây</Text>
              {reviews.map((review) => (
                <View key={review._id} style={styles.reviewItem}>
                  <ReviewCard 
                    review={review}
                    isOwnReview={user?._id === getUserId(review)}
                  />
                </View>
              ))}
              {reviewSummary && reviewSummary.totalReviews > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreReviewsButton}
                  onPress={() => router.push({
                    pathname: '/product-reviews',
                    params: { productId: id as string }
                  })}
                >
                  <Text style={styles.viewMoreReviewsText}>
                    Xem thêm {reviewSummary.totalReviews - 3} đánh giá khác
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#3255FB" />
                </TouchableOpacity>
              )}
            </View>
          ) : reviewSummary && reviewSummary.totalReviews === 0 ? (
            <View style={styles.reviewEmptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="#CCC" />
              <Text style={styles.reviewEmptyStateText}>Chưa có đánh giá nào</Text>
              <Text style={styles.reviewEmptyStateSubtext}>
                Hãy là người đầu tiên đánh giá sản phẩm này
              </Text>
              {user && (
                <TouchableOpacity 
                  style={styles.writeReviewButtonEmpty}
                  onPress={() => router.push({
                    pathname: '/product-reviews',
                    params: { productId: id as string }
                  })}
                >
                  <Ionicons name="pencil" size={18} color="white" />
                  <Text style={styles.writeReviewButtonEmptyText}>Viết đánh giá đầu tiên</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          
          {/* Write Review Button */}
          {user && reviewSummary && reviewSummary.totalReviews > 0 && !loadingReviews && reviews.length === 0 && (
            <TouchableOpacity 
              style={styles.writeReviewButton}
              onPress={() => router.push({
                pathname: '/product-reviews',
                params: { productId: id as string }
              })}
            >
              <Ionicons name="pencil" size={20} color="white" />
              <Text style={styles.writeReviewButtonText}>Viết đánh giá</Text>
            </TouchableOpacity>
          )}
          
          {/* Write Review Button for no reviews case */}
          {user && !loadingReviewSummary && !reviewSummary && (
            <TouchableOpacity 
              style={styles.writeReviewButton}
              onPress={() => router.push({
                pathname: '/product-reviews',
                params: { productId: id as string }
              })}
            >
              <Ionicons name="pencil" size={20} color="white" />
              <Text style={styles.writeReviewButtonText}>Viết đánh giá</Text>
            </TouchableOpacity>
          )}
          
          {/* Write Review Button for error case */}
          {user && reviewError && (
            <TouchableOpacity 
              style={styles.writeReviewButton}
              onPress={() => router.push({
                pathname: '/product-reviews',
                params: { productId: id as string }
              })}
            >
              <Ionicons name="pencil" size={20} color="white" />
              <Text style={styles.writeReviewButtonText}>Viết đánh giá</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sách liên quan */}
        {relatedBooks.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>{t('relatedBooks')}</Text>
            <FlatList
              data={relatedBooks}
              renderItem={({ item }) => <BookCard book={item} />}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </ScrollView>
      <Animated.View
        style={[
          styles.footer,
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom,
            transform: [{ translateY: footerAnim }],
            zIndex: 2,
          },
        ]}
      >
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={styles.qtyGroup}>
            <TouchableOpacity
              style={[styles.qtyBtn, quantity === 1 && { opacity: 0.5 }]}
              onPress={handleDecrease}
              onPressIn={() => startHold('dec')}
              onPressOut={stopHold}
              disabled={quantity === 1}
            >
              <Text style={{ color: '#bbb', fontSize: 22, fontWeight: 'bold' }}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={handleIncrease}
              onPressIn={() => startHold('inc')}
              onPressOut={stopHold}
            >
              <Text style={{ color: '#bbb', fontSize: 22, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          onPress={handleAddToCart}
          disabled={addingCart || showLoginAlert || outOfStock}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#1890FF', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
            {t('addToCart')}{"\n"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 130, backgroundColor: '#1890FF', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          onPress={handleBuyNow}
          disabled={showLoginAlert || outOfStock}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('buyNow')}</Text>
        </TouchableOpacity>
      </Animated.View>
      {insets.bottom > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: insets.bottom,
            backgroundColor: '#FFFFFF',
            zIndex: 1,
          }}
        />
      )}
      {toast.visible && (
        <View style={{ position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
          <View style={{ backgroundColor: '#5E5CE6', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
            <Ionicons name="checkmark" size={24} color="#fff" style={{ marginRight: 10 }} />
            <Text style={{ color: '#fff', fontSize: 16 }}>{toast.message}</Text>
          </View>
        </View>
      )}
      <CustomOutOfStockAlert visible={outOfStock} onClose={() => router.back()} />
      <CartAddedDialog visible={showCartDialog} onHide={() => setShowCartDialog(false)} />
      
      {/* Fullscreen Image Modal */}
      <Modal
        visible={showFullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullscreenImage(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity 
            style={styles.fullscreenCloseButton}
            onPress={() => setShowFullscreenImage(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={images}
            renderItem={({ item, index }) => (
              <View style={[styles.fullscreenSlide, { width }]}>
                <Image
                  source={{ uri: getValidImageUrl(item) }}
                  style={styles.fullscreenImage}
                  contentFit="contain"
                  transition={300}
                />
                <View style={styles.fullscreenCounter}>
                  <Text style={styles.fullscreenCounterText}>{index + 1} / {images.length}</Text>
                </View>
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={fullscreenImageIndex}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item, index) => `${item}-${index}`}
          />
        </View>
      </Modal>

      {/* Modal nhập số lượng */}
      <Modal visible={showQtyModal} transparent animationType="fade" onRequestClose={() => setShowQtyModal(false)}>
        <View style={styles.qtyModalOverlay}>
          <View style={styles.qtyModalBox}>
            <Text style={styles.qtyModalTitle}>Nhập số lượng</Text>
            <TextInput
              ref={inputQtyRef}
              style={styles.qtyModalInput}
              keyboardType="number-pad"
              value={inputQty}
              onChangeText={setInputQty}
              maxLength={3}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleQtyConfirm}
            />
            {qtyError ? <Text style={styles.qtyModalError}>{qtyError}</Text> : null}
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
              <TouchableOpacity style={styles.qtyModalBtn} onPress={() => setShowQtyModal(false)}><Text style={styles.qtyModalBtnText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.qtyModalBtn, { backgroundColor: '#5E5CE6' }]} onPress={handleQtyConfirm}><Text style={[styles.qtyModalBtnText, { color: '#fff' }]}>Xác nhận</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    height: 400,
    marginTop: 80,
    backgroundColor: '#f8f9fa',
  },
  slideContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#5E5CE6',
    transform: [{ scale: 1.2 }],
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#F3F4F8',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  readMore: {
    color: '#5E5CE6',
    fontWeight: 'bold',
    marginTop: 5,
  },
  authorContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorSubtitle: {
    color: '#666',
  },
  profileButton: {
    marginLeft: 'auto',
    backgroundColor: '#E8E8FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#5E5CE6',
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  oldPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    height: 68,
    paddingHorizontal: 0,
    borderRadius: 0,
    gap: 0,
    paddingTop: 0,
  },
  qtyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 120,
    justifyContent: 'center',
    height: 40,
    marginLeft: 8, // nhỏ lại cho cân đối
    marginRight: 8,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 8,
  },
  cartBtnBlack: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buyBtnPurple: {
    backgroundColor: '#5E5CE6',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullscreenSlide: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
  fullscreenCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  fullscreenCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
  },
  fadeOut: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    zIndex: 2,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  relatedSection: {
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 0,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoSectionBox: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#F3F4F8',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  infoTable: {
    width: '100%',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  descTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  descText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify',
  },
  qtyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  qtyModalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    minHeight: 220,
  },
  qtyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  qtyModalInput: {
    borderWidth: 1,
    borderColor: '#5E5CE6',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    padding: 12,
    width: 120,
    textAlign: 'center',
    marginBottom: 8,
  },
  qtyModalError: {
    color: '#E53935',
    marginTop: 4,
  },
  qtyModalBtn: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  qtyModalBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  detailPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailTable: {
    width: '100%',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginVertical: 0,
  },
  cartBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllReviewsText: {
    fontSize: 14,
    color: '#3255FB',
    fontWeight: '500',
  },
  reviewPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  reviewPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  reviewPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  // Review Summary Styles
  reviewSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  reviewRating: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#666',
  },
  reviewDistribution: {
    gap: 8,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#666',
    width: 20,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
  // Review List Styles
  reviewListContainer: {
    marginTop: 16,
  },
  reviewListLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reviewListLoadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  reviewError: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginTop: 16,
  },
  reviewErrorText: {
    fontSize: 14,
    color: '#E53935',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginTop: 16,
  },
  reviewEmptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  reviewEmptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  writeReviewButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  writeReviewButtonEmptyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  writeReviewButtonPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  writeReviewButtonPlaceholderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reviewItem: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewMoreReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreReviewsText: {
    fontSize: 14,
    color: '#3255FB',
    fontWeight: '500',
    marginRight: 4,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  writeReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 66, // 3 dòng cuối (22 * 3 = 66)
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    zIndex: 1,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 66, // 3 dòng cuối (22 * 3 = 66)
  },
});

export default BookDetailsScreen;