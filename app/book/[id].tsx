import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBookById } from '../../services/api';
import { Book } from '../../types';
import { formatVND } from '../../utils/format';

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

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const images = book.cover_image && book.cover_image.length > 0 ? book.cover_image : ['https://i.imgur.com/gTzT0hA.jpeg']; // Default image

  const onMomentumScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const truncatedHtml = isExpanded ? book.description : book.description.slice(0, 200) + '...';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
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
            headerLeft: ({ canGoBack, tintColor }) => (
              canGoBack ? (
                <TouchableOpacity onPress={() => window.history.back()} style={{ marginLeft: 10 }}>
                  <Ionicons name="arrow-back" size={24} color={tintColor || 'black'} />
                </TouchableOpacity>
              ) : null
            ),
            headerRight: () => (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={{ marginRight: 15 }}>
                  <Ionicons name="heart-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginRight: 15 }}>
                  <Ionicons name="share-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="cart-outline" size={24} color="black" />
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
            {images.length > 1 ? (
                <View style={styles.sliderContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={images}
                        renderItem={({ item }) => (
                            <Image source={{ uri: item }} style={[styles.sliderImage, { width }]} />
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
                    <Image source={{ uri: images[0] }} style={[styles.sliderImage, { width }]} />
                </View>
            )}

            <View style={styles.infoCard}>
                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>By {book.author}</Text>
                <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Pages</Text>
                        <Text style={styles.statValue}>316</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Language</Text>
                        <Text style={styles.statValue}>{book.language}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Ratings</Text>
                        <Text style={styles.statValue}>5.0</Text>
                    </View>
                </View>
            </View>

            <View style={styles.priceContainer}>
                <Text style={styles.price}>{formatVND(book.price)}</Text>
                <Text style={styles.oldPrice}>{formatVND(book.price * 1.2)}</Text>
            </View>
            
            <View style={styles.descriptionContainer}>
                <Text style={styles.sectionTitle}>Descriptions</Text>
                <RenderHTML contentWidth={width} source={{ html: truncatedHtml }} />
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                    <Text style={styles.readMore}>{isExpanded ? 'Read Less' : 'Read More'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.authorContainer}>
                <Text style={styles.sectionTitle}>Author</Text>
                <View style={styles.authorInfo}>
                    <Image source={{ uri: 'https://i.pravatar.cc/150?u=' + book.author }} style={styles.authorImage} />
                    <View>
                        <Text style={styles.authorName}>{book.author}</Text>
                        <Text style={styles.authorSubtitle}>Author</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <Text style={styles.profileButtonText}>View Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={{height: 100}} /> 
        </ScrollView>
        <Animated.View style={[
            styles.footer, 
            { 
                paddingBottom: insets.bottom || 10,
                transform: [{ translateY: footerAnim }] 
            }
        ]}>
            <TouchableOpacity style={styles.cartButton}>
                <Ionicons name="cart-outline" size={24} color="#5E5CE6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
        </Animated.View>
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