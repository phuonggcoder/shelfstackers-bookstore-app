import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
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
      setError('Không thể tải danh mục');
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
    const colors = [
      { bg: '#667eea', gradient: '#764ba2' },
      { bg: '#f093fb', gradient: '#f5576c' },
      { bg: '#4facfe', gradient: '#00f2fe' },
      { bg: '#43e97b', gradient: '#38f9d7' },
      { bg: '#fa709a', gradient: '#fee140' },
      { bg: '#a8edea', gradient: '#fed6e3' },
      { bg: '#ffecd2', gradient: '#fcb69f' },
      { bg: '#ff9a9e', gradient: '#fecfef' },
      { bg: '#a18cd1', gradient: '#fbc2eb' },
      { bg: '#fad0c4', gradient: '#ffd1ff' }
    ];
    return colors[index % colors.length];
  };

  const renderCategoryCard = ({ item, index }: { item: Category; index: number }) => {
    const iconName = getCategoryIcon(item.name);
    const colors = getCategoryColor(index);
    
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.9}
      >
        <View style={[styles.cardGradient, { backgroundColor: colors.bg }]}>
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryImage}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name={iconName as any} size={32} color="white" />
                </View>
              )}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.categoryName} numberOfLines={2}>
                {item.name}
              </Text>
              {item.description && (
                <View style={styles.descriptionContainer}>
                  <RenderHtml
                    contentWidth={width - 80}
                    source={{ html: item.description }}
                    baseStyle={styles.htmlBaseStyle}
                    tagsStyles={{
                      p: styles.htmlParagraph,
                      div: styles.htmlParagraph,
                      span: styles.htmlParagraph,
                    }}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={18} color="white" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Danh Mục</Text>
          <Text style={styles.headerSubtitle}>
            Khám phá sách theo chủ đề yêu thích
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Đang tải danh mục...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Danh Mục</Text>
          <Text style={styles.headerSubtitle}>
            Khám phá sách theo chủ đề yêu thích
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#4A90E2" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh Mục</Text>
        <Text style={styles.headerSubtitle}>
          Khám phá sách theo chủ đề yêu thích
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
    width: (width - 48) / 2,
    height: 200, // Fixed height for consistent aspect ratio
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  cardGradient: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: 70, // Fixed height for image container
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    flex: 1,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    lineHeight: 18,
  },
  descriptionContainer: {
    marginTop: 4,
    flex: 1,
  },
  htmlBaseStyle: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
  htmlParagraph: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
    margin: 0,
    padding: 0,
  },
  arrowContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});

export default CategoriesScreen;