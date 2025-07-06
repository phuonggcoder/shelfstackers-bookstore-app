import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomAlert from '../../components/BottomAlert';
import CartAddedDialog from '../../components/CartAddedDialog';
import CartIconWithBadge from '../../components/CartIconWithBadge';
import CustomOutOfStockAlert from '../../components/CustomOutOfStockAlert';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { addToCart, addToWishlist, getBookById } from '../../services/api';
import { Book } from '../../types';
import { formatVND, getBookCoverImageUrl } from '../../utils/format';

const BookDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);

  const footerAnim = useRef(new Animated.Value(0)).current;
  const lastOffsetY = useRef(0);
  const { token } = useAuth();
  const [addingCart, setAddingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const router = useRouter();

  // Animated overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' });

  const [outOfStock, setOutOfStock] = useState(false);

  const { cartCount, cartJustAdded, setCartJustAdded, fetchCartCount, hasFetched } = useCart();
  const [showCartDialog, setShowCartDialog] = useState(false);

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
          const res = await fetch('https://server-shelf-stacker.onrender.com/api/wishlist', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          const books = Array.isArray(data) ? data : data.books || [];
          setIsFavorite(books.some((b: any) => b._id === book._id));
        } catch { }
      };
      checkFavorite();
    }
  }, [book, token]);

  useEffect(() => {
    if (book && (book.stock === 0 || book.stock === undefined)) {
      setOutOfStock(true);
    }
  }, [book]);

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

  const images = book.cover_image && book.cover_image.length > 0
    ? book.cover_image.filter(img => img && img.trim() !== '')
    : [getBookCoverImageUrl(book)]; // Use cover image function

  // Helper function to validate image URL
  const getValidImageUrl = (url: string) => {
    if (!url || url.trim() === '') return 'https://i.imgur.com/gTzT0hA.jpeg';
    return url;
  };

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
      setShowLoginAlert(true);
      return;
    }
    if (isFavorite) {
      showToast('Đã thêm vào danh sách yêu thích');
      return;
    }
    try {
      const res = await addToWishlist(token, bookId as string);
      console.log('Add to wishlist response:', res);
      setIsFavorite(true);
      showToast('Đã thêm vào danh sách yêu thích');
    } catch (e: any) {
      console.error('Favorite error:', e);
      showToast('Không thể thêm vào danh sách yêu thích');
    }
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!token) {
      setShowLoginAlert(true);
      return;
    }
    if (!book) return;
    setAddingCart(true);
    try {
      await addToCart(token, book._id, 1);
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
      setShowLoginAlert(true);
      return;
    }
    if (!book) return;
    
    // Add book to cart first, then navigate to order review
    const addBookToCartAndNavigate = async () => {
      try {
        await addToCart(token, book._id, 1);
        // Navigate to order review with the book ID
        router.push({ 
          pathname: '/order-review', 
          params: { bookId: book._id } 
        });
      } catch (error) {
        console.error('Error adding book to cart for buy now:', error);
        Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng.');
      }
    };
    
    addBookToCartAndNavigate();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
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
      <BottomAlert
        visible={showLoginAlert}
        title="Bạn chưa đăng nhập"
        onHide={() => setShowLoginAlert(false)}
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
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#E53935' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 15 }}>
                <Ionicons name="share-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/cart')}>
                <CartIconWithBadge count={cartCount} animated={cartJustAdded} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Custom Header: Nổi trên cùng */}
        <View style={{
          position: 'absolute',
          top: insets.top || 30,
          left: 0,
          right: 0,
          zIndex: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 10,
          height: 56,
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
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#E53935' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginRight: 15, padding: 8, backgroundColor: 'transparent', borderRadius: 20 }}>
              <Ionicons name="share-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/cart')}>
              <CartIconWithBadge count={cartCount} animated={cartJustAdded} />
            </TouchableOpacity>
          </View>
        </View>
        {images.length > 1 ? (
          <View style={styles.sliderContainer}>
            <FlatList
              ref={flatListRef}
              data={images}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: getValidImageUrl(item) }}
                  style={[styles.sliderImage, { width }]}
                  contentFit="contain"
                  transition={300}
                />
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              keyExtractor={(item, index) => `${item}-${index}`}
              onEndReached={() => {
                flatListRef.current?.scrollToIndex({ animated: true, index: 0 });
              }}
              onEndReachedThreshold={0.5}
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
            <Image
              source={{ uri: getValidImageUrl(images[0]) }}
              style={[styles.sliderImage, { width }]}
              contentFit="contain"
              transition={300}
            />
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>Tác giả: {book.author}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Trang</Text>
              <Text style={styles.statValue}>316</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Ngôn ngữ</Text>
              <Text style={styles.statValue}>{book.language}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Đánh giá</Text>
              <Text style={styles.statValue}>5.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatVND(book.price)}</Text>
          <Text style={styles.oldPrice}>{formatVND(book.price * 1.2)}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <RenderHTML
            contentWidth={contentWidth}
            source={{ html: truncatedHtml }}
            tagsStyles={tagsStyles}
          />
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.readMore}>{isExpanded ? 'Thu gọn' : 'Đọc thêm'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/book-detail-info', params: { id: book._id } })}>
            <Text style={styles.readMore}>Xem thông tin chi tiết</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.authorContainer}>
          <Text style={styles.sectionTitle}>Tác giả</Text>
          <View style={styles.authorInfo}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=' + book.author }} style={styles.authorImage} />
            <View>
              <Text style={styles.authorName}>{book.author}</Text>
              <Text style={styles.authorSubtitle}>Tác giả</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileButtonText}>Xem hồ sơ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <Animated.View style={[
        styles.footer,
        {
          paddingBottom: insets.bottom || 10,
          transform: [{ translateY: footerAnim }],
          zIndex: showLoginAlert ? -1 : 1, // Đảm bảo footer không bị block khi alert hiện
        }
      ]}>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart} disabled={addingCart || showLoginAlert || outOfStock}>
          <Ionicons name={cartSuccess ? 'checkmark-done' : 'cart-outline'} size={24} color={cartSuccess ? '#4CAF50' : '#5E5CE6'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow} disabled={showLoginAlert || outOfStock}>
          <Text style={styles.buyButtonText}>Mua ngay</Text>
        </TouchableOpacity>
      </Animated.View>
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
    </View>
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
    height: 350,
    marginTop: 80,
  },
  sliderImage: {
    height: '100%',
    resizeMode: 'contain',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#5E5CE6',
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff'
  },
  cartButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E8E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  buyButton: {
    backgroundColor: '#5E5CE6',
    paddingVertical: 18,
    borderRadius: 30,
    flex: 1,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default BookDetailsScreen;