import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { useAuth } from '../../context/AuthContext';
import { getBookImageUrl } from '../../utils/format';

const API_BASE_URL = 'https://server-shelf-stacker.onrender.com';

const FavouriteScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) fetchWishlist();
    else setLoading(false);
  }, [token]);

  const fetchWishlist = async () => {
    if (!refreshing) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const booksArr = Array.isArray(data) ? data : (data.books || data.data?.books || []);
      setBooks(booksArr);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleRemove = async (bookId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/wishlist/remove/${bookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(books.filter(b => b._id !== bookId));
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xóa sách khỏi yêu thích');
    }
  };

  const handlePay = (book: any) => {
    router.push({ pathname: '/order-review', params: { ids: book._id } });
  };

  const handleShare = (book: any) => {
    Alert.alert('Chia sẻ', `Chia sẻ sách: ${book.title}`);
  };

  // Màn hình yêu cầu đăng nhập
  if (!token) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="heart-outline" size={60} color="#5E5CE6" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Bạn cần đăng nhập để xem danh sách yêu thích</Text>
        <Text style={styles.emptyDesc}>Hãy đăng nhập hoặc đăng ký để lưu và quản lý sách yêu thích của bạn.</Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerBtnText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    // Nếu API trả về dạng { book: {...} } thì lấy item.book, còn không thì lấy item
    const book = item.book || item;
    return (
      <TouchableOpacity style={styles.itemRow} activeOpacity={0.85} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book._id } })}>
        <Image source={{ uri: getBookImageUrl(book) }} style={styles.bookImage} />
        <View style={styles.infoWrap}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
          <Text style={styles.price}>{book.price ? `${book.price.toLocaleString()}₫` : ''}</Text>
        </View>
        <Menu>
          <MenuTrigger>
            <Ionicons name="ellipsis-vertical" size={22} color="#222" style={{ padding: 8 }} />
          </MenuTrigger>
          <MenuOptions>
            <MenuOption onSelect={() => handleRemove(book._id)}>
              <View style={styles.menuOption}><Ionicons name="trash-outline" size={18} color="#E53935" /><Text style={styles.menuText}>Xóa khỏi danh sách yêu thích</Text></View>
            </MenuOption>
            <MenuOption onSelect={() => handlePay(book)}>
              <View style={styles.menuOption}><Ionicons name="card-outline" size={18} color="#5E5CE6" /><Text style={styles.menuText}>Pay</Text></View>
            </MenuOption>
            <MenuOption onSelect={() => handleShare(book)}>
              <View style={styles.menuOption}><Ionicons name="share-social-outline" size={18} color="#5E5CE6" /><Text style={styles.menuText}>Share</Text></View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách yêu thích</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#5E5CE6" style={{ marginTop: 40 }} />
      ) : books.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={60} color="#5E5CE6" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Chưa có sách yêu thích</Text>
          <Text style={styles.emptyDesc}>Hãy thêm sách vào danh sách yêu thích để dễ dàng tìm lại sau.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
    gap: 12,
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E8E8FF',
  },
  infoWrap: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  author: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  price: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    marginTop: 2,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuText: {
    fontSize: 15,
    marginLeft: 8,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginBtn: {
    backgroundColor: '#5E5CE6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#5E5CE6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  registerBtnText: {
    color: '#5E5CE6',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FavouriteScreen; 