import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { router, useGlobalSearchParams} from 'expo-router'
import AxiosInstance from "@/helpers/AxiosInstance";
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../../app-context';

const detail = () => {
    const sizeDrinks = [
        {
            id: "1",
            content: 'S'
        },
        {
            id: "2",
            content: 'M'
        },
        {
            id: "3",
            content: 'L'
        }
    ];
    const data = {
        id: '1',
        image: 'https://mfiles.alphacoders.com/689/thumb-1920-689588.jpg',
        name: 'Cat',
        detail: 'With Cat & Cat',
        rating: 4.6,
        voting: 4600,
        description: 'A cappuccino is an espresso-based coffee beverage made by combining equal parts of espresso, steamed milk, and milk foam. It is typically served in a 5-6 ounce ceramic cup (like porcelain) to help retain heat',
        price: 2.50
    };
    const [drink, setDrinkData] = useState([]);
    const params = useGlobalSearchParams();
    const {addToCart} = useContext(AppContext);
    console.log(params.id);

    const handleAddToCart = (product) => {
        addToCart({
            _id : product._id,
            name : product.name,
            price: product.price, 
            image: product.image
        });
    };

    useEffect(() => {
            const fetchProducts = async () => {
                try {
                    const response = await AxiosInstance().get(`products/${params.id}`);
                    setDrinkData(response.product);
                } catch (error) {
                    console.log(error);
                }
            };
            fetchProducts();
            return () => { };
        }, []);

    const [sizeData, setSizeData] = useState(sizeDrinks);

    const renderSizeDrinks = ({ item, index }) => {
        const { content } = item;
        return (
            <TouchableOpacity style={styles.sizeButton}>
                <Text style={styles.textItem}>{item.content}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.generalInf}>
                <Image style={styles.productImage} source={{uri : drink.image}} />
                <View style={styles.navbar}>
                    <TouchableOpacity style={styles.button} onPress={()=>router.push("/home")}>
                        <Image style={styles.icon} source={require("@/assets/images/back.png")} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button}>
                        <Image style={styles.icon} source={require("@/assets/images/like.png")} />
                    </TouchableOpacity>
                </View>
                <View style={styles.information}>
                    <View style={styles.productName}>
                        <View>
                            <Text style={styles.textinfo}>{drink.name}</Text>
                            <Text style={styles.productDescription}>{drink.detail}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Image style={styles.star} source={require("@/assets/images/star.png")} />
                            <Text style={styles.rating}>{drink.rating}</Text>
                            <Text style={styles.ratingCount}>({drink.voting})</Text>
                        </View>
                    </View>
                    <View style={styles.productInfo}>
                        <View style={styles.general}>
                            <View style={styles.general1}>
                                <Image style={styles.generalBean} source={require("@/assets/images/beans.png")} />
                                <Text style={styles.textGeneral}>Coffee</Text>
                            </View>
                            <View style={styles.general1}>
                                <Image style={styles.generalBean} source={require("@/assets/images/beans.png")} />
                                <Text style={styles.textGeneral}>Milk</Text>
                            </View>
                        </View>
                        <View style={styles.coffeeType}>
                            <Text style={styles.textGeneral}>Medium Roasted</Text>
                        </View>
                    </View>
                </View>

            </View>
            <View style={styles.detailInf}>
                <View style={styles.detailContainer}>
                    <Text style={styles.title}>Description</Text>
                    <Text style={styles.content}>{drink.description}</Text>
                </View>
                <View style={styles.detailContainer}>
                    <Text style={styles.title}>Size</Text>
                    <FlashList
                        data={sizeDrinks}
                        renderItem={renderSizeDrinks}
                        horizontal={true}
                        estimatedItemSize={200}
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{width:40,}}></View>}
                    />
                </View>
                <View style={styles.detailPriceContainer}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.title}>Price</Text>
                        <View style={styles.priceContent}>
                            <Image style={styles.icon} source={require('@/assets/images/dollar.png')}/>
                            <Text style={styles.rating}>{drink.price}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addToCartBtn} onPress={()=>{handleAddToCart(drink),console.log(drink);}}>
                        <Text style={styles.addtoCartContent}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}

export default detail

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#141921',
        flexGrow:1,
        paddingBottom:10
    },
    generalInf: {
        flex: 2,
    },
    detailInf: {
        flex: 1,
        backgroundColor:"#0C0F14",
        paddingHorizontal:20
    },
    productImage: {
        width: "100%",
        flex: 1,
        justifyContent: "center"
    },
    productName: {
        justifyContent: "space-around"
    },
    textinfo: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: 700,
        maxWidth: 200
    },
    productDescription: {
        color: "#AEAEAE",
        fontSize: 12,
        fontWeight: 500
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    star: {
        width: 22,
        height: 22
    },
    rating: {
        fontSize: 16,
        fontWeight: 700,
        color: "#FFFFFF",
        marginHorizontal: 5
    },
    ratingCount: {
        fontSize: 10,
        fontWeight: 500,
        color: "#AEAEAE"
    },
    navbar: {
        position: "absolute",
        top: 15,
        flexDirection: "row",
        width: "90%",
        marginHorizontal: 20,
        justifyContent: "space-between"
    },
    information: {
        flex: 2,
        width: "100%",
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        position: "absolute",
        bottom: 0,
        paddingVertical: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopStartRadius: 25,
        borderTopRightRadius: 25

    },
    productInfo: {
        flexDirection: "column",
        justifyContent: "space-between",
        width: "45%"
    },
    general: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    general1: {
        backgroundColor: "#141921",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        width: "40%",
        borderRadius: 10,
        paddingVertical: 5
    },
    coffeeType: {
        backgroundColor: "#141921",
        textAlign: "center",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        width: "100%",
        fontSize: 10

    },
    textGeneral: {
        color: "#EAEAEA",
        textAlign:"center"
    },
    button: {
        backgroundColor: "#21262E",
        padding: 10,
        borderRadius: 10,
    },
    icon: {
        width: 17,
        height: 17
    },
    detailContainer:{
        width: "100%",
    },
    detailPriceContainer:{
        width: "100%",
        flexDirection:"row",
        justifyContent:"space-between",
        verticalAlign:"center",
        marginVertical:20
    },
    sizeButton:{
        height:40,
        width: 105,
        justifyContent:"center",
        backgroundColor:"#141921",
    },
    textItem:{
        color:"#ffffff",
        textAlign:"center",
        fontSize:16,
        fontWeight:200
    },
    title:{
        fontSize:14,
        fontWeight:800,
        color:"#AEAEAE",
        marginVertical:10
    },
    content:{
        fontSize:12,
        fontWeight:500,
        color:"#AEAEAE",
        textAlign:"justify",
    },
    addToCartBtn:{
        backgroundColor:"#D17842",
        paddingHorizontal:50,
        paddingVertical:10,
        justifyContent:"center",
        borderRadius:12
    },
    priceContent:{
        flexDirection:"row",
        justifyContent:"center",
        alignItems:"center"
    },
    addtoCartContent:{
        fontSize:16,
        fontWeight:700,
        color:"#FFFFFF",
        padding:10
    }
})