import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Modal, View as RNView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getWishlist, removeFromWishlist } from '../../services/api';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ children }: { children: React.ReactNode }) => {
  const scaleAnim = React.useRef(new Animated.Value(0.1)).current;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      scaleAnim.setValue(0.1);
      contentOpacity.setValue(0);
      setShowContent(false);
      setSplashDone(false);
      Animated.timing(scaleAnim, {
        toValue: 16,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        setSplashDone(true);
        setShowContent(true);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, [])
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={{
          position: 'absolute',
          left: width / 2 - 40,
          top: height / 2 - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#1890FF',
          transform: [{ scale: scaleAnim }],
          zIndex: 1,
        }}
      />
      <Animated.View
        style={{
          flex: 1,
          opacity: contentOpacity,
          zIndex: 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        pointerEvents={showContent ? 'auto' : 'none'}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const FavouriteScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const favs = await getWishlist(token);
      setFavorites(favs || []);
    } catch (error) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }, [fetchWishlist]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [fetchWishlist])
  );

  // Nếu chưa đăng nhập, hiển thị AnimatedSplash với thông báo
  if (!token) {
    return (
      <AnimatedSplash>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Ionicons name="heart-outline" size={64} color="#fff" style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' }}>
            Vui lòng đăng nhập để xem sách yêu thích
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 40, marginBottom: 15 }}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={{ color: '#1890FF', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </AnimatedSplash>
    );
  }

  // Nếu đang loading dữ liệu
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1890FF" />
      </View>
    );
  }

  // Nếu không có sách yêu thích
  if (!favorites || favorites.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Ionicons name="heart-outline" size={64} color="#1890FF" style={{ marginBottom: 24 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1890FF', marginBottom: 10, textAlign: 'center' }}>
          Chưa có sách yêu thích
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>
          Hãy thêm sách vào danh sách yêu thích để dễ dàng tìm lại sau.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#1890FF', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 40, marginBottom: 15 }}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Duyệt sách</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render danh sách sách yêu thích
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6fa' }} edges={['top']}> 
      <View style={{ paddingTop: 8, paddingHorizontal: 18, paddingBottom: 8, backgroundColor: '#f5f6fa' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2d3a4a', marginBottom: 2 }}>Yêu Thích</Text>
        <Text style={{ fontSize: 15, color: '#8a97a8' }}>Danh sách sách bạn đã lưu lại</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        renderItem={({ item }) => <WishlistItem item={item} router={router} onRemove={fetchWishlist} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

// Component WishlistItem
function getBookImage(item: any) {
  let img = '';
  if (typeof item.thumbnail === 'string' && item.thumbnail.trim() !== '') {
    img = item.thumbnail.trim();
  } else if (Array.isArray(item.cover_image) && item.cover_image.length > 0 && typeof item.cover_image[0] === 'string' && item.cover_image[0].trim() !== '') {
    img = item.cover_image[0].trim();
  } else {
    img = 'https://i.imgur.com/gTzT0hA.jpeg';
  }
  console.log('getBookImage for', item.title, ':', img);
  return img;
}

function WishlistItem({ item, router, onRemove }: { item: any, router: any, onRemove: () => void }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuButtonRef = useRef<RNView>(null);
  const { token } = useAuth();

  const openMenu = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measureInWindow((x, y, width, height) => {
        setMenuPos({ x: x + width - 170, y: y + height });
        setMenuVisible(true);
      });
    } else {
      setMenuVisible(true);
    }
  };

  const handleRemove = async () => {
    setMenuVisible(false);
    if (!token) return;
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('Bạn có chắc muốn xóa sách này khỏi danh sách yêu thích?')) return;
    } else if (typeof Alert !== 'undefined') {
      // Nếu là React Native, dùng Alert
      Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa sách này khỏi danh sách yêu thích?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: async () => {
          await removeFromWishlist(token, item._id || item.id);
          onRemove();
        }}
      ]);
      return;
    }
    await removeFromWishlist(token, item._id || item.id);
    onRemove();
  };

  const handlePay = () => {
    setMenuVisible(false);
    Alert.alert(
      'Xác nhận thanh toán',
      'Bạn có muốn thanh toán cho sách này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Thanh toán', style: 'default', onPress: () => {
          // Chuyển sang màn hình order review, truyền thông tin sách
          router.push({ pathname: '/order-review', params: { bookId: item._id || item.id } });
        } }
      ]
    );
  };

  const imageUrl = getBookImage(item);
  console.log('WishlistItem image for', item.title, ':', imageUrl);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: item._id || item.id } })}
      style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 12, marginBottom: 14, elevation: 2, padding: 10, alignItems: 'center' }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: 60, height: 90, borderRadius: 8, backgroundColor: '#eee' }}
        resizeMode="cover"
        onError={() => console.log('Image load error:', imageUrl)}
      />
      <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
        <Text style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>By {item.author || 'Unknown'}</Text>
        <Text style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 4 }} numberOfLines={2}>{item.title}</Text>
        <Text style={{ color: '#222', fontWeight: '600', fontSize: 15 }}>{item.price ? `$${item.price.toLocaleString()}` : 'Liên hệ'}</Text>
      </View>
      <RNView ref={menuButtonRef} collapsable={false} style={{ justifyContent: 'center' }}>
        <TouchableOpacity onPress={openMenu} style={{ padding: 8 }}>
          <Ionicons name="ellipsis-vertical" size={22} color="#222" />
        </TouchableOpacity>
      </RNView>
      {/* Menu popup */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={{ position: 'absolute', left: menuPos.x, top: menuPos.y, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, elevation: 8, minWidth: 170 }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }} onPress={handleRemove}>
              <Ionicons name="trash-outline" size={20} color="#1890FF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#222', fontSize: 15 }}>Remove from WishList</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }} onPress={handlePay}>
              <Ionicons name="card-outline" size={20} color="#1890FF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#222', fontSize: 15 }}>Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }} onPress={() => {/* TODO: share */ setMenuVisible(false); }}>
              <Ionicons name="share-social-outline" size={20} color="#1890FF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#222', fontSize: 15 }}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

export default FavouriteScreen; 