import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React, { useContext, useState } from 'react'
import { FlashList } from '@shopify/flash-list';
import { AppContext } from '../../app-context';
import { router } from 'expo-router';

const cart = () => {

  const data = [
    {
      image: "https://images.squarespace-cdn.com/content/v1/5aa0bf73af2096458586fb17/a36bf471-adea-450d-86e7-9bc34098efb2/senior-cat-care.jpg",
      name: "Cappuccino abolo uhyg jjkbn",
      price: 6.20,
      quantity: 3
    }
  ]

  const {cart, setCart, updateQuantity, getCartTotal} = useContext(AppContext);

  const [totalPrice, setTotalPrice] = useState(100);

  

  const renderCartITem = ({ item, index }) => {
    const { _id, image, name, price, quantity } = item;
    return (
      <View style={styles.container}>
        <Image style={styles.itemImage} source={{ uri: (item.image) }} />
        <View style={styles.itemDetail}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>
            <Image style={styles.priceIcon} source={require('@/assets/images/dollar.png')} />
            <Text style={styles.price}>{item.price}</Text>
          </Text>
          <View style={styles.itemQuantity}>
            <TouchableOpacity style={styles.itemPlus}><Text style={styles.minus} onPress={() =>updateQuantity(item._id, -1)}>-</Text></TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity style={styles.itemPlus}><Text style={styles.minus} onPress={() => updateQuantity(item._id, +1)}>+</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: "#0C0F14", flex: 1, paddingHorizontal: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { router.push("/children/profile") }}>
          <Image
            source={require('@/assets/images/menu.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <Text style={{color:"white", fontSize:25}}>Cart</Text>
        <TouchableOpacity>
          <Image
            source={require('@/assets/images/user.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
      <FlashList
        data={cart}
        renderItem={renderCartITem}
        horizontal={false}
        estimatedItemSize={200}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.totalPrice}>
        <View style={styles.priceContainer}>
          <Text style={styles.textTotalPrice}>Total Price</Text>
          <Text style={styles.itemPrice}>
            <Image style={styles.priceIcon} source={require('@/assets/images/dollar.png')} />
            <Text style={styles.price}>{getCartTotal()}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.buttonPay} onPress={() => {setCart([])}}>
          <Text style={styles.textPay}>Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default cart

const styles = StyleSheet.create({
  container: {
    width: 330,
    height: 154,
    flexDirection: "row",
    backgroundColor:"#262B33",
    marginVertical:10,
    borderRadius:15
  },
  itemImage: {
    height: 126,
    width: 126,
    alignSelf:"center",
    marginHorizontal:20,
    borderRadius: 10
  },
  header:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    marginVertical:20
  },
  itemDetail:{
    flexDirection:"column",
    justifyContent:"space-around"
  },
  itemName:{
    color:"white",
    fontSize:20,
    maxWidth: 180
  },
  itemPrice:{
    alignItems:"center",
    justifyContent:"center",
    
  },
  priceIcon:{
    width:20,
    height:20
  },
  price:{
    color:"white",
    fontSize:20
  },
  itemQuantity:{
    flexDirection:"row",
    justifyContent:"space-around",
    width:150
  },
  itemPlus:{
    backgroundColor:"orange",
    width:30,
    height:30,
    borderRadius:10
  },
  minus:{
    color:"white",
    fontSize:20,  
    textAlign:"center",
    fontWeight:700
  },
  quantity:{
    width:50,
    height:30,
    borderColor:"orange",
    borderWidth:1,
    borderRadius:10,
    color:"white",
    textAlign:"center",
    textAlignVertical:"center",
    paddingTop:5
  },
  totalPrice:{
    flexDirection:"row",
    justifyContent:"space-between"

  },
  priceContainer:{
    flexDirection:"column",
    justifyContent:"center"
  },
  buttonPay:{
    backgroundColor:"orange",
    paddingHorizontal:100,
    paddingVertical:15,
    borderRadius:15
  },
  textTotalPrice:{
    fontSize:12,
    color:"white",

  },
  textPay:{
    color:"white",
    fontSize:18,
    fontWeight:700
  }

})