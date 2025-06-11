import React, { useState } from "react";
import AxiosInstance from "@/helpers/AxiosInstance";
import { MyContext } from "@/helpers/MyContext";
import { FlashList } from "@shopify/flash-list";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Modal
} from "react-native";

type PaymentMethod = {
    id: string;
    name: string;
    icon: any;
    balance?: string;
};

const paymentMethods: PaymentMethod[] = [
    { id: '1', name: 'Wallet', icon: require('../assets/images/wallet.png'), balance: '$ 100.50' },
    { id: '2', name: 'Google Pay', icon: require('../assets/images/Group (1).png') },
    { id: '3', name: 'Apple Pay', icon: require('../assets/images/Vector (1).png') },
    { id: '4', name: 'Amazon Pay', icon: require('../assets/images/Group (2).png') }
];

// Pass the navigation prop to the component to enable going back
const Payment: React.FC = ({ navigation }: any) => {
  const { cartProducts, setCartProducts } = React.useContext(MyContext);
  const [loading, setLoading] = useState(false);
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handlePayment = async () => {
    // Check if the cart is empty and prevent empty payments
    if (cartProducts.length === 0) {
        setModalMessage("Your cart is empty. Please add products before paying.");
        setModalVisible(true);
        return;
    }
    setLoading(true);
    try {
      // Map cartProducts to the structure required by the backend
      const payload = {
        email: "a",
        carts: cartProducts.map((item: any) => ({
          product_id: item.id,
          product_name: item.name,
          product_image: typeof item.image === "string" ? item.image : item.image.uri,
          product_quantity: item.quantity,
          product_price: item.price,
        })),
      };

      const res = await AxiosInstance().post("/carts", payload);
      console.log("Payment successful:", res.data);
      // Empty the cart after successful payment
      setCartProducts([]);
      console.log("Cart emptied:", cartProducts);
      setModalMessage("Payment succeeded.");
      setModalVisible(true);
    } catch (error) {
      console.error("Payment error:", error);
      setModalMessage("Payment error.");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };
    return (
        <View style={{flex: 1, backgroundColor: "#0C0F14",}}>
            <View style={styles.container}>
                <View style={styles.khung1}>
                    <TouchableOpacity
                        style={styles.khungArrowLeft}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    >
                        <Image
                            source={require('../assets/images/arrow-left.png')}
                            style={styles.khungIcon} />
                    </TouchableOpacity>
                    <Text style={styles.textP}>Payment</Text>
                </View>
                <View style={styles.khungCard}>
                    <Text style={styles.text1}>Credit Card</Text>
                    <View style={styles.iconCard}>
                        <View style={styles.iconCard1}>
                            <Image source={require('../assets/images/Vector.png')} />
                            <Image source={require('../assets/images/visa.png')}/>
                        </View>
                        <View style={styles.cardNumber}>
                            {['3897', '8923', '6745', '4638'].map((num, index) => (
                                <Text key={index} style={[styles.text1, { letterSpacing: 6.5 }]}>{num}</Text>
                            ))}
                        </View>
                        <View style={styles.cardName}>
                            <View>
                                <Text style={styles.text2}>Card Holder Name</Text>
                                <Text style={styles.text3}>Robert Evans</Text>
                            </View>
                            <View>
                                <Text style={[styles.text2, { textAlign: 'right' }]}>Expiry Date</Text>
                                <Text style={[styles.text3, { textAlign: 'right' }]}>02/30</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <FlatList
                    data={paymentMethods}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.wallet}>
                            <View style={styles.walletInfo}>
                                <Image source={item.icon} style={styles.walletIcon} />
                                <Text style={styles.walletText}>{item.name}</Text>
                            </View>
                            {item.balance && <Text style={styles.text1}>{item.balance}</Text>}
                        </TouchableOpacity>
                    )}
                />
            </View>
            <View style={styles.addCart}>
                <View>
                    <Text style={styles.textPr}>Price</Text>
                    <Text style={styles.textNum}><Text style={{ color: '#D17842', fontWeight: "bold" }}>$</Text> 4.20</Text>
                </View>
                <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
                    <Text style={styles.payText}>Pay from Credit Card</Text>
                </TouchableOpacity>
            </View>

                  {/* Modal for API response feedback */}
                  <Modal
                    transparent={true}
                    animationType="fade"
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                  >
                    <View style={styles.modalContainer}>
                      <View style={styles.modalContent}>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        <View style={styles.modelRowContainer}>
                          <TouchableOpacity
                            style={styles.modalButton1}
                            onPress={() => setModalVisible(false)}
                          >
                            <Text style={styles.modalButtonText}>OK</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>

        </View>
        
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    khung1: {
        flexDirection: "row",
        justifyContent: "center",
        width: '100%',
        marginBottom: 55
    },
    khungArrowLeft: {
        backgroundColor: "#21262E",
        width: 30,
        height: 30,
        borderRadius: 10,
        position: "absolute",
        left: 14,
        top: 10,
        justifyContent: "center",
        alignItems: "center",    },
    khungIcon: {
        height: 20,
        width: 20
    },
    khungCard: {
        borderColor: "#D17842",
        borderWidth: 2,
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 10,
        marginHorizontal: 10
    },
    iconCard: {
        height: 186,
        backgroundColor: "#262B33",
        borderRadius: 15,
        justifyContent: "space-between",
        padding: 10
    },
    iconCard1: {
        flexDirection: 'row',
        justifyContent: "space-between"
    },
    cardNumber: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "90%",
        marginBottom: 10,
    },
    cardName: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    wallet: {
        height: 55,
        backgroundColor: '#262B33',
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        marginVertical: 5,
        marginHorizontal: 15
    },
    walletInfo: {
        flexDirection: "row",
        alignItems: "center",    
    },
    walletIcon: {
        width: 21,
        marginRight: 14
    },
    walletText: {
        fontSize: 14,
        color: "#fff"
    },
    addCart: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#0C0F14'
    },
    payButton: {
        height: 60,
        width: 240,
        backgroundColor: "#D17842",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",    },
    payText: {
        fontSize: 16,
        color: "#fff",
        fontWeight: "700"
    },
    text1: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "700",
        marginLeft: 2
    },
    textPr: {
        fontSize: 14,
        color: "#AEAEAE",
        fontWeight: "700",
        marginLeft: 15
    },
    textP: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 20,
        position: "absolute",
        top: 10
    },
    text2: {
        fontSize: 10,
        color: "#85888C"
    },
    text3: {
        fontSize: 16,
        color: "#fff"
    },
    textNum: {
        fontSize: 20,
        color: "#fff",
        fontWeight: "600"
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(82, 85, 90, 0.5)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#000",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalText: {
        fontSize: 16,
        color: "#fff",
        marginBottom: 20,
    },
    modelRowContainer: {
        width: "80%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },
    modalButton: {
        backgroundColor: "#000",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modalButton1: {
        backgroundColor: "#D17842",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modalButtonText: {
        color: "#fff",
        fontSize: 14,
    },
});

// Very important to export the component
export default Payment;