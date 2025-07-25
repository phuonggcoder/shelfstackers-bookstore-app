import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookCard from '../../components/BookCard';
import Header from '../../components/Header';
import api, { getBooks } from '../../services/api';
import { getAvailableVouchers, Voucher } from '../../services/voucherService';
import { Book, Campaign } from '../../types';

const CampaignDetailScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    loadCampaignData();
    loadVouchers();
    loadSuggestedBooks();
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

  // Lấy voucher từ hệ thống (random 1 voucher)
  const loadVouchers = async () => {
    try {
      setVoucherLoading(true);
      // TODO: Lấy token thực tế từ context hoặc storage nếu cần
      const token = '';
      const res = await getAvailableVouchers(token);
      setVouchers(res.vouchers || []);
    } catch (e) {
      setVouchers([]);
    } finally {
      setVoucherLoading(false);
    }
  };

  // Lấy sách gợi ý (random 4 cuốn)
  const loadSuggestedBooks = async () => {
    try {
      setBooksLoading(true);
      const allBooks = await getBooks();
      // Loại bỏ sách đã có trong campaign
      const campaignBookIds = new Set(books.map(b => b._id));
      const filtered = allBooks.filter(b => !campaignBookIds.has(b._id));
      // Random 4 sách
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      setSuggestedBooks(shuffled.slice(0, 4));
    } catch (e) {
      setSuggestedBooks([]);
    } finally {
      setBooksLoading(false);
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
      <ScrollView>
        {/* Ảnh campaign */}
        {campaign?.image && (
          <Image source={{ uri: campaign.image }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 16 }} />
        )}
        {/* Mô tả campaign */}
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
        {/* Thông tin campaign */}
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
        {/* Voucher random từ hệ thống */}
        {!voucherLoading && vouchers.length > 0 && (
          <View style={{ marginVertical: 10, paddingHorizontal: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Voucher cho chiến dịch</Text>
            {(() => {
              const v = vouchers[Math.floor(Math.random() * vouchers.length)];
              return (
                <View style={{ backgroundColor: '#fffbe6', padding: 10, borderRadius: 8, marginTop: 5 }}>
                  <Text style={{ fontWeight: 'bold' }}>{v.title || v.voucher_id}</Text>
                  <Text>{v.description}</Text>
                  <Text>Giảm: {v.voucher_type === 'percentage' ? `${v.discount_value}%` : `${v.discount_value.toLocaleString()}đ`}</Text>
                  <Text>Đơn tối thiểu: {v.min_order_value.toLocaleString()}đ</Text>
                  <Text>HSD: {new Date(v.end_date).toLocaleDateString('vi-VN')}</Text>
                </View>
              );
            })()}
          </View>
        )}
        {/* Danh sách sách theo campaign */}
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
              scrollEnabled={false}
            />
          )}
        </View>
        {/* Sách gợi ý col2 */}
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Gợi ý sách</Text>
            <TouchableOpacity onPress={() => router.push('/allcategories')}>
              <Text style={{ color: '#007bff' }}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {booksLoading ? (
            <ActivityIndicator size="small" color="#5E5CE6" />
          ) : (
            <FlatList
              data={suggestedBooks}
              keyExtractor={item => item._id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              renderItem={({ item }) => (
                <View style={{ flex: 1, margin: 4 }}>
                  <BookCard book={item} />
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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