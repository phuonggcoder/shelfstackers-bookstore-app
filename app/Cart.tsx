import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { addToCartApi } from '../helpers/CartAPI'; 

const MyCart = ({}) => {
  const [promoCode, setPromoCode] = useState('FIRSTBOOK');
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      title: 'Stillwell Long Island',
      author: 'Adam Smith',
      price: 120,
      quantity: 1,
      image: require('../assets/images/booksale1.png'),
    },
    {
      id: 2,
      title: 'Elvenwood Forest',
      author: 'Christina Henry',
      price: 75,
      quantity: 1,
      image: require('../assets/images/booksale2.png'),
    },
  ]);

  const similarBooks = [
    {
      id: 3,
      title: 'The Morac Book 1',
      author: 'Adam Smith',
      price: 60,
      oldPrice: 80,
    },
    {
      id: 4,
      title: 'Warmage Book 2',
      author: 'Terry Mancour',
      price: 60,
      oldPrice: 80,
    },
    {
      id: 5,
      title: 'Warmage Book 2',
      author: 'Terry Mancour',
      price: 60,
      oldPrice: 80,
    },
  ];

  const increaseQty = (id: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const itemTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = 15;
  const grandTotal = itemTotal - discount;

  const handleCheckout = async () => {
  try {
    const cartArray = Array.isArray(cartItems) ? cartItems : [cartItems];

    for (const item of cartArray) {
      if (item?.id && item?.quantity) {
        await addToCartApi(item.id, item.quantity);
      }
    }

    Alert.alert('Success', 'Checkout successfully!');
    console.log('Checkout response: success');
  } catch (error) {
    Alert.alert('Error', 'Checkout failed');
    console.error(error);
  }
};






  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.header}>My Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      {cartItems.map(item => (
        <View key={item.id} style={styles.cartItem}>
          <Image source={item.image} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.author}>By {item.author}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <View style={styles.quantity}>
              <TouchableOpacity onPress={() => decreaseQty(item.id)}>
                <Text style={styles.btn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => increaseQty(item.id)}>
                <Text style={styles.btn}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Similar Books</Text>
        <Text style={styles.seeAll}>See All</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
        {similarBooks.map(book => (
          <View key={book.id} style={styles.similarItem}>
            <Image source={require('../assets/images/booksale3.png')} style={styles.similarImage} />
            <Text style={styles.similarAuthor}>By {book.author}</Text>
            <Text style={styles.similarTitle}>{book.title}</Text>
            <View style={styles.similarPriceRow}>
              <Text style={styles.similarPrice}>${book.price}</Text>
              <Text style={styles.similarOldPrice}>${book.oldPrice}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TextInput
        style={styles.promoInput}
        value={promoCode}
        onChangeText={setPromoCode}
        placeholder="Enter Promo Code"
      />


      <View style={styles.summary}>
        <Text style={styles.summaryText}>Item Total</Text>
        <Text style={styles.summaryText}>${itemTotal.toFixed(2)}</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Discount</Text>
        <Text style={[styles.summaryText, { color: '#26A65B' }]}>-${discount.toFixed(2)}</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.totalLabel}>Grand Total</Text>
        <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    fontSize: 22,
    color: '#1E90FF',
    paddingHorizontal: 5,
  },
  cartItem: { 
    flexDirection: 'row', 
    marginBottom: 20 
  },

  image: { 
    width: 70, 
    height: 100, 
    borderRadius: 8 
  },

  info: { 
    marginLeft: 15, 
    flex: 1 
  },

  author: { 
    color: '#555' 
  },

  title: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginVertical: 2 
  },

  price: { 
    color: '#000' 
  },

  quantity: { 
    flexDirection: 'row', 
    marginTop: 5, 
    alignItems: 'center' 
  },

  btn: { 
    fontSize: 22,
    width: 30, 
    textAlign: 'center', 
    color: '#1E90FF' 
  },

  qty: { 
    marginHorizontal: 10, 
    fontSize: 16 
  },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20 
  },

  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  seeAll: { 
    color: '#007BFF' 
  },

  similarScroll: { 
    marginTop: 10 
  },

  similarItem: { 
    width: 120, 
    marginRight: 15 
  },

  similarImage: { 
    width: 120, 
    height: 150, 
    borderRadius: 8 
  },

  similarAuthor: { 
    fontSize: 12, 
    color: '#555', 
    marginTop: 5 
  },

  similarTitle: { 
    fontSize: 13, 
    fontWeight: 'bold' 
  },

  similarPriceRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  similarPrice: { 
    color: '#000', 
    fontWeight: 'bold', 
    marginRight: 5 
  },

  similarOldPrice: { 
    color: '#999', 
    textDecorationLine: 'line-through', 
    fontSize: 12 
  },

  promoInput: {
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 10, 
    padding: 10, 
    marginTop: 20, 
    paddingRight: 50
  },

  summary: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },

  summaryText: { 
    fontSize: 16 
  },

  totalLabel: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  totalValue: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  checkoutBtn: {
    backgroundColor: '#1E90FF', 
    padding: 15, 
    borderRadius: 10, 
    marginTop: 20, 
    alignItems: 'center',
  },

  checkoutText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },

});

export default MyCart;
