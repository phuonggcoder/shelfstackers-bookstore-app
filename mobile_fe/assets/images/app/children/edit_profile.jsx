import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useContext, useState } from 'react'
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { AppContext } from '../../app-context';
import AxiosInstance from '@/helpers/AxiosInstance';

const edit_profile = () => {
    const {userData} = useContext(AppContext); 
    const [name, setName] = useState(userData[1] || "");
    const [email, setEmail] = useState(userData[0] || "");
    const [password, setPassword] = useState("");
    const [passwordReType, setPasswordRetype] = useState("");
    const [icon, setIcon] = useState("eye-off");
    const [hide, setHide] = useState(true);

    const onSavePress = async () => {
        try {
            const body ={
                email,
                password,
                name
            }
            setPassword(userData[3]);
            const response = await AxiosInstance().post("users/update-profile", body);
            console.log(response);
        } catch (error) {
            console.log("error", error);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.button} onPress={()=>{router.push("/children/profile")}}>
                    <Image style={styles.icon} source={require("@/assets/images/back.png")} />
                </TouchableOpacity>
                <Text style={styles.headerName}>Setting</Text>
            </View>
            <View style={styles.informationContainer}>
                <Image style={styles.avatar} source={{ uri: "https://d2zp5xs5cp8zlg.cloudfront.net/image-79322-800.jpg" }} />
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder='Fullname'
                    placeholderTextColor="#aaa"
                />
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder='Email'
                    placeholderTextColor="#aaa"
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        secureTextEntry={hide}
                    />
                    <IconButton
                        icon={icon}
                        size={20}
                        onPress={() => {setIcon(icon==="eye-off" ? "eye" : "eye-off"), setHide(!hide)}}
                    />
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        value={passwordReType}
                        onChangeText={setPasswordRetype}
                        placeholder="Re-Type password"
                        placeholderTextColor="#aaa"
                        secureTextEntry={hide}
                    />
                    <IconButton
                        icon={icon}
                        size={20}
                        onPress={() => {setIcon(icon==="eye-off" ? "eye" : "eye-off"), setHide(!hide)}}
                    />
                </View>
                <TouchableOpacity style={styles.buttonSave} onPress={onSavePress}>
                    <Text style={styles.textSave}>Save</Text>
                </TouchableOpacity>


            </View>

        </View>
    )
}

export default edit_profile

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
    input: {
        width: "100%",
        height: 50,
        backgroundColor: "#1E1E1E",
        color: "#fff",
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderColor: "#252A32",
        borderWidth: 1
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 20,
        alignSelf: "center",
        margin: 30
    },
    passwordContainer: {
        width: "100%",
        height: 50,
        backgroundColor: "#1E1E1E",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        marginBottom: 15,
        borderColor: "#252A32",
        borderWidth: 1
    },
    passwordInput: {
        flex: 1,
        color: "#fff",

    },
    buttonSave: {
        width: "100%",
        backgroundColor: "#D17842",
        borderRadius: 20,
        paddingVertical: 20,
        marginVertical: 50
    },
    textSave: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: 800,
        textAlign: "center"
    }
})