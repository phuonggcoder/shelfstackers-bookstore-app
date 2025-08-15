import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories } from '../../services/api';
import { Category } from '../../types';

const { width, height } = Dimensions.get('window');

const CACHE_KEYS = {
  CATEGORIES: 'cached_categories_categories_page',
  LAST_UPDATE: 'last_cache_update_categories_page',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CategoriesScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load categories when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
  );

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
      const cachedCategories = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
      if (cachedCategories) {
        setCategories(JSON.parse(cachedCategories));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const saveToCache = async (categoriesData: Category[]) => {
    try {
      const now = Date.now();
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(categoriesData)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, now.toString()),
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if cache is valid
      const cacheValid = await isCacheValid();
      
      if (cacheValid) {
        // Load from cache
        await loadCachedData();
        console.log('Categories loaded from cache');
      } else {
        // Load from API and update cache
        const data = await getCategories();
        setCategories(data);
        
        // Save to cache
        await saveToCache(data);
        console.log('Categories loaded from API and cached');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(t('cannotLoadCategories'));
      // Try to load from cache as fallback
      await loadCachedData();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh from API
      const data = await getCategories();
      setCategories(data);
      setError(null);
      
      // Update cache
      await saveToCache(data);
      console.log('Categories refreshed from API and cached');
    } catch (err) {
      console.error('Error refreshing categories:', err);
      setError('Không thể tải danh mục');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/category-detail/[id]',
      params: { id: category._id, name: category.name }
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('sách') || name.includes('book')) return 'book-outline';
    if (name.includes('văn học') || name.includes('literature')) return 'library-outline';
    if (name.includes('kinh tế') || name.includes('business')) return 'trending-up-outline';
    if (name.includes('khoa học') || name.includes('science')) return 'flask-outline';
    if (name.includes('lịch sử') || name.includes('history')) return 'time-outline';
    if (name.includes('nghệ thuật') || name.includes('art')) return 'color-palette-outline';
    if (name.includes('công nghệ') || name.includes('technology')) return 'hardware-chip-outline';
    if (name.includes('y học') || name.includes('medical')) return 'medical-outline';
    if (name.includes('giáo dục') || name.includes('education')) return 'school-outline';
    if (name.includes('tâm lý') || name.includes('psychology')) return 'heart-outline';
    if (name.includes('làm vườn') || name.includes('garden')) return 'leaf-outline';
    if (name.includes('thú nuôi') || name.includes('pet')) return 'paw-outline';
    if (name.includes('nấu ăn') || name.includes('cooking')) return 'restaurant-outline';
    if (name.includes('du lịch') || name.includes('travel')) return 'airplane-outline';
    if (name.includes('thể thao') || name.includes('sport')) return 'fitness-outline';
    return 'grid-outline';
  };

  const getCategoryColor = (index: number) => {
    // Dùng màu xanh dương tươi #3B82F6 cho tất cả danh mục
    return { bg: '#3B82F6', gradient: '#3B82F6' };
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
      style={{ paddingVertical: 14, paddingHorizontal: 8 }}
    >
      <Text style={{ fontSize: 17 }}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('categories')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('exploreBooksByTopic')}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('loadingCategories')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('categories')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('exploreBooksByTopic')}
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#4A90E2" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('categories')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('exploreBooksByTopic')}
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item._id}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 150, // Increase padding even more for floating tab bar
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 0, // Remove margin since cards have their own margin
  },
  categoryCard: {
    width: '100%',
    minHeight: 80,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: 'transparent',
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  listImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listCategoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  listIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  listCategoryDesc: {
    fontSize: 13,
    color: 'white',
    opacity: 0.85,
  },
  arrowContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});

export default CategoriesScreen;