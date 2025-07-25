import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getWishlist, removeFromWishlist } from '../../services/api';
import { Book } from '../../types';
import { getBookImageUrl } from '../../utils/format';

const { width } = Dimensions.get('window');

const CACHE_KEYS = {
  FAVORITES: 'cached_favorites',
  LAST_UPDATE: 'last_cache_update_favorites',
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter for favorites)

const FavouriteScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();


  // Auto-load favorites when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Favourite tab focused, loading favorites...');
      if (token) {
        // Always refresh when returning to the page
        loadFavorites(true); // Force refresh
      } else {
        console.log('❌ No token available for favorites');
        setFavorites([]);
        // Clear cache when no token
        AsyncStorage.multiRemove([CACHE_KEYS.FAVORITES, CACHE_KEYS.LAST_UPDATE]);
      }
    }, [token])
  );

  // Also load when token changes
  useEffect(() => {
    if (token) {
      console.log('🔑 Token changed, loading favorites...');
      loadFavorites(true);
    } else {
      console.log('🚪 No token, clearing favorites...');
      setFavorites([]);
      // Clear cache when logged out
      AsyncStorage.multiRemove([CACHE_KEYS.FAVORITES, CACHE_KEYS.LAST_UPDATE]);
    }
  }, [token]);

  const isCacheValid = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      if (!lastUpdate) return false;
      
      const now = Date.now();
      const lastUpdateTime = parseInt(lastUpdate);
      return (now - lastUpdateTime) < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  };

  const loadCachedData = async () => {
    try {
      const cachedFavorites = await AsyncStorage.getItem(CACHE_KEYS.FAVORITES);
      if (cachedFavorites) {
        setFavorites(JSON.parse(cachedFavorites));
        console.log('📦 Loaded favorites from cache');
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const saveToCache = async (favoritesData: Book[]) => {
    try {
      const now = Date.now();
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(favoritesData)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, now.toString()),
      ]);
      console.log('💾 Saved favorites to cache');
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const loadFavorites = async (forceRefresh = false) => {
    if (!token) {
      console.log('❌ No token, cannot load favorites');
      setFavorites([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading favorites...', { forceRefresh });
      
      // Check if cache is valid (unless force refresh)
      const cacheValid = !forceRefresh && await isCacheValid();
      
      if (cacheValid) {
        // Load from cache
        await loadCachedData();
        console.log('✅ Favorites loaded from cache');
      } else {
        // Use real API call
        console.log('🌐 Fetching favorites from API...');
        const response = await getWishlist(token);
        console.log('📚 API returned favorites:', response);
        console.log('📚 Number of favorites:', response.length);
        setFavorites(response);
        
        // Save to cache
        await saveToCache(response);
        console.log('✅ Favorites loaded from API and cached');
      }
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      // Try to load from cache as fallback
      await loadCachedData();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!token) {
      console.log('❌ No token, clearing favorites on refresh...');
      setFavorites([]);
      setRefreshing(false);
      return;
    }
    console.log('🔄 Manual refresh triggered...');
    setRefreshing(true);
    try {
      // Force refresh from API
      console.log('🌐 Force refreshing favorites from API...');
      const response = await getWishlist(token);
      setFavorites(response);
      
      // Update cache
      await saveToCache(response);
      console.log('✅ Favorites refreshed from API and cached');
    } catch (error) {
      console.error('❌ Error refreshing favorites:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (bookId: string) => {
    if (!token) {
      console.log('❌ No token, cannot remove from favorites');
      setFavorites([]);
      return;
    }
    
    try {
      console.log('🗑️ Removing book from favorites:', bookId);
      const result = await removeFromWishlist(token, bookId);
      console.log('🗑️ API remove result:', result);
      
      // Update state with filtered favorites
      setFavorites(prev => {
        const newFavorites = prev.filter(item => {
          const itemBook = item.book || item;
          return itemBook._id !== bookId;
        });
        
        // Save to cache with new favorites
        saveToCache(newFavorites);
        console.log('✅ Book removed from favorites, new count:', newFavorites.length);
        
        return newFavorites;
      });
      
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
    }
  };

  const handleMenuPress = (book: any, itemRef: any) => {
    console.log('🎯 Menu pressed for book:', book._id, book.title);
    
    // Use Alert instead of inline menu
    Alert.alert(
      book.title,
      t('choose_action'),
      [
        {
          text: t('remove_from_favorites'),
          style: 'destructive',
          onPress: () => {
            console.log('🗑️ Remove from Alert for bookId:', book._id);
            handleRemoveFavorite(book._id);
          }
        },
        {
          text: t('pay'),
          onPress: () => {
            console.log('💳 Pay from Alert for bookId:', book._id);
            handlePayPress(book);
          }
        },
        {
          text: t('share'),
          onPress: () => {
            console.log('📤 Share from Alert for bookId:', book._id);
            handleSharePress(book);
          }
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  const handlePayPress = (book: any) => {
    const bookId = book._id || book.book?._id;
    router.push({
      pathname: '/book/[id]',
      params: { id: bookId }
    });
  };

  const handleSharePress = (book: any) => {
    Alert.alert(t('share'), t('share_book', { title: book.title }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };



  const handleBookPress = (book: any) => {
    const bookId = book._id || book.book?._id;
    router.push({
      pathname: '/book/[id]',
      params: { id: bookId }
    });
  };

  const renderBookItem = ({ item }: { item: any }) => {
    // Handle different data structures
    const book = item.book || item;
    const bookId = book._id || item._id;
    
    console.log('📚 Rendering book item:', {
      bookId,
      bookTitle: book.title
    });
    
    return (
      <View style={styles.bookCardContainer}>
        <TouchableOpacity
          style={styles.bookCard}
          onPress={() => handleBookPress(book)}
          activeOpacity={0.8}
        >
          <View style={styles.bookImageContainer}>
            <Image
              source={{ uri: getBookImageUrl(book) }}
              style={styles.bookImage}
              contentFit="cover"
              transition={300}
            />
          </View>
          
          <View style={styles.bookInfo}>
            <Text style={styles.bookAuthor}>{t('by_author', { author: book.author || t('unknown') })}</Text>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.title || t('unknown_title')}
            </Text>
            <Text style={styles.currentPrice}>
              {formatPrice(book.price || 0)}
            </Text>
            
            {/* Heart icon to show favorite status */}
            <View style={styles.heartContainer}>
              <Ionicons 
                name="heart" 
                size={20} 
                color="#ff4757" 
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => handleMenuPress(book, null)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
          

          

        </TouchableOpacity>
        

      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('favorites_list')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loading_favorites')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🎨 Rendering favourites screen:', { 
    favoritesCount: favorites.length, 
    loading, 
    refreshing,
    favorites: favorites.slice(0, 2) // Log first 2 items
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('favorites_list')}</Text>
        {loading && (
          <View style={styles.headerLoading}>
            <ActivityIndicator size="small" color="#667eea" />
          </View>
        )}
        {favorites.length > 0 && !loading && (
          <Text style={styles.favoriteCount}>{t('books_count', { count: favorites.length })}</Text>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>{t('no_favorites')}</Text>
          <Text style={styles.emptyText}>
            {t('add_favorites_hint')}
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.browseButtonText}>{t('browse_books')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderBookItem}
          keyExtractor={(item: any) => (item.book?._id || item._id).toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea']}
              tintColor="#667eea"
            />
          }
        />
      )}


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  favoriteCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 150,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  bookImageContainer: {
    width: 80,
    height: 120,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    flex: 1,
    marginRight: 16,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  heartContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerLoading: {
    marginLeft: 10,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  bookCardContainer: {
    marginBottom: 12,
  },
  inlineMenuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1000,
  },
  inlineMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginVertical: 2,
    minHeight: 44,
  },
  inlineMenuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default FavouriteScreen; 