import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getBooksByCategory, getCart, removeFromCart, updateCartQuantity } from '../services/api';
import { Book } from '../types';
import { formatVND, getFirstValidImage } from '../utils/format';

type CartItem = {
  book: Book;
  quantity: number;
};

// Mock data - replace with real cart data later
const mockCartItems: CartItem[] = [];

const EmptyCart = ({ onContinueShopping }: { onContinueShopping: () => void }) => (
  <View style={styles.emptyContainer}>
    <Image 
      source={require('../assets/images/cart.png')}
      style={styles.emptyCartImage}
      contentFit="contain"
    />
    <Text style={styles.emptyTitle}>Giỏ hàng của bạn còn trống</Text>
    <Text style={styles.emptyText}>
      Khám phá các danh mục của chúng tôi và tìm những ưu đãi tốt nhất!
    </Text>
    <TouchableOpacity 
      style={styles.startShoppingButton}
      onPress={onContinueShopping}
    >
      <Text style={styles.startShoppingText}>Bắt đầu mua sắm</Text>
    </TouchableOpacity>
  </View>
);

const CartScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [relatedCategory, setRelatedCategory] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      if (!token) return;
      const data = await getCart(token);
      const items = (data.items || []).map((item: any) => ({
        book: item.book_id,
        quantity: item.quantity,
      }));
      setCartItems(items);
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch related books by first book's first category
  useEffect(() => {
    const fetchRelated = async () => {
      if (cartItems.length === 0 || !cartItems[0].book?.categories?.length) {
        setRelatedBooks([]);
        setRelatedCategory(null);
        return;
      }
      const categoryId = cartItems[0].book.categories[0]._id || cartItems[0].book.categories[0];
      setRelatedCategory(categoryId);
      try {
        let books = await getBooksByCategory(categoryId);
        // Loại bỏ các sách đã có trong cart
        const cartBookIds = cartItems.map(i => i.book._id);
        books = books.filter(b => !cartBookIds.includes(b._id));
        setRelatedBooks(books);
      } catch {
        setRelatedBooks([]);
      }
    };
    fetchRelated();
  }, [cartItems]);

  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (bookId: string, increment: boolean) => {
    if (!token) return;
    const item = cartItems.find(i => i.book._id === bookId);
    if (!item) return;
    const newQuantity = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    await updateCartQuantity(token, bookId, newQuantity);
    setCartItems(prev => prev.map(i => i.book._id === bookId ? { ...i, quantity: newQuantity } : i));
  };

  const removeItem = async (bookId: string) => {
    if (!token) return;
    await removeFromCart(token, bookId);
    setCartItems(prev => prev.filter(item => item.book._id !== bookId));
  };

  // Chọn/bỏ chọn sách để thanh toán
  const toggleSelect = (bookId: string) => {
    setSelectedIds(prev => prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]);
  };

  // Chọn tất cả
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(cartItems.map(i => i.book._id));
      setSelectAll(true);
    }
  };

  useEffect(() => {
    setSelectAll(selectedIds.length === cartItems.length && cartItems.length > 0);
  }, [selectedIds, cartItems]);

  // Tính tổng chỉ các sách được chọn
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => selectedIds.includes(item.book._id) ? sum + (item.book.price * item.quantity) : sum, 0);
  };

  const calculateDiscount = () => {
    return Math.floor(calculateSubtotal() * (discount / 100));
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleApplyPromo = () => {
    // TODO: Validate promo code from backend
    if (promoCode === 'BOOK10') {
      setDiscount(10);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    if (!item.book) return null;
    const isSelected = selectedIds.includes(item.book._id);
    return (
      <View style={styles.cartItemRow}>
        <View style={styles.cartItemLeft}>
          <Pressable onPress={() => toggleSelect(item.book._id)} style={styles.checkboxWrap} hitSlop={10}>
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
          </Pressable>
          <Image source={{ uri: getFirstValidImage(item.book.cover_image) || '' }} style={styles.bookCoverSmall} contentFit="cover" />
        </View>
        <View style={styles.cartItemInfo}>
          <Text style={styles.bookTitle}>{item.book.title}</Text>
          <Text style={styles.bookAuthor}>Tác giả: {item.book.author}</Text>
          <Text style={styles.price}>{formatVND(item.book.price)}</Text>
          <View style={styles.cartItemActions}>
            <TouchableOpacity style={styles.minusButton} onPress={() => updateQuantity(item.book._id, false)}>
              <Ionicons name="remove" size={22} color="#222" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity style={styles.plusButton} onPress={() => updateQuantity(item.book._id, true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.book._id)}>
              <Ionicons name="trash-outline" size={22} color="#222" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const CartContent = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}> 
      <View style={[styles.headerBar, { paddingTop: 24 }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 220,
          minHeight: '100%',
          flexGrow: 1,
        }}
      >
        <View style={{ marginBottom: 30 }}>
          <FlatList
            data={cartItems.filter(item => item.book)}
            renderItem={renderCartItem}
            keyExtractor={item => item.book?._id || Math.random().toString()}
            contentContainerStyle={styles.cartList}
            scrollEnabled={false}
          />
        </View>
        {relatedBooks.length > 0 && (
          <View style={styles.similarBooksSectionWrap}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.similarBooksTitle}>Sách liên quan</Text>
              {relatedCategory && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/category/[id]', params: { id: String(relatedCategory) } })}>
                  <Text style={{ color: '#3255FB', fontWeight: 'bold' }}>Xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={relatedBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.relatedBookCard} onPress={() => router.push({ pathname: '/book/[id]', params: { id: item._id } })}>
                  <Image source={{ uri: getFirstValidImage(item.cover_image) || '' }} style={styles.relatedBookImage} contentFit="cover" />
                  <Text style={styles.relatedBookTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.relatedBookPrice}>{formatVND(item.price)}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ gap: 16 }}
            />
          </View>
        )}
        {/* Xóa mã giảm giá ở đây, chuyển xuống bar thanh toán */}
      </ScrollView>
      <View style={[styles.checkoutBarRow, { paddingBottom: 36 }]}> 
        <Pressable style={styles.selectAllWrap} onPress={handleSelectAll} hitSlop={10}>
          <View style={[styles.checkbox, selectAll && styles.checkboxChecked]}>
            {selectAll && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
          <Text style={styles.selectAllText}>Tất cả</Text>
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginRight: 10 }}>
          <TouchableOpacity style={styles.voucherBar} onPress={() => router.push('/allcategories')}>
            <Ionicons name="pricetag-outline" size={22} color="#3255FB" style={{ marginRight: 8 }} />
            <Text style={styles.voucherText}>Chọn mã giảm giá</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <Text style={styles.totalLabelSmall}>Tổng cộng</Text>
          <Text style={styles.totalAmountSmall}>{formatVND(calculateTotal())}</Text>
        </View>
        <TouchableOpacity style={[styles.checkoutButtonSmall, { opacity: selectedIds.length === 0 ? 0.5 : 1 }]} onPress={() => router.push({ pathname: '/order-review', params: { ids: selectedIds.join(',') } })} disabled={selectedIds.length === 0}>
          <Text style={styles.checkoutButtonTextSmall}>Thanh toán ({selectedIds.length})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  return loading ? <Text>Đang tải giỏ hàng...</Text> : (cartItems.length > 0 ? <CartContent /> : <EmptyCart onContinueShopping={() => router.push('/')} />);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cartList: {
    gap: 15,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    padding: 10,
    gap: 8,
    minHeight: 100,
    // fix: tránh các item bị dính sát nhau, cho đủ chiều rộng
    width: '100%',
  },
  cartItemLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 8,
    minWidth: 60,
  },
  bookCoverSmall: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E8E8FF',
    marginBottom: 2,
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bookAuthor: {
    color: '#666',
    fontSize: 13,
    marginBottom: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3255FB',
    marginBottom: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  removeButton: {
    padding: 5,
    marginLeft: 8,
  },
  promoContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 15,
    gap: 10,
  },
  promoInputContainer: {
    flex: 1,
  },
  promoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  promoButton: {
    backgroundColor: '#4A3780',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  promoButtonDisabled: {
    backgroundColor: '#E8E8FF',
  },
  promoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  promoButtonTextDisabled: {
    color: '#4A3780',
  },
  summaryContainer: {
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: '#F8F9FF',
    padding: 15,
    borderRadius: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  discountText: {
    color: '#4CAF50',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8FF',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3780',
  },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    zIndex: 10,
  },
  checkoutButton: {
    backgroundColor: '#3255FB',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    width: '100%',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  similarBooksContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  similarBooksTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  startShoppingButton: {
    backgroundColor: '#4A3780',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  startShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#4A3780',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  loginButtonText: {
    color: '#4A3780',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  relatedBookCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  relatedBookImage: {
    width: 90,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#E8E8FF',
  },
  relatedBookTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  relatedBookAuthor: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  relatedBookPrice: {
    fontSize: 12,
    color: '#3255FB',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  checkboxWrap: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3255FB',
    borderColor: '#3255FB',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3255FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  minusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  quantity: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '500',
    minWidth: 18,
    textAlign: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5, // giảm từ 10 xuống 5
    paddingBottom: 5, // giảm từ 10 xuống 5
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 4,
    // giảm tổng chiều cao header
  },
  headerBackBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#222',
    marginRight: 32,
  },
  relatedInlineWrap: {
    marginTop: 8,
    marginLeft: 68,
  },
  relatedBookCardSmall: {
    width: 70,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  relatedBookImageSmall: {
    width: 48,
    height: 64,
    borderRadius: 6,
    marginBottom: 2,
    backgroundColor: '#E8E8FF',
  },
  relatedBookTitleSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1,
  },
  relatedBookPriceSmall: {
    fontSize: 11,
    color: '#3255FB',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  voucherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  voucherText: {
    color: '#3255FB',
    fontWeight: 'bold',
    fontSize: 15,
  },
  checkoutBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 20, // tăng từ 10 lên 20
    paddingHorizontal: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    minHeight: 70, // tăng từ 60 lên 70
  },
  selectAllWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  selectAllText: {
    fontSize: 15,
    marginLeft: 4,
    color: '#222',
  },
  totalWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 10,
  },
  totalLabelSmall: {
    fontSize: 13,
    color: '#888',
  },
  totalAmountSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3255FB',
  },
  checkoutButtonSmall: {
    backgroundColor: '#3255FB',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  checkoutButtonTextSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  similarBooksSectionWrap: {
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 14,
  },
});

export default CartScreen;
