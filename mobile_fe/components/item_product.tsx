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
              source={require("../assets/images/star.png")}
              style={styles.star}
            />
            <Text style={styles.rateNumber}>{rate.toLocaleString()}</Text>
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
        <TouchableOpacity style={styles.btnAdd}>
          <Image
            source={require("../assets/images/plus.png")}
            style={styles.iconAdd}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    backgroundColor: "#252A32",
    borderRadius: 25,
    padding: 10,
    marginRight: 15,
    justifyContent: "space-between",
  },
  imgContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  img: {
    width: "100%",
    height: 120,
    objectFit: "cover",
  },
  rateContainer: {
    width: 50,
    backgroundColor: "#00000080",
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
    width: 10,
    height: 10,
    marginRight: 2,
  },
  rateNumber: {
    color: "#fff",
    fontSize: 12,
  },
  nameProduct: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
    marginVertical: 10,
  },
  addContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  btnAdd: {
    padding: 10,
    backgroundColor: "#D17842",
    borderRadius: 10,
  },
  iconAdd: {
    width: 12,
    height: 12,
  },
});

export default ItemProduct;
