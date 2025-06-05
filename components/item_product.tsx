import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define the interface for the item product properties
interface product {
  id: String;
  image: ImageSourcePropType;
  name: String;
  description: String;
  price: Number;
  rate: Number;
  navigation: any;
}

// Define the ItemProduct component
const ItemProduct: React.FC<product> = ({
  id,
  image,
  name,
  description,
  price,
  rate,
  navigation,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      // Navigate to the Detail screen with the product ID when pressed
      onPress={() => {
        navigation.navigate("Detail", { idProduct: id });
      }}
    >
      <View>
        <View style={styles.imgContainer}>
          <Image source={image} style={styles.img} />
          <View style={styles.rateContainer}>
            <Image
              source={require("../assets/images/Button (1).png")}
              style={styles.star}
            />
             
          </View>
        </View>
        <Text numberOfLines={2} style={styles.nameProduct}>
          {name}
        </Text>
      </View>
      <View style={styles.addContainer}>
        <View style={styles.priceContainer}>
          <Image
            source={require("../assets/images/dollar.png")}
            style={styles.iconDollar}
          />
       <Text style={styles.textPrice}>{price.toLocaleString()}</Text> 
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
 container: {
  width: 140, // cố định width container
  height:250,
  backgroundColor: "#FFFFFF",
  borderRadius: 0,
  marginRight: 15,
  justifyContent: "space-between",
  overflow: "hidden",
},
  imgContainer: {
  width: "100%",
  height:150,
  aspectRatio: 1, // Tự giữ tỷ lệ vuông, hoặc có thể bỏ nếu bạn đặt height cố định
  borderRadius: 5,
  overflow: "hidden",
  position: "relative",
  },
  img: {
  width: "100%",
  height: "100%",  // hoặc height: 120 nếu bạn muốn cố định
  resizeMode: "cover",
   // objectFit: "cover",
   
  },
  rateContainer: {
    width: 50,
    position: "absolute",
    top: 0,
    right: 0,
    padding: 4,
    borderBottomLeftRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    width: 20,
    height: 20,
    marginRight: 2,
  },
  rateNumber: {
    color: "#fff",
    fontSize: 12,
  },
  nameProduct: {
    color: "#000",
    fontSize: 14,
    fontWeight: "400",
    marginVertical: 10,
  },
  addContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconDollar: {
    width: 16,
    height: 16,
  },
  textPrice: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },
  btnAdd: {
    padding: 10,
    backgroundColor: "#3255FB",
    borderRadius: 10,
  },
  iconAdd: {
    width: 12,
    height: 12,
  },
});

export default ItemProduct;
