import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Book } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type Props = {
  title: string;
  books: Book[];
  categoryId?: string;
  categoryName?: string;
};

const CARD_WIDTH = 180;
const CARD_HEIGHT = 260;
const SPACING = 25;
const ITEM_WIDTH = CARD_WIDTH + SPACING;
const AUTO_SCROLL_INTERVAL = 3000; // 3 giây

const CoverFlowCarousel3D = ({ title, books, categoryId, categoryName }: Props) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const isUserScrolling = useRef(false);

  if (!books || books.length === 0) {
    return null;
  }

  // Tạo dữ liệu vô hạn bằng cách lặp lại books nhiều lần
  const infiniteBooks = useMemo(() => {
    const repeatedBooks = [];
    // Lặp lại books 50 lần để tạo hiệu ứng vô hạn mượt mà hơn
    for (let i = 0; i < 50; i++) {
      repeatedBooks.push(...books);
    }
    return repeatedBooks;
  }, [books]);

  // Bắt đầu ở giữa danh sách để có thể cuộn cả 2 chiều
  const initialScrollIndex = useMemo(() => {
    return Math.floor(infiniteBooks.length / 2);
  }, [infiniteBooks.length]);

  // Auto-scroll function
  const startAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
    
    autoScrollTimer.current = setInterval(() => {
      if (!isUserScrolling.current && flatListRef.current) {
        const currentOffset = scrollX._value;
        const nextOffset = currentOffset + ITEM_WIDTH;
        
        flatListRef.current.scrollToOffset({
          offset: nextOffset,
          animated: true,
        });
      }
    }, AUTO_SCROLL_INTERVAL);
  }, []);

  // Stop auto-scroll khi user scroll
  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  // Restart auto-scroll sau khi user ngừng scroll
  const restartAutoScroll = useCallback(() => {
    stopAutoScroll();
    setTimeout(() => {
      isUserScrolling.current = false;
      startAutoScroll();
    }, 1000); // Đợi 1 giây sau khi user ngừng scroll
  }, [startAutoScroll, stopAutoScroll]);

  // Start auto-scroll khi component mount
  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [startAutoScroll]);

  const getItemLayout = useCallback((_, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  }), []);

  const renderBookItem = useCallback(({ item, index }: { item: Book; index: number }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1.2, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.bookContainer,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.bookCard}
          activeOpacity={0.9}
          onPress={() => {
            router.push({
              pathname: '/book/[id]',
              params: { id: item._id }
            });
          }}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: item.thumbnail || (item.cover_image && item.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg'
              }}
              style={styles.bookImage}
              resizeMode="cover"
            />
            <View style={styles.reflection} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [scrollX, router]);

  const onMomentumScrollEnd = (event: any) => {
    const currentIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    
    // Tự động reset về đầu hoặc cuối để tạo hiệu ứng vô hạn
    const totalItems = infiniteBooks.length;
    const originalBooksLength = books.length;
    
    // Nếu đang ở cuối danh sách (sau khi lặp lại)
    if (currentIndex >= totalItems - originalBooksLength * 2) {
      // Reset về đầu danh sách lặp lại
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: originalBooksLength * 2,
            animated: false,
          });
        }
      }, 50);
    }
    // Nếu đang ở đầu danh sách (trước khi lặp lại)
    else if (currentIndex < originalBooksLength * 2) {
      // Reset về cuối danh sách lặp lại
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: totalItems - originalBooksLength * 3,
            animated: false,
          });
        }
      }, 50);
    }
  };

  const onScrollBeginDrag = () => {
    isUserScrolling.current = true;
    stopAutoScroll();
  };

  const onScrollEndDrag = () => {
    restartAutoScroll();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {categoryId && categoryName && (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/category/[id]',
                params: { id: categoryId, name: categoryName }
              });
            }}
          >
            <Feather name="arrow-right" size={28} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={infiniteBooks}
          renderItem={renderBookItem}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={getItemLayout}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          contentContainerStyle={styles.flatListContent}
          pagingEnabled={false}
          initialScrollIndex={initialScrollIndex}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  carouselContainer: {
    height: CARD_HEIGHT * 1.3,
    alignItems: 'center',
    position: 'relative',
  },
  flatListContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
  },
  bookContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCard: {
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  bookImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    transform: [{ scaleY: -1 }],
  },
});

export default CoverFlowCarousel3D; 