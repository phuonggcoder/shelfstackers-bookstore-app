import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import { getCart, removeFromCart, updateCartQuantity } from '../services/api';

interface CartItem {
  _id: string;
  book_id: {
    _id: string;
    title: string;
    author: string;
    price: number;
    thumbnail?: string;
    cover_image?: string[];
  };
  quantity: number;
}

const CartScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { cartCount, fetchCartCount } = useCart();
  const { user, token } = useAuth();
  const { showErrorToast, showWarningToast, showDeleteDialog, hideModal } = useUnifiedModal();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (token) {
      loadCart();
    }
  }, [token]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await getCart(token!);
      // Filter out items with null book_id to prevent errors
      const validItems = (cartData.items || []).filter((item: any) => item.book_id && item.book_id._id);
      setCart(validItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCart();
      if (token) {
        await fetchCartCount(token);
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getBookImage = (book: any) => {
    if (book.thumbnail) return book.thumbnail;
    if (book.cover_image && book.cover_image.length > 0) {
      return book.cover_image[0];
    }
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  };

  const toggleItemSelection = (bookId: string) => {
    setSelectedItems(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const selectAllItems = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map(item => item.book_id._id));
    }
  };

  const handleQuantityChange = async (bookId: string, newQuantity: number) => {
    if (newQuantity < 1 || !token) return;
    
    try {
      setLoading(true);
      await updateCartQuantity(token, bookId, newQuantity);
      await loadCart();
      await fetchCartCount(token);
          } catch (error) {
        console.error('Error updating quantity:', error);
        showErrorToast(t('error'), t('cannotUpdateQuantity'));
      } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (bookId: string) => {
    if (!token) return;
    
    showDeleteDialog(
      async () => {
        try {
          setLoading(true);
          await removeFromCart(token, bookId);
          await loadCart();
          await fetchCartCount(token);
          setSelectedItems(prev => prev.filter(id => id !== bookId));
          hideModal(); // Explicitly hide the modal after successful deletion
        } catch (error) {
          console.error('Error removing item:', error);
          showErrorToast(t('error'), t('cannotRemoveProduct'));
          hideModal(); // Hide modal even on error
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const calculateTotal = () => {
    // Log chi tiết các item được chọn và số lượng
    const total = selectedItems.reduce((sum, bookId) => {
      const item = cart.find(cartItem => cartItem.book_id._id === bookId);
      if (item) {
        console.log(`Tính tiền: ${item.book_id.title} x ${item.quantity} = ${item.book_id.price * item.quantity}`);
        return sum + (item.book_id.price * item.quantity);
      }
      return sum;
    }, 0);
    console.log('Tổng tiền các item được chọn:', total);
    return total;
  };

  const handleCheckout = useCallback(async () => {
    console.log('=== CHECKOUT PROCESS START ===');
    console.log('handleCheckout called');
    console.log('selectedItems:', selectedItems);
    console.log('cart:', cart);
    
    if (selectedItems.length === 0) {
      console.log('No items selected, showing alert');
      showWarningToast(t('notification'), t('pleaseSelectAtLeastOneProduct'));
      return;
    }
    
    // Get selected cart items
    const selectedCartItems = cart.filter(item => selectedItems.includes(item.book_id._id));
    console.log('selectedCartItems:', selectedCartItems);
    
    const totalAmount = calculateTotal();
    console.log('totalAmount:', totalAmount);
    
    // Store cart data in AsyncStorage as backup
    try {
      await AsyncStorage.setItem('checkout_cart_items', JSON.stringify(selectedCartItems));
      await AsyncStorage.setItem('checkout_total_amount', totalAmount.toString());
      await AsyncStorage.setItem('checkout_item_count', selectedItems.length.toString());
      console.log('✅ Cart data stored in AsyncStorage');
    } catch (error) {
      console.error('❌ Error storing cart data:', error);
    }
    
    // Store cart data in AsyncStorage and navigate
    try {
      await AsyncStorage.setItem('checkout_cart_items', JSON.stringify(selectedCartItems));
      await AsyncStorage.setItem('checkout_total_amount', totalAmount.toString());
      await AsyncStorage.setItem('checkout_item_count', selectedItems.length.toString());
      await AsyncStorage.setItem('checkout_from_cart', 'true');
      console.log('✅ Cart data stored in AsyncStorage');
      
      // Navigate to order review
      console.log('🚀 Navigating to order review...');
      router.push('/order-review');
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Error storing data or navigating:', error);
      showErrorToast(t('error'), t('cannotNavigateToPayment'));
    }
    
    console.log('=== CHECKOUT PROCESS END ===');
  }, [selectedItems, cart, router, t]);

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isSelected = selectedItems.includes(item.book_id._id);
    
    return (
      <View style={styles.cartItem}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => toggleItemSelection(item.book_id._id)}
        >
          <Ionicons 
            name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={isSelected ? "#667eea" : "#bdc3c7"} 
          />
        </TouchableOpacity>
        
        <Image
          source={{ uri: getBookImage(item.book_id) }}
          style={styles.bookImage}
          contentFit="cover"
        />
        
        <View style={styles.itemInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.book_id.title}
          </Text>
          <Text style={styles.bookAuthor}>
            {t('author')}: {item.book_id.author}
          </Text>
          <Text style={styles.bookPrice}>
            {formatPrice(item.book_id.price)}
          </Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.book_id._id, item.quantity - 1)}
              disabled={loading}
            >
              <Ionicons name="remove" size={16} color="#667eea" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.book_id._id, item.quantity + 1)}
              disabled={loading}
            >
              <Ionicons name="add" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(item.book_id._id)}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('cart')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('processing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cart')}</Text>
        <TouchableOpacity onPress={selectAllItems}>
          <Text style={styles.selectAllText}>
            {selectedItems.length === cart.length ? t('deselectAll') : t('selectAll')}
          </Text>
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>{t('cartEmpty')}</Text>
          <Text style={styles.emptyText}>{t('noProductsInCart')}</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopNowText}>{t('shopNow')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
            }
          />
          
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.voucherButton}>
              <Ionicons name="pricetag-outline" size={20} color="#667eea" />
              <Text style={styles.voucherText}>{t('selectPromoCode')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#667eea" />
            </TouchableOpacity>
            
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>{t('total')}</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(calculateTotal())}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.checkoutButton,
                selectedItems.length === 0 && styles.checkoutButtonDisabled
              ]}
              onPress={handleCheckout}
              disabled={selectedItems.length === 0}
            >
              <Text style={styles.checkoutText}>
                {t('checkout')} ({selectedItems.length})
              </Text>
            </TouchableOpacity>
            
            {/* Test button for debugging */}
            <TouchableOpacity 
              style={[styles.checkoutButton, { marginTop: 10, backgroundColor: '#ff6b6b' }]}
              onPress={() => {
                console.log('🧪 Test navigation button pressed');
                try {
                  router.push('/order-review');
                  console.log('✅ Test navigation successful');
                } catch (error) {
                  console.error('❌ Test navigation failed:', error);
                }
              }}
            >
              <Text style={styles.checkoutText}>
                Test Navigation
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  selectAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checkbox: {
    marginRight: 12,
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  bookPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  bottomSection: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  voucherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  voucherText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  checkoutButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
