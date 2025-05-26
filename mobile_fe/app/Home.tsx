import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ItemProduct from "@/components/item_product";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useState } from "react";
import AxiosInstance from "../helpers/Axioslnstance";
import { MyContext } from "@/helpers/MyContext";

interface Category {
  _id: string;
  name: string;
}

interface Products {
  _id: String;
  name: String;
  description: String;
  image: ImageSourcePropType;
  rating: Number;
  voting: Number;
  category: String;
  price: Number;
}

const Home: React.FC = ({ navigation }: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [selectedId, setSelectedId] = useState<String>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuth } = React.useContext(MyContext);

  useEffect(() => {
    if (isAuth) {
    } else {
      navigation.navigate("Auth");
    }
  }, []);

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      try {
        const res: any = await AxiosInstance().get("/categories");
        setCategories(res.categories);
        setSelectedId(res.categories[0]._id);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setLoading(false);
      }
    };
    getCategories();
    return () => {};
  }, []);

  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const res: any = await AxiosInstance().get(
          `/products?category=${selectedId}`
        );
        setProducts(res.products);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
    return () => {};
  }, [selectedId]);

  return (
    <ScrollView
      style={styles.appDfColor}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.blockSetting,
            {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
              
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Setting");
            }}
          >
            <Image source={require("../assets/images/Vector.png")}
             />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
    <Text style={{ color: "#7B7B7B",  }}>Hello, Willie</Text>
    <Text style={{ color: "#060913" ,fontWeight: "bold", fontSize:20, fontFamily:"Lexend"}}>Keep Exploring</Text>
  </View>

        <TouchableOpacity onPress={() => navigation.navigate("Auth")}>
          <Image
            source={require("../assets/images/Button.png")}
            style={styles.blockSetting}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Image
          source={require("../assets/images/timkiem.svg")}
          style={styles.imgSearch}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          clearButtonMode="always"
        />
         <Image
          source={require("../assets/images/trongtiemkiem.png")}
        />
      </View>
      
      <FlatList
        data={categories}
        horizontal={true}
        refreshing={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedIndex(index);
              setSelectedId(item._id);
            }}
            style={{ alignItems: "center", marginRight: 15 }}
          >
            <Text
              style={[
                styles.type,
                selectedIndex == index && { color: "#d17842" },
              ]}
            >
              {item.name}
            </Text>
            {selectedIndex == index && <View style={styles.circle}></View>}
          </TouchableOpacity>
        )}
        extraData={selectedIndex}
        showsHorizontalScrollIndicator={false}
        style={styles.typeContainer}
      />
      <FlatList
        data={products}
        horizontal={true}
        refreshing={false}
        renderItem={({ item }) => (
          <ItemProduct
            id={item._id}
            image={item.image}
            name={item.name}
            description={item.description}
            price={item.price}
            rate={item.rating}
            navigation={navigation}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      <Text style={styles.title}>Coffee beans</Text>
      <FlatList
        data={products}
        horizontal={true}
        refreshing={false}
        renderItem={({ item }) => (
          <ItemProduct
            id={item._id}
            image={item.image}
            name={item.name}
            description={item.description}
            price={item.price}
            rate={item.rating}
            navigation={navigation}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D17842" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  appDfColor: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
  },
  header: {
    width: "100%",
    top: 0,
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingBottom: 10,
  },
  blockSetting: {
    width: 45,
    height: 45,
    borderRadius: 10,
    padding: 4,
  
  },
  hello:{
   alignItems: "flex-start" 
  },
  
  searchContainer: {
    width: "100%",
    height:48,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 100,
    marginBottom: 20,
    borderWidth: 2, // độ dày của viền
    borderColor: "#DFDFDF"
  },
  imgSearch: {
    marginRight: 30,
  },
  searchInput: {
    width: "100%",
    fontSize: 12,
    color: "#52555A",
    borderWidth: 0,
    outlineColor: "transparent",
  },
  typeContainer: {
    marginVertical: 20,
  },
  type: {
    color: "#52555A",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d17842",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 20,
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
});

export default Home;
