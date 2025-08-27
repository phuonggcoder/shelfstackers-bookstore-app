import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Book } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type Props = {
  title: string;
  books: Book[];
  categoryId?: string;
  categoryName?: string;
};

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const SPACING = 20;
const VISIBLE_ITEMS = 3;

const CoverFlowCarousel = ({ title, books, categoryId, categoryName }: Props) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!books || books.length === 0) {
    return null;
  }

  const getItemLayout = useCallback((_, index: number) => ({
    length: CARD_WIDTH + SPACING,
    offset: (CARD_WIDTH + SPACING) * index,
    index,
  }), []);

  const renderBookItem = useCallback(({ item, index }: { item: Book; index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    const scale = new Animated.Value(0.8);
    const translateX = new Animated.Value(0);
    const opacity = new Animated.Value(0.6);

    const animatedStyle = {
      transform: [
        {
          scale: scale.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
        {
          translateX: translateX.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0],
          }),
        },
      ],
      opacity: opacity.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
      }),
    };

    const isActive = index === activeIndex;

    return (
      <Animated.View
        style={[
          styles.bookContainer,
          animatedStyle,
          isActive && styles.activeBook,
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
            <View style={styles.shadow} />
          </View>
          
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.author && (
              <Text style={styles.bookAuthor} numberOfLines={1}>
                {item.author}
              </Text>
            )}
            <Text style={styles.bookPrice}>
              {item.price?.toLocaleString()} đ
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [activeIndex, router]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onMomentumScrollEnd = (event: any) => {
    const slideSize = CARD_WIDTH + SPACING;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
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
            <Feather name="arrow-right" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={onMomentumScrollEnd}
          contentContainerStyle={styles.flatListContent}
          pagingEnabled={false}
        />
      </View>

      {/* Pagination dots */}
      {books.length > 1 && (
        <View style={styles.pagination}>
          {books.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  carouselContainer: {
    height: CARD_HEIGHT + 60, // Extra space for book info
  },
  flatListContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
  },
  bookContainer: {
    width: CARD_WIDTH + SPACING,
    alignItems: 'center',
  },
  activeBook: {
    transform: [{ scale: 1.05 }],
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
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  shadow: {
    position: 'absolute',
    bottom: -5,
    left: 5,
    right: 5,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    zIndex: -1,
  },
  bookInfo: {
    alignItems: 'center',
    width: CARD_WIDTH,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 6,
  },
  bookPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#e74c3c',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default CoverFlowCarousel; 
