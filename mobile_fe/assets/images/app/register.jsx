import { Link } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { IconButton } from "react-native-paper";
import AxiosInstance from "../helpers/AxiosInstance"



export default function Register() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRetype, setPasswordRetype] = useState("");
    const [icon, setIcon] = useState("eye-off");
    const [hide, setHide] = useState(true);

    const onRegisterPress = async () =>{
        try {
            const body = {
                email,
                password,
                name
            }
            if(!password.toString == passwordRetype.toString){
                console.log("Wrong Password");
            }
            else{
                const response = await AxiosInstance().post('users/register', body);
                console.log(response);
            }
        } catch (error) {
            console.log('error: ', error);
        }
    }

    return (
        <View style={myStyles.container}>
            <Image style={myStyles.logo} source={require('../assets/images/logoapp.png')} />
            <Text style={myStyles.welcome}>Welcome to Lungo!!</Text>
            <Text style={myStyles.register}>Register to Continue</Text>
            <View style={myStyles.inputcontainer}>
                <TextInput
                    style={myStyles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#aaa"
                />
                <TextInput
                    style={myStyles.input}
                    placeholder="Email"
                    onChangeText={setEmail}
                    value={email}
                    placeholderTextColor="#aaa"
                />
                <View style={myStyles.passwordContainer}>
                    <TextInput
                        style={myStyles.passwordInput}
                        value={password}
                        textContentType="password"
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
                <View style={myStyles.passwordContainer}>
                    <TextInput
                        style={myStyles.passwordInput}
                        value={passwordRetype}
                        secureTextEntry={hide}
                        onChangeText={setPasswordRetype}
                        placeholder="Re-Type password"
                        placeholderTextColor="#aaa"

                    />
                    <IconButton
                        icon={icon}
                        size={20}
                        onPress={() => {setIcon(icon==="eye-off" ? "eye" : "eye-off"), setHide(!hide)}}
                    />
                </View>
                <TouchableOpacity style={myStyles.registerButton} onPress={onRegisterPress}>
                    <Text style={myStyles.registerContent}>Register</Text>
                </TouchableOpacity>
            </View>
            <View style={myStyles.signIn}>
                <Text style={myStyles.text1}>You have an account? Click</Text>
                <Link href="./login" style={myStyles.text2}> 
                    <Text > Sign in</Text>
                </Link>

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
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 8
    },
    registerButton: {
        width: "100%",
        height: 57,
        backgroundColor: "#D17842",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 20
    },
    registerContent: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        lineHeight: 26
    },
    signIn: {
        flexDirection: "row",

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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,

    },
});