import AxiosInstance from "@/helpers/Axioslnstance";
import { MyContext } from "@/helpers/MyContext";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Products {
  _id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  rating: number;
  voting: number;
  category: string;
  price: number;
}

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

const ProductDetail: React.FC = ({ route, navigation }: any) => {
  const { idProduct } = route.params;
  const [products, setProducts] = useState<Products>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const { cartProducts, setCartProducts } = React.useContext(MyContext);

  const sizeData = ["S", "M", "L"];

  useEffect(() => {
    const getProduct = async () => {
      setLoading(true);
      try {
        const res: any = await AxiosInstance().get(`/products/${idProduct}`);
        setProducts(res.product);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setLoading(false);
      }
    };
    getProduct();
  }, [idProduct]);

  const addProduct = () => {
    if (products) {
      const selectedSize = sizeData[selectedIndex];
      const newCartProduct = new CartProduct(
        products._id,
        products.name,
        products.image,
        1,
        products.price,
        [selectedSize]
      );

      const existingProductIndex = cartProducts.findIndex(
        (item: any) => item.id === newCartProduct.id
      );
      if (existingProductIndex !== -1) {
        const updatedCart = [...cartProducts];
        updatedCart[existingProductIndex].quantity += 1;
        updatedCart[existingProductIndex].size.push(selectedSize);
        setCartProducts(updatedCart);
      } else {
        setCartProducts([...cartProducts, newCartProduct]);
      }
    }
  };
return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      
      <View style={styles.container}>
        <TouchableOpacity style={styles.icon} onPress={() => navigation.goBack()}>
          <Image source={require("@/assets/images/quaylai1.png")} />
        </TouchableOpacity>
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.icon}>
            <Image source={require("@/assets/images/heart.png")} style={{ marginRight: 20 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <Image source={require("@/assets/images/Vector9.png")} style={{ marginRight: 10 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <Image source={require("@/assets/images/cart.png")} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <View style={styles.imageWrapper}>
          <Image style={styles.img} source={products?.image} />
        </View>

        <View style={styles.container2}>
          <View style={styles.block}>
            <Text numberOfLines={2} style={styles.name}>{products?.name}</Text>

            <View style={{ flexDirection: "row", marginBottom: 14 ,justifyContent:"center",alignItems:"center",}}>
              <Text style={{ color: "#000", marginTop:10, fontSize: 15 , justifyContent:"center",alignItems:"center" }}>By Adam Smith </Text>
            </View>
            <View style={{width:"100%", flexDirection: "row", marginBottom: 14 ,justifyContent:"space-between",alignItems:"center",}}>
              <View style={{alignItems:"center",}}>
                <Text style={{ color: "#000", marginTop:10, fontSize: 15 , justifyContent:"center",alignItems:"center" }}>Pages </Text>
                <Text style={{ marginTop:5,fontWeight: "bold", }}>316</Text>
              </View>
               <View style={{alignItems:"center",}}>
                 <Text style={{ color: "#000", marginTop:10, fontSize: 15 , justifyContent:"center",alignItems:"center" }}>Languge </Text>
                  <Text style={{ marginTop:5,fontWeight: "bold", }}>English</Text>
              </View>
               <View style={{alignItems:"center",}}>
                 <Text style={{ color: "#000", marginTop:10, fontSize: 15 , justifyContent:"center",alignItems:"center" }}>Ratings </Text>
                  <Text style={{ marginTop:5,fontWeight: "bold", }} >5.0</Text>
              </View>
              
            </View>


          </View>

        </View>
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ color: "#000", fontWeight: "500",fontSize: 20 }}>Description</Text>
        <Text numberOfLines={3} style={{ color: "#AEAEAE", fontSize: 15, marginVertical: 10 }}>{products?.description}</Text>

        <Text style={{ color: "#000", fontWeight: "500", marginBottom: 10,fontSize: 20 }}>Author</Text>
        
         <View style={styles.Author}>
          <View style={styles.leftSection}>
            <Image
              source={require("@/assets/images/anhnguoi.png")}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name1}>Adam Smith</Text>
              <Text style={styles.role}>Author</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.authorButton}>
            <Text style={styles.authorButtonText}>View Profile</Text>
          </TouchableOpacity>
        </View>


        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <View style={styles.price}>
            <Text style={{ color: "#000", fontSize: 14, marginBottom: 5 }}>Price</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
           <Image source={require("@/assets/images/dollar.png")} style={{ width: 20, height: 20, marginRight: 5, }} />
              <Text style={{ color: "#000", fontSize: 16, fontWeight: "500" }}>{products?.price?.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btnAdd} onPress={addProduct}>
            <Text style={{ fontWeight: "bold", color: "#FFFFFF" }}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D17842" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 10,
    padding: 20,
    zIndex: 999,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: 193,
    height: 271,
    resizeMode: "cover",
    borderRadius: 12,
    
  },
  imageWrapper: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    zIndex: 10,
  },

  container2: {
  width: 311,
  height: 349,
  flexDirection: "row",
  position: "absolute",
  justifyContent:"center",
  alignItems:"center",
  bottom: 20,
  backgroundColor: "#EFF3FF",
  paddingHorizontal: 20,
  borderRadius: 20,
  
   zIndex: 1,
   alignSelf: "center", 
},


  block: {
    width: "100%",
    height: "100%",
    alignItems: "center",
  },
  name: {
  fontSize: 23,
  width: 200,
  color: "#000",
  fontWeight: "500",
  marginTop: 200,
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
    
  },
  blockIcon: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252A32",
    borderRadius: 10,
  },
  textGray: {
    color: "#AEAEAE",
    fontSize: 13,
  },
  sizeBlock: {
    width: 100,
    borderRadius: 15,
    backgroundColor: "#252A32",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  price: {
    width: "20%",
    alignItems: "center",
    color:"#000",
  },
  btnAdd: {
    width: "70%",
    backgroundColor: "#3255FB",
    padding: 15,
    borderRadius: 130,
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    
  },
  Author: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#fff",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    borderRadius: 20,
    marginRight: 10,
  },
  textContainer: {
    justifyContent: "center",
  },
  name1: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom:5,
  },
  role: {
    fontSize: 12,
    color: "#666",
  },
  authorButton: {
    backgroundColor: "#EFF3FF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authorButtonText: {
    fontSize: 14,
    color: "#3255FB",
    fontWeight: "500",
  },
});

export default ProductDetail;