import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookCarousel from "../../components/BookCarousel";
import CoverFlowCarousel3D from "../../components/CoverFlowCarousel3D";
import HomeTopSection from '../../components/HomeTopSection';
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import api from "../../services/api";
import { Campaign } from "../../types";

const Index = () => {
  const { t } = useTranslation();
  const { books, categories, isLoading, refreshData } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(!user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simpleFilter, setSimpleFilter] = useState<{ price: number; sort: 'az' | 'za' | null } | null>(null);

  // Auto-load data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      loadCampaigns();
    }, [])
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{t('pleaseLoginForFullFeatures')}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              >

                <Text style={styles.skipButtonText}>{t('loginLater')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={() => {
                  setModalVisible(!modalVisible);
                  router.push('/login');
                }}
              >
                <Text style={styles.loginButtonText}>{t('login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 280,
    maxWidth: 340,
  },
  modalText: {
    marginBottom: 28,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    gap: 16,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  skipButton: {
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  skipButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3255FB',
    marginLeft: 8,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Index;
