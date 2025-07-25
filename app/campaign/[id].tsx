import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookCard from '../../components/BookCard';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import api, { getBooks } from '../../services/api';
import { Voucher } from '../../services/voucherService';
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
  const [images, setImages] = useState<string[]>([]);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    loadCampaignData();
    loadSuggestedBooks();
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);
      const campaignData = await api.getCampaignById(String(id));
      setCampaign(campaignData);
      setBooks(campaignData.books || []);
      setVouchers(campaignData.vouchers || []);
      setImages(Array.isArray(campaignData.image) ? campaignData.image : [campaignData.image].filter(Boolean));
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

  // Xử lý khi user muốn dùng voucher
  const handleUseVoucher = (voucher: Voucher) => {
    if (!token) {
      Alert.alert('Bạn cần đăng nhập để sử dụng voucher!');
      // Có thể chuyển hướng sang màn hình đăng nhập nếu muốn
      return;
    }
    // Logic apply voucher ở đây (tạm thời chỉ alert)
    Alert.alert('Thành công', `Bạn đã chọn voucher: ${voucher.title || voucher.voucher_id}`);
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
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={{ width: 300, height: 200, borderRadius: 10, marginRight: 10 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
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
        {/* Danh sách voucher */}
        <View style={{ marginVertical: 10, paddingHorizontal: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Voucher cho chiến dịch</Text>
          {vouchers.length === 0 ? (
            <Text>Không có voucher nào</Text>
          ) : (
            vouchers.map((v, idx) => (
              <View key={v._id || idx} style={{ backgroundColor: '#fffbe6', padding: 10, borderRadius: 8, marginTop: 5, marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{v.title || v.voucher_id}</Text>
                <Text>{v.description}</Text>
                <Text>Giảm: {v.voucher_type === 'percentage' ? `${v.discount_value}%` : `${v.discount_value?.toLocaleString()}đ`}</Text>
                <Text>Đơn tối thiểu: {v.min_order_value?.toLocaleString()}đ</Text>
                <Text>HSD: {v.end_date ? new Date(v.end_date).toLocaleDateString('vi-VN') : ''}</Text>
                <TouchableOpacity onPress={() => handleUseVoucher(v)} style={{ marginTop: 8, backgroundColor: '#5E5CE6', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Dùng voucher</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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