import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const payment = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.button} onPress={() => { router.push("/children/profile") }}>
                    <Image style={styles.icon} source={require("@/assets/images/back.png")} />
                </TouchableOpacity>
                <Text style={styles.headerName}>Payment</Text>
            </View>
            <View style={styles.creditCard}>
                <Text style={styles.textCreditCard}>Credit Card</Text>
                <View style={styles.formCreditCard}>
                    <View style={styles.visa}>
                        <Image style={styles.iconUser} source={require("@/assets/images/usericon.png")} />
                        <Image style={styles.iconVisa} source={require("@/assets/images/symbols.png")} />
                    </View>
                    <View>
                        <Text style={{ color: "white", fontWeight: 700, fontSize: 17, marginVertical: 30 }}>3 8 9 7   8 9 2 3   6 7 4 5   4 6 3 8</Text>
                    </View>
                    <View style={styles.cardHolder}>
                        <Text style={{ color: "white", fontWeight: 300, fontSize: 13 }}>Card Holder Name</Text>
                        <Text style={{ color: "white", fontWeight: 300, fontSize: 13 }}>Expiry Data</Text>
                    </View>
                    <View style={styles.cardInf}>
                        <Text style={{ color: "white", fontWeight: 500, fontSize: 17 }}>Robert Evans</Text>
                        <Text style={{ color: "white", fontWeight: 500, fontSize: 17 }}>02/30</Text>
                    </View>
                </View>
            </View>
            <View style={styles.others}>
                <Image style={styles.iconWallet} source={require("@/assets/images/wallet.png")} />
                <Text style={{ color: "white", fontWeight: 500, fontSize: 17 }}>Wallet</Text>
                <Text style={{ color: "white", fontWeight: 500, fontSize: 17, marginLeft: 180 }}>$ 1000.00</Text>
            </View>
            <View style={styles.others}>
                <Image style={styles.iconWallet} source={require("@/assets/images/google-pay.png")} />
                <Text style={{ color: "white", fontWeight: 500, fontSize: 17, marginLeft: 10 }}>Google Pay</Text>
            </View>
            <View style={styles.others}>
                <Image style={styles.iconWallet} source={require("@/assets/images/apple-pay.png")} />
                <Text style={{ color: "white", fontWeight: 500, fontSize: 17, marginLeft: 10 }}>Apple Pay</Text>
            </View>
            <View style={styles.others}>
                <Image style={styles.iconWallet} source={require("@/assets/images/social.png")} />
                <Text style={{ color: "white", fontWeight: 500, fontSize: 17, marginLeft: 10 }}>Amazon Pay</Text>
            </View>
            <View style={styles.totalPrice}>
                <View style={styles.priceContainer}>
                    <Text style={styles.textTotalPrice}>Total Price</Text>
                    <Text style={styles.itemPrice}>
                        <Image style={styles.priceIcon} source={require('@/assets/images/dollar.png')} />
                        <Text style={styles.price}>${42}</Text>
                    </Text>
                </View>
                <TouchableOpacity style={styles.buttonPay}>
                    <Text style={styles.textPay}>Pay</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default payment

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141921',
        paddingHorizontal: 20,

    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20
    },
    button: {
        width: 30,
        height: 30,
        backgroundColor: "#21262E",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        padding: 20
    },
    icon: {
        width: 15,
        height: 15,
    },
    headerName: {
        flex: 1,
        textAlign: "center",
        fontSize: 20,
        fontWeight: 700,
        color: "#FFFFFF"
    },
    creditCard: {
        borderWidth: 1,
        borderColor: "#D17842",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 15
    },
    textCreditCard: {
        color: "white",
        fontWeight: 600,
        fontSize: 20
    },
    visa: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    formCreditCard: {
        backgroundColor: "#262B33",
        padding: 10,
        borderRadius: 15,
        marginTop: 5,
        justifyContent: "space-between"
    },
    iconUser: {
        width: 15,
        height: 15
    },
    iconVisa: {
        width: 50,
        height: 20
    },
    iconWallet: {
        width: 50,
        height: 50
    },
    cardHolder: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    cardInf: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    others: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#262B33",
        borderRadius: 15,
        marginVertical: 10,
        padding: 5
    },
    totalPrice:{
        flexDirection:"row",
        justifyContent:"space-between",
        marginTop:220
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


})