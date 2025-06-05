import { FlashList } from "@shopify/flash-list";
import { useContext, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import AxiosInstance from "@/helpers/AxiosInstance";
import { Link, router } from "expo-router";
import { AppContext } from "../../app-context";

const DATA = [
    {
        id: '1',
        name: 'Coffee'
    },
]
const coffeeDrinks = [
    {
        id: '1',
        name: 'Cappuccino',
        description: 'With Steamed Milk',
        price: '4.20',
        rating: 4.5,
        image: 'https://th.bing.com/th/id/R.91b8d00ad03f6adef6cf7125740d5499?rik=VCTh8vTO5EY5RQ&riu=http%3a%2f%2fwww.ffactor.com%2fwp-content%2fuploads%2f2018%2f08%2fAdobeStock_202756131.jpeg&ehk=psyxmQ%2fogP7kPf5r0bj7wwbaDI4aAwg2yCTM6AMuUuI%3d&risl=1&pid=ImgRaw&r=0', // Replace with actual image URL
    },
];

export default function Home() {
    const [categoriesData, setCategoriesData] = useState(DATA);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedId, setSelectedId] = useState("");
    const [coffeeDrink, setDrinkData] = useState(coffeeDrinks);
    const { cart, addToCart } = useContext(AppContext);

    const handleAddToCart = (product) => {
        addToCart({
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image
        });
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await AxiosInstance().get("categories");
                setCategoriesData(response.categories);
            } catch (error) {
                console.log(error);
            }
        };
        fetchCategories();
        return () => { };
    }, []);

    useEffect(() => {
    }, [categoriesData]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await AxiosInstance().get(`products?category=${selectedId}`);
                setDrinkData(response.products);
            } catch (error) {
                console.log(error);
            }
        };
        fetchProducts();
        return () => { };
    }, [selectedId]);

    const renderCategories = ({ item, index }) => {
        const { _id, name } = item;
        return (
            <TouchableOpacity style={myStyle.categoriesContainer} onPress={() => {
                setSelectedIndex(index);
                setSelectedId(_id);
            }}>
                <Text style={[myStyle.textItem, selectedIndex === index && { color: "#D17842" }]}>{name}</Text>
                {
                    selectedIndex === index &&
                    (<View style={myStyle.circle}></View>)
                }
            </TouchableOpacity>
        );
    }

    const renderDrinks = ({ item, index }) => {
        const { _id, name, description, price, rating, image } = item;
        return (
            <TouchableOpacity style={myStyle.productCard}>
                <Link href={{ pathname: "children/detail", params: { id: _id } }}>
                    <View style={myStyle.imageContainer}>
                        <Image style={myStyle.productImage} source={{ uri: image }} />
                        <View style={myStyle.ratingContainer}>
                            <Image style={myStyle.starIcon} source={require("@/assets/images/star.png")} />
                            <Text style={myStyle.rating}>{rating}</Text>
                        </View>
                    </View>
                </Link>
                <Text style={myStyle.name} numberOfLines={1}>{name}</Text>
                <Text style={myStyle.description} numberOfLines={2}>{description}</Text>
                <View style={myStyle.priceContainer}>
                    <View style={myStyle.priceValue}>
                        <Text style={myStyle.dolla}>$</Text>
                        <Text style={myStyle.price}>{price}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { handleAddToCart(item) }} style={myStyle.addButton}>
                        <Image style={myStyle.addSymbol} source={require("@/assets/images/addSymbol.png")} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

        )
    }

    return (
        <ScrollView contentContainerStyle={myStyle.scrollContainer}>
            <View style={myStyle.container}>
                <View style={myStyle.header}>
                    <TouchableOpacity onPress={() => { router.push("/children/profile") }}>
                        <Image
                            source={require('@/assets/images/menu.png')}
                            style={myStyle.icon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image
                            source={require('@/assets/images/user.png')}
                            style={myStyle.icon}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={myStyle.welcome}>Find the best coffee for you</Text>
                <View style={myStyle.searchingBar}>
                    <Image
                        source={require('@/assets/images/search_icon.png')}
                        style={myStyle.iconSearch}
                    />
                    <TextInput style={myStyle.findText} placeholder="Find Your Coffee..."></TextInput>
                </View>
                <View style={{}}>
                    <FlashList
                        data={categoriesData}
                        renderItem={renderCategories}
                        horizontal={true}
                        estimatedItemSize={200}
                        showsHorizontalScrollIndicator={false}
                        extraData={selectedIndex}
                    />
                </View>
                <View style={{}}>
                    <FlashList
                        data={coffeeDrink}
                        renderItem={renderDrinks}
                        horizontal={true}
                        estimatedItemSize={200}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
                <Text style={myStyle.coffeeBean}>Coffee Beans</Text>
                <FlashList
                    data={coffeeDrink}
                    renderItem={renderDrinks}
                    horizontal={true}
                    estimatedItemSize={200}
                    showsHorizontalScrollIndicator={false}
                />
            </View>
        </ScrollView>
    );
}

const myStyle = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: "#0C0F14",
    },
    container: {
        marginHorizontal: 20,
    },
    header: {
        marginVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    icon: {
        width: 30,
        height: 30
    },
    welcome: {
        width: "60%",
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 36,
        color: "#ffffff",
        marginVertical: 20
    },
    searchingBar: {
        padding: 15,
        flexDirection: "row",
        backgroundColor: "#141921",
        borderRadius: 15,
        marginVertical: 10
    },
    iconSearch: {
        width: 20,
        height: 20,
        marginLeft: 10
    },
    findText: {
        color: "#52555A",
        marginLeft: 15,
        fontWeight: 700,
        fontSize: 10
    },
    textItem: {
        color: "#52555A",
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 20,
        marginRight: 24
    },
    circle: {
        width: 8,
        height: 8,
        backgroundColor: "#D17842",
        borderRadius: 7,
        marginRight: 24
    },
    categoriesContainer: {
        height: 34,
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        marginVertical: 20
    },
    productCard: {
        backgroundColor: "#252A32",
        borderRadius: 23,
        width: 150,
        height: 246,
        flexDirection: "column",
        padding: 15,
        marginRight: 20,
        justifyContent: "space-between"
    },
    imageContainer: {
        width: 126,
        height: 126,
        borderRadius: 20,
    },
    productImage: {
        width: "100%",
        height: "100%",
        borderRadius: 20,
    },
    ratingContainer: {
        opacity: 0.7,
        flexDirection: "row",
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#000000",
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 20,
        alignItems: "center",
        padding: 5
    },
    starIcon: {
        width: 12,
        height: 12,
        borderRadius: 20,
        marginHorizontal: 4
    },
    rating: {
        color: "#ffffff",
        marginRight: 8,
        fontSize: 10
    },
    name: {
        color: "#ffffff",
        fontSize: 13
    },
    description: {
        color: "#ffffff",
        fontSize: 9,

    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    priceValue: {
        flexDirection: "row",
        alignItems: "center",
    },
    dolla: {
        color: "#D17842",
        lineHeight: 20,
        fontSize: 15,
        fontWeight: 600,
        marginRight: 5
    },
    price: {
        color: "#ffffff",
        lineHeight: 20,
        fontSize: 15,
        fontWeight: 600
    },
    addButton: {
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D17842",
        borderRadius: 10,
    },
    addSymbol: {
        width: 10,
        height: 10
    },
    coffeeBean: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 20,
        marginVertical: 20
    }
});