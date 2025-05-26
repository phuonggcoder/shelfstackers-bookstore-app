import { Link, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { IconButton } from "react-native-paper";
import AxiosInstance from "../helpers/AxiosInstance"
import { AppContext } from "../app-context"

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { setIsAuth, isAuth } = useContext(AppContext);
    const {userData, setUserData} = useContext(AppContext);
    const router = useRouter();
    const [icon, setIcon] = useState("eye-off");
    const [hide, setHide] = useState(true);

    const onLoginPress = async () => {
        try {
            const body = {
                email,
                password
            }
            const response = await AxiosInstance().post('users/login', body);
            if (response.status == true) {
                setIsAuth(true);
                console.log(response);
                setUserData([response.user.email, response.user.name, body.password]);
                console.log([response.user.email, response.user.name, body.password]);
                router.push('/home');
            } else {
                Alert.alert("Login Failed", "Invalid email or password");
            }
        }
        catch (error) {
            Alert.alert('Alert Title', 'My Alert Msg', [
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
                {text: 'OK', onPress: () => console.log('OK Pressed')},
              ]);
            console.log("loi ne pa");
        }
    };

    return (
        <View style={myStyles.container}>
            <Image style={myStyles.logo} source={require('../assets/images/logoapp.png')} />
            <Text style={myStyles.welcome}>Welcome to Lungo!!</Text>
            <Text style={myStyles.register}>Login to Continue</Text>
            <View style={myStyles.inputcontainer}>
                <TextInput
                    style={myStyles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Name"
                    placeholderTextColor="#aaa"
                />
                <View style={myStyles.passwordContainer}>
                    <TextInput
                        style={myStyles.passwordInput}
                        value={password}
                        secureTextEntry={hide}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor="#aaa"

                    />
                    <IconButton
                        icon={icon}
                        size={20}
                        onPress={() => {setIcon(icon==="eye-off" ? "eye" : "eye-off"), setHide(!hide)}}
                    />
                </View>
                <View style={myStyles.buttonContainer}>
                    <TouchableOpacity style={myStyles.signInButton}>
                        <Text style={myStyles.registerContent} onPress={onLoginPress}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={myStyles.signInGGButton}>
                        <Image style={myStyles.google} source={require('../assets/images/google.png')} />
                        <Text style={myStyles.googleContent}>Sign in with Google</Text>
                    </TouchableOpacity>
                </View>

            </View>
            <View style={myStyles.signIn}>
                <Text style={myStyles.text1}>Don't have an account? Click </Text>
                <Link href="./register" style={myStyles.text2}>
                    <Text >Register</Text>
                </Link>

            </View>
            <View style={myStyles.signIn}>
                <Text style={myStyles.text1}>Forget Password? Click </Text>
                <Text style={myStyles.text2}>Reset</Text>
            </View>
        </View>
    );
}

const myStyles = StyleSheet.create({
    container: {
        backgroundColor: "#0C0F14",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 14,
        fontFamily: 'Poppins'
    },
    logo: {
        width: 93,
        height: 78,
    },
    welcome: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 26,
    },
    register: {
        color: "#828282",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 26
    },
    inputcontainer: {
        width: '100%',
        marginTop: 31
    },
    input: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#828282",
        color: "#828282",
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginVertical: 8
    },
    passwordContainer: {
        width: "100%",
        height: 50,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
        borderColor: "#828282",
        borderWidth: 1
    },
    passwordInput: {
        flex: 1,
        color: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,

    },
    buttonContainer: {
        marginVertical: 30
    },
    signInButton: {
        width: "100%",
        height: 57,
        backgroundColor: "#D17842",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    registerContent: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        lineHeight: 26
    },
    signIn: {
        flexDirection: "row",
        marginVertical: 5,
        textAlign: "center",
        justifyContent: "center"
    },
    text1: {
        fontSize: 12,
        color: "#828282",
        fontWeight: "bold"
    },
    text2: {
        fontSize: 12,
        color: "#D17842",
        fontWeight: "bold"
    },
    signInGGButton: {
        width: "100%",
        height: 57,
        backgroundColor: "#fff",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10
    },
    googleContent: {
        color: "#000000",
        fontSize: 14,
        fontWeight: "bold",
        lineHeight: 26
    },
    google: {
        position: "absolute",
        top: 20,
        left: 30
    }
});