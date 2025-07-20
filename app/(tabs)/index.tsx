import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookCarousel from "../../components/BookCarousel";
import CampaignCarousel from "../../components/CampaignCarousel";
import CategoryFilters from "../../components/CategoryFilters";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import api from "../../services/api";
import { Campaign } from "../../types";

const Index = () => {
  const { books, categories, isLoading, refreshData } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(!user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getBooksForCategory = (categoryId: string) => {
    return books.filter(book => book.categories.some(cat => cat._id === categoryId));
  }

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
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chào mừng bạn đến với ShelfStackers!</Text>
            <Text style={styles.modalDesc}>Vui lòng đăng nhập để sử dụng đầy đủ chức năng và mua hàng.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                router.push('/(auth)/login');
              }}
            >
              <Text style={styles.modalButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                setModalVisible(false);
              }}
            >
              <Text style={styles.loginButtonText}>Đăng nhập sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3255FB']}
            tintColor="#3255FB"
          />
        }
      >
        <Header />
        <SearchBar />
        <CategoryFilters />
        
        {/* Campaigns Section */}
        {!campaignsLoading && campaigns.length > 0 && (
          <CampaignCarousel 
            title="Danh Mục" 
            campaigns={campaigns} 
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
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160, // Increase padding even more for better spacing
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#3255FB',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#3255FB',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  loginButtonText: {
    color: '#3255FB',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Index;
