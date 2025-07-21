import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookCarousel from "../../components/BookCarousel";
import CampaignIcons from "../../components/CampaignIcons";
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
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Vui lòng đăng nhập để sử dụng đầy đủ tính năng</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Đóng</Text>
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
          <CampaignIcons 
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
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
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
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center'
  }
});

export default Index;
