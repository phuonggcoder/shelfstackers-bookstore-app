import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
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
import { formatVND } from '../../utils/format';

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
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);

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
        <Text>{t('loading')}</Text>
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
      <Text style={{ color: '#ccc', marginTop: 10 }}>{t('no image')}</Text>
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
      setShowLoginAlert(true);
      return;
    }
    if (isFavorite) {
      showToast(t('add to wishlist'));
      return;
    }
    try {
      const res = await addToWishlist(token, bookId as string);
      console.log('Add to wishlist response:', res);
      setIsFavorite(true);
      showToast(t('add to wishlist'));
    } catch (e: any) {
      console.error('Favorite error:', e);
      showToast(t('cannot add to wishlist'));
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

  const openFullscreenImage = (index: number) => {
    setFullscreenImageIndex(index);
    setShowFullscreenImage(true);
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
        title={t('login required')}
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
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#4A90E2' : 'black'} />
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
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#4A90E2' : 'black'} />
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

        <View style={styles.infoCard}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{t('author')}: {book.author}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('page')}</Text>
              <Text style={styles.statValue}>316</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('language')}</Text>
              <Text style={styles.statValue}>{book.language}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('rating')}</Text>
              <Text style={styles.statValue}>5.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{t('price')}: {formatVND(book.price)}</Text>
          <Text style={styles.oldPrice}>{t('old price')}: {formatVND(book.price * 1.2)}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>{t('description')}</Text>
          <RenderHTML
            contentWidth={contentWidth}
            source={{ html: truncatedHtml }}
            tagsStyles={tagsStyles}
          />
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.readMore}>{isExpanded ? t('read less') : t('read more')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/book-detail-info', params: { id: book._id } })}>
            <Text style={styles.readMore}>{t('view detail info')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.authorContainer}>
          <Text style={styles.sectionTitle}>{t('author')}</Text>
          <View style={styles.authorInfo}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=' + book.author }} style={styles.authorImage} />
            <View>
              <Text style={styles.authorName}>{book.author}</Text>
              <Text style={styles.authorSubtitle}>{t('author')}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileButtonText}>{t('view profile')}</Text>
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
          <Text style={styles.buyButtonText}>{t('buy now')}</Text>
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
});

export default BookDetailsScreen;