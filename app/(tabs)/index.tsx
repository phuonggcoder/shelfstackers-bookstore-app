import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookCarousel from "../../components/BookCarousel";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import api from "../../services/api";
import { Campaign } from "../../types";
import HomeTopSection from '../../components/HomeTopSection';

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3255FB" />
        <Text>{t('loading')}</Text>
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
            <Text style={styles.modalText}>{t('please login to use features')}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>{t('close')}</Text>
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
        <HomeTopSection 
          campaigns={campaigns} 
          campaignsLoading={campaignsLoading}
          onApplySimpleFilter={setSimpleFilter}
        />
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
