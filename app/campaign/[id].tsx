import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookCard from '../../components/BookCard';
import Header from '../../components/Header';
import api from '../../services/api';
import { Book, Campaign } from '../../types';

const CampaignDetailScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get campaign details
      const campaignData = await api.getCampaignById(String(id));
      setCampaign(campaignData);
      
      // Then get campaign books (this might return empty array)
      const booksData = await api.getCampaignBooks(String(id));
      
      // If books API returns empty array but campaign has books, use campaign books
      if ((!booksData || booksData.length === 0) && campaignData.books && campaignData.books.length > 0) {
        console.log('Using books from campaign object as fallback');
        setBooks(campaignData.books);
      } else {
        setBooks(booksData || []);
      }
    } catch (err: any) {
      console.error('Error loading campaign data:', err);
      if (err.response?.status === 404) {
        setError('Chiến dịch không tồn tại hoặc đã bị xóa');
      } else {
        setError('Không thể tải thông tin chiến dịch');
      }
    } finally {
      setLoading(false);
    }
  };

  const tagsStyles = {
    p: { marginBottom: 10, lineHeight: 22, color: '#333' },
    br: { height: 10 },
    h1: { fontSize: 24, fontWeight: 'bold' as const, marginBottom: 12 },
    h2: { fontSize: 20, fontWeight: 'bold' as const, marginBottom: 10 },
    ul: { marginBottom: 10, paddingLeft: 20 },
    li: { marginBottom: 6 },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={name as string} showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5E5CE6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={name as string} showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={name as string} showBackButton />
      
      {/* Campaign Description */}
      {campaign?.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Mô tả chiến dịch</Text>
          <RenderHTML
            contentWidth={width - 32}
            source={{ html: campaign.description }}
            tagsStyles={tagsStyles}
          />
        </View>
      )}
      
      {/* Campaign Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Thông tin chiến dịch</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Loại:</Text>
          <Text style={styles.infoValue}>{campaign?.type}</Text>
        </View>
        {campaign?.startDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
            <Text style={styles.infoValue}>
              {new Date(campaign.startDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}
        {campaign?.endDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày kết thúc:</Text>
            <Text style={styles.infoValue}>
              {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số lượng sách:</Text>
          <Text style={styles.infoValue}>{books.length}</Text>
        </View>
      </View>
      
      {/* Books List */}
      <View style={styles.booksContainer}>
        <Text style={styles.booksTitle}>Sách trong chiến dịch</Text>
        {books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có sách nào trong chiến dịch này</Text>
          </View>
        ) : (
          <FlatList
            data={books}
            renderItem={({ item }) => <BookCard book={item} />}
            keyExtractor={item => item._id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  descriptionContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#555',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  booksContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  booksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});

export default CampaignDetailScreen; 