import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookCarousel from "../../components/BookCarousel";
import CoverFlowCarousel3D from "../../components/CoverFlowCarousel3D";
import HomeTopSection from '../../components/HomeTopSection';
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useUnifiedModal } from "../../context/UnifiedModalContext";
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
    setRefreshing(true);
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
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [filteredBooks]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3255FB" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <HomeTopSection
          campaigns={campaigns}
          campaignsLoading={campaignsLoading}
          onApplySimpleFilter={setSimpleFilter}
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
