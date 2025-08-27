import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BookCarousel from "../../components/BookCarousel";
import CoverFlowCarousel3D from "../../components/CoverFlowCarousel3D";
import HomeTopSection from '../../components/HomeTopSection';
import VoucherNotification from "../../components/VoucherNotification";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useUnifiedModal } from "../../context/UnifiedModalContext";
import { useHomeLoading } from "../../hooks/useHomeLoading";
import PullToRefreshLoadingScreen from "../../screens/PullToRefreshLoadingScreen";
import api from "../../services/api";
import { Campaign } from "../../types";

const Index = () => {
  const { t } = useTranslation();
  const { books, categories, isLoading, refreshData } = useData();
  const { user } = useAuth();
  const { showLoginPopup } = useUnifiedModal();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simpleFilter, setSimpleFilter] = useState<{ price: number; sort: 'az' | 'za' | null } | null>(null);
  const [hasShownLoginPopup, setHasShownLoginPopup] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Loading state management
  const { 
    isLoading: homeLoading, 
    showLoadingScreen, 
    startLoading, 
    stopLoading, 
    handlePullToRefresh 
  } = useHomeLoading();

  // Slide-down cue state
  const [showSlideCue, setShowSlideCue] = useState(false);
  const cueY = useRef<number | null>(null);
  const scrollViewHeight = useRef<number>(0);
  const hasAutoOpened = useRef(false);
  const autoOpenTimeout = useRef<any | null>(null);

  // Reset login popup state when user logs in
  useEffect(() => {
    if (user) {
      setHasShownLoginPopup(false);
    }
  }, [user]);

  // Auto-load data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      loadCampaigns();
      // Show login popup if user is not logged in
      // Only show once per session to avoid conflicts with login success notification
      if (!user && !hasShownLoginPopup) {
        setHasShownLoginPopup(true);
        showLoginPopup(
          () => router.push('/login'),
          () => {
            // User skipped login - do nothing, just close the popup
            console.log('User skipped login');
          }
        );
      }
    }, [user, showLoginPopup, router, hasShownLoginPopup])
  );

  const loadCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const onRefresh = async () => {
    // Show loading screen immediately - đè toàn bộ layout
    startLoading(5000);
    
    try {
      // Refresh all data
      await Promise.all([
        refreshData(),
        loadCampaigns()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Lọc và sắp xếp sách theo filter đơn giản
  const filteredBooks = useMemo(() => {
    if (!simpleFilter) return books;
    let result = books.filter(book => {
      // Lọc theo giá (giá <= filter.price)
      if (simpleFilter.price > 0 && book.price > simpleFilter.price) return false;
      return true;
    });
    if (simpleFilter.sort === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (simpleFilter.sort === 'za') {
      result = [...result].sort((a, b) => b.title.localeCompare(a.title));
    }
    return result;
  }, [books, simpleFilter]);

  const getBooksForCategory = (categoryId: string) => {
    return filteredBooks.filter(book => book.categories.some(cat => cat._id === categoryId));
  }

  // Lấy sách nổi bật (top 5 sách có rating cao nhất)
  const featuredBooks = useMemo(() => {
    return [...filteredBooks]
      .sort((a, b) => {
        const ra = (a as any).rating || 0;
        const rb = (b as any).rating || 0;
        return rb - ra;
      })
      .slice(0, 5);
  }, [filteredBooks]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3255FB" />
      </View>
    )
  }

  const mergedContentStyle = { ...styles.scrollContent, paddingBottom: (styles.scrollContent.paddingBottom || 0) + insets.bottom + 120 };

  return (
    <SafeAreaView style={styles.container} edges={["top","left","right","bottom"]}>
      {/* Loading Screen Overlay */}
      <PullToRefreshLoadingScreen
        isVisible={showLoadingScreen}
        duration={5000}
        onSlideUp={stopLoading}
      />
      
      {/** merge bottom safe area into content style so nav doesn't cover content */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={mergedContentStyle}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          const layoutHeight = e.nativeEvent.layoutMeasurement.height;
          scrollViewHeight.current = layoutHeight;
          if (cueY.current != null) {
            const threshold = 30; // smaller threshold for auto-open
            const atCue = offsetY + layoutHeight >= cueY.current - threshold;
            setShowSlideCue(atCue);

            if (atCue && !hasAutoOpened.current) {
              // debounce a little before auto-opening to avoid accidental quick triggers
              if (autoOpenTimeout.current) clearTimeout(autoOpenTimeout.current);
              autoOpenTimeout.current = setTimeout(() => {
                // trigger auto open to filtered-books with no click
                hasAutoOpened.current = true;
                router.push({ pathname: '/filtered-books', params: { /* no params */ } });
              }, 350);
            } else {
              if (autoOpenTimeout.current) {
                clearTimeout(autoOpenTimeout.current);
                autoOpenTimeout.current = null;
              }
            }
          }
        }}
        scrollEventThrottle={16}
      >
        <HomeTopSection
          campaigns={campaigns}
          campaignsLoading={campaignsLoading}
          onApplySimpleFilter={setSimpleFilter}
        />

        {/* Voucher Notification */}
        <VoucherNotification
          onVoucherPress={() => router.push('/voucher-selection' as any)}
          showCount={true}
          maxCount={3}
        />
        
        {/* Featured Books Section với Cover Flow Carousel */}
        {featuredBooks.length > 0 && (
          <CoverFlowCarousel3D
            title="Sách Nổi Bật"
            books={featuredBooks}
            categoryId="featured"
            categoryName="Sách Nổi Bật"
          />
        )}
        
        {/* Categories Section */}
        {categories.map(category => {
          const categoryBooks = getBooksForCategory(category._id);
          if (categoryBooks.length === 0) return null;
          return (
            <BookCarousel 
              key={category._id}
              title={category.name} 
              books={categoryBooks} 
              categoryId={category._id}
              categoryName={category.name}
            />
          )
        })}

        {/* Slide-down cue: appears when user scrolls near the bottom of the page */}
        <View
          onLayout={(e) => {
            const y = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
            cueY.current = y;
          }}
          style={{ alignItems: 'center', marginTop: 8, paddingVertical: 12 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/allcategories')}
            style={{ alignItems: 'center', opacity: showSlideCue ? 1 : 0.6 }}
          >
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>{t('slideDownToSeeAllBooks')}</Text>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="chevron-down" size={22} color="#333" />
            </View>
          </TouchableOpacity>
  </View>

  {/* explicit spacer so bottom tab / navigation doesn't cover last content */}
  <View style={{ height: Math.max(80, insets.bottom + 40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 50, // Tăng padding bottom để đẩy footer tab xuống
  },
});

export default Index;
