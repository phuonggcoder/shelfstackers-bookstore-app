import { FlashList } from "@shopify/flash-list";
import React, { useContext } from "react";
import { MyContext } from "@/helpers/MyContext";
import {
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Image, View } from "react-native";

// Define the interface for the item product cart properties
interface ItemProductCart {
  id: String;
  image: ImageSourcePropType;
  name: String;
  price: Number;
  quantity: Number;
  size: string[];
  navigation: any;
}

// Define the CartItem component
const CartItem: React.FC<ItemProductCart> = ({
  id,
  image,
  name,
  price,
  quantity,
  size,
  navigation,
}) => {
  // Functions to upate quantity in MyContext.tsx
  const { increaseQuantity, decreaseQuantity } = useContext(MyContext);
  return (
    <View>
      {quantity === 1 ? (
        <View style={styles.container}>
          <View style={styles.imageBlock}>
            <Image source={image} style={styles.image} />
          </View>
          <View style={{ width: "60%", justifyContent: "space-between" }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.sub}>With Steamed Milk</Text>
            <View style={styles.container2}>
              <TouchableOpacity style={styles.sizeBlock}>
                <Text style={styles.text}>{size}</Text>
              </TouchableOpacity>
              <View style={styles.priceContainer}>
                <Image
                  style={{ height: 16, width: 16 }}
                  source={require("../assets/images/dollar.png")}
                />
                <Text style={styles.price}>{price.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.countContainer}>
              <TouchableOpacity
                style={styles.block}
                onPress={() => decreaseQuantity(id)}
              >
                <Text style={styles.text}>-</Text>
              </TouchableOpacity>
              <View style={styles.countBlock}>
                <Text style={styles.text}>{quantity.toString()}</Text>
              </View>
              <TouchableOpacity
                style={styles.block}
                onPress={() => increaseQuantity(id)}
              >
                <Text style={styles.text}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        // Render block for quantity > 1 (similarly add onPress handlers)
        <View style={{ marginBottom: 10 }}>
          <View style={styles.container}>
            <View style={styles.imageBlock}>
              <Image source={image} style={styles.image} />
            </View>
            <View style={{ width: "60%", justifyContent: "space-between" }}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.sub}>With Steamed Milk</Text>
              <View style={styles.block2}>
                <Text style={styles.sub}>Medium Roasted</Text>
              </View>
            </View>
          </View>
          <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
            <FlashList
              data={size}
              renderItem={(item) => (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={styles.container2}>
                    <TouchableOpacity style={styles.sizeBlock}>
                      <Text style={styles.text}>{item.item}</Text>
                    </TouchableOpacity>
                    <View style={styles.priceContainer}>
                      <Image
                        style={{ height: 16, width: 16 }}
                        source={require("../assets/images/dollar.png")}
                      />
                      <Text style={styles.price}>{price.toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.countContainer}>
                    <TouchableOpacity
                      style={styles.block}
                      onPress={() => decreaseQuantity(id)}
                    >
                      <Text style={styles.text}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.countBlock}>
                      <Text style={styles.text}>{quantity.toString()}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.block}
                      onPress={() => increaseQuantity(id)}
                    >
                      <Text style={styles.text}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#252A32",
    borderRadius: 20,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  imageBlock: {
    borderRadius: 15,
    overflow: "hidden",
  },
  image: {
    width: 110,
    height: 110,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  container2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sizeBlock: {
    borderRadius: 10,
    width: "40%",
    backgroundColor: "#000",
    paddingVertical: 5,
  },
  priceContainer: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  countContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  block: {
    width: 30,
    height: 30,
    backgroundColor: "#D17842",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  countBlock: {
    backgroundColor: "#000",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D17842",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 30,
  },
  sub: {
    fontSize: 12,
    color: "#AEAEAE",
  },
  block2: {
    padding: 5,
    backgroundColor: "#252A32",
    borderRadius: 15,
  },
});

export default CartItem;
