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

const CARD_WIDTH = 120; // Kích thước mục nhỏ hơn để hiển thị 3 mục
const CARD_HEIGHT = 180;
const SPACING = 20; // Khoảng cách giữa các mục
const ITEM_WIDTH = CARD_WIDTH + SPACING;
const AUTO_SCROLL_INTERVAL = 3000; // 3 giây

const CoverFlowCarousel3D = ({ title, books, categoryId, categoryName }: Props) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoScrollTimer = useRef<number | null>(null);
  const restartTimer = useRef<number | null>(null);
  const isUserScrolling = useRef(false);
  const lastInteraction = useRef<number>(Date.now());
  const currentScrollValue = useRef(0);

  const RESTART_DELAY = 2000;

  // update current scroll value
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      currentScrollValue.current = value;
    });
    return () => scrollX.removeListener(id);
  }, [scrollX]);

  // infinite data
  const infiniteBooks = useMemo(() => {
    if (!books || books.length === 0) return [];
    const repeated: Book[] = [];
    for (let i = 0; i < 50; i++) repeated.push(...books);
    return repeated;
  }, [books]);

  const initialScrollIndex = useMemo(() => {
    return infiniteBooks.length ? Math.floor(infiniteBooks.length / 2) : 0;
  }, [infiniteBooks.length]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollTimer.current != null) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    autoScrollTimer.current = setInterval(() => {
      if (!isUserScrolling.current && flatListRef.current) {
        const currentOffset = currentScrollValue.current;
        const nextOffset = currentOffset + ITEM_WIDTH;
        flatListRef.current.scrollToOffset({ offset: nextOffset, animated: true });
      }
    }, AUTO_SCROLL_INTERVAL) as unknown as number;
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current != null) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimer.current != null) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
  }, []);

  const scheduleRestartAfterIdle = useCallback(() => {
    clearRestartTimer();
    restartTimer.current = setTimeout(() => {
      const idle = Date.now() - lastInteraction.current;
      if (idle >= RESTART_DELAY) {
        isUserScrolling.current = false;
        startAutoScroll();
      } else {
        scheduleRestartAfterIdle();
      }
    }, RESTART_DELAY) as unknown as number;
  }, [clearRestartTimer, startAutoScroll]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      clearRestartTimer();
    };
  }, [startAutoScroll, stopAutoScroll, clearRestartTimer]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
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
      outputRange: [0.8, 1.3, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.bookContainer, { transform: [{ scale }] }]}> 
        <TouchableOpacity
          style={styles.bookCard}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: item._id } })}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.thumbnail || (item.cover_image && item.cover_image[0]) || 'https://i.imgur.com/gTzT0hA.jpeg' }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [scrollX, router]);

  const onMomentumScrollEnd = (event: any) => {
    const currentIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const totalItems = infiniteBooks.length;
    const originalBooksLength = books.length;
    if (currentIndex >= totalItems - originalBooksLength * 2) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: originalBooksLength * 2, animated: false });
        }
      }, 50);
    } else if (currentIndex < originalBooksLength * 2) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: totalItems - originalBooksLength * 2, animated: false });
        }
      }, 50);
    }
    // schedule restart after momentum ends
    lastInteraction.current = Date.now();
    scheduleRestartAfterIdle();
  };

  const onScrollBeginDrag = () => {
    isUserScrolling.current = true;
    lastInteraction.current = Date.now();
    stopAutoScroll();
    clearRestartTimer();
  };

  const onScrollEndDrag = () => {
    lastInteraction.current = Date.now();
    scheduleRestartAfterIdle();
  };

  const onMomentumBegin = () => {
    isUserScrolling.current = true;
    lastInteraction.current = Date.now();
    clearRestartTimer();
  };

  const onMomentumEnd = () => {
    lastInteraction.current = Date.now();
    scheduleRestartAfterIdle();
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
          onMomentumScrollEnd={(e) => { onMomentumScrollEnd(e); onMomentumEnd(); }}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollBegin={onMomentumBegin}
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
    justifyContent: 'center', // Thêm thuộc tính này để căn giữa nội dung
    position: 'relative',
  },
  flatListContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) /2 - 20, // Tăng giá trị để căn chỉnh chính xác hơn
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
