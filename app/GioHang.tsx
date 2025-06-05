import CartItem from "@/components/item_cart";
import { MyContext } from "@/helpers/MyContext";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect } from "react";
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

class CartProduct {
  constructor(
    public id: string,
    public name: string,
    public image: ImageSourcePropType,
    public quantity: number,
    public price: number,
    public size: string[]
  ) {}
}

const Cart: React.FC = ({ navigation }: any) => {
  
  const { cartProducts } = React.useContext(MyContext);
  
  const totalPrice = cartProducts.reduce(
    (sum: any, item: any) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    console.log("Cart products updated:", cartProducts);
  }, [cartProducts]);
  return (
    <SafeAreaView style={styles.appDfColor}>
      {/* Header section */}
      <View style={styles.header}>
        {/* Navigate to the Setting screen when pressed */}
        <TouchableOpacity
          style={[
            styles.blockSetting,
            {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#252A32",
            },
          ]}
          onPress={() => {
            navigation.navigate("Setting");
          }}
        >
          <Image source={require("../assets/images/quaylai.png")} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>
          Cart
        </Text>
        {/* Navigate to the Auth screen when pressed */}
        <TouchableOpacity onPress={() => navigation.navigate("Auth")}>
          <Image
            source={require("../assets/images/matnguoi.png")}
            style={styles.blockSetting}
          />
        </TouchableOpacity>
      </View>
      {/* Display message if the cart is empty */}
      {cartProducts.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          {/* Navigate to the Home screen when pressed */}
          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={{ fontWeight: "bold", color: "#fff" }}>
              Go Shopping
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Display the list of cart items if the cart is not empty
        <View style={{ marginTop: 80, paddingHorizontal: 10 }}>
          <FlashList
            data={cartProducts}
            extraData={cartProducts} 
            estimatedItemSize={100}
            horizontal={false}
            refreshing={false}
            renderItem={({ item }: { item: CartProduct }) => (
              <CartItem
                id={item.id}
                image={item.image}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                size={item.size}
                navigation={navigation}
              />
            )}
            keyExtractor={(item) => item.id.toLocaleString()}
          />
        </View>
      )}

      {/* Display the total price and Pay button if the cart is not empty */}
      {cartProducts.length > 0 && (
        <View
          style={{
            width: "100%",
            position: "absolute",
            bottom: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 10,
            marginVertical: 10,
          }}
        >
          <View style={styles.price}>
            <Text style={{ color: "#AEAEAE", fontSize: 14, marginBottom: 5 }}>
              Price
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Image
                source={require("@/assets/images/dollar.png")}
                style={{ width: 20, height: 20, marginRight: 5 }}
              />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>
                {totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
          {/* Navigate to the Payment screen when pressed */}
          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => {
              navigation.navigate("Payment");
            }}
          >
            <Text style={{ fontWeight: "bold", color: "#fff" }}>Pay</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appDfColor: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    width: "100%",
    top: 0,
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
  },
  blockSetting: {
    width: 30,
    height: 30,
    borderRadius: 10,
    padding: 4,
  },
  price: {
    width: "20%",
    alignItems: "center",
  },
  btnAdd: {
    width: "60%",
    backgroundColor: "#D17842",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCartText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 20,
  },
});

export default Cart;
