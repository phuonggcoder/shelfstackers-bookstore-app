import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import { formatVND } from '../utils/format';

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
    <Text style={styles.emptyTitle}>Your cart is empty</Text>
    <Text style={styles.emptyText}>
      Browse our categories and discover our best deals!
    </Text>
    <TouchableOpacity 
      style={styles.startShoppingButton}
      onPress={onContinueShopping}
    >
      <Text style={styles.startShoppingText}>Start Shopping</Text>
    </TouchableOpacity>
  </View>
);

const CartScreen = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = React.useState<CartItem[]>(mockCartItems);
  const [promoCode, setPromoCode] = React.useState('');
  const [discount, setDiscount] = React.useState(0);

  const updateQuantity = (bookId: string, increment: boolean) => {
    setCartItems(prev => prev.map(item => {
      if (item.book._id === bookId) {
        return {
          ...item,
          quantity: increment ? item.quantity + 1 : Math.max(1, item.quantity - 1)
        };
      }
      return item;
    }));
  };

  const removeItem = (bookId: string) => {
    setCartItems(prev => prev.filter(item => item.book._id !== bookId));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
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

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.book.cover_image[0] }}
        style={styles.bookCover}
        contentFit="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.book.title}</Text>
        <Text style={styles.bookAuthor}>{item.book.author}</Text>
        <Text style={styles.price}>{formatVND(item.book.price)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.book._id, false)}
          >
            <Ionicons name="remove" size={20} color="#4A3780" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.book._id, true)}
          >
            <Ionicons name="add" size={20} color="#4A3780" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item.book._id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );

  const CartContent = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Shopping Cart</Text>
      
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={item => item.book._id}
        contentContainerStyle={styles.cartList}
        scrollEnabled={false}
      />
      
      <View style={styles.promoContainer}>
        <View style={styles.promoInputContainer}>
          <TextInput
            style={styles.promoInput}
            placeholder="Enter promo code"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity 
          style={[styles.promoButton, !promoCode && styles.promoButtonDisabled]}
          onPress={handleApplyPromo}
          disabled={!promoCode}
        >
          <Text style={[styles.promoButtonText, !promoCode && styles.promoButtonTextDisabled]}>
            Apply
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatVND(calculateSubtotal())}</Text>
        </View>
        
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount ({discount}%)</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              -{formatVND(calculateDiscount())}
            </Text>
          </View>
        )}
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatVND(calculateTotal())}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.checkoutButton}
        onPress={() => router.push('/payment')}
      >
        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
      </TouchableOpacity>

      <View style={styles.similarBooksContainer}>
        <Text style={styles.similarBooksTitle}>You might also like</Text>
        {/* TODO: Add similar books carousel */}
      </View>
    </ScrollView>
  );

  return cartItems.length > 0 ? <CartContent /> : <EmptyCart onContinueShopping={() => router.push('/')} />;
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
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  bookAuthor: {
    color: '#666',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3780',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    padding: 5,
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
  checkoutButton: {
    backgroundColor: '#4A3780',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default CartScreen;
