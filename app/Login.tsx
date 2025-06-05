import AxiosInstance from "@/helpers/Axioslnstance";
import { MyContext } from "@/helpers/MyContext";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import { CheckBox } from 'react-native-elements';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Define the LogIn component
const LogIn: React.FC = ({ navigation }: any) => {
  // State variables for username, password, error messages, and loading status
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<{
    username: string | null;
    password: string | null;
  }>({
    username: null,
    password: null,
  });
  const [loading, setLoading] = useState(false);
  const { setIsAuth } = React.useContext(MyContext);

  // Function to handle login
  const handleLogin = async () => {
    // Check if username or password is empty and set error messages
    if (!username || !password) {
      setError({
        username: !username ? "Username can't be empty" : null,
        password: !password ? "Password can't be empty" : null,
      });
      return;
    }

    setLoading(true);

    try {
      // Make a POST request to the login endpoint
      const res = await AxiosInstance().post("/users/login", {
        email: username,
        password: password,
      });
      if (res.status) {
        // If login is successful, set authentication status and navigate to HomeTabs
        setIsAuth(true);
        navigation.navigate("HomeTabs");
      } else {
        // If login fails, set error messages
        setError({
          username: "Username or password is incorrect",
          password: "Username or password is incorrect",
        });
      }
    } catch (error) {
      // Handle any errors during the login process
      setError({
        username: "Username or password is incorrect",
        password: "Username or password is incorrect",
      });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View  style={styles.containercon} >
      {/* App logo */}
      <Image
        source={require("../assets/images/logologin.png")}
        style={styles.imgApp}
      />
      </View >
      {/* Welcome text */}
      <Text style={styles.textLight}>Let’s get you Login!</Text>
      {/* Instruction text */}
      <Text style={styles.textGray}>Enter your information below</Text>
      {/* Username input field */}
      <View style={styles.logingoapp}>
        <TouchableOpacity style={styles.buttonSignInGoogle}>
        <Image
          source={require("../assets/images/icon-google.png")}
          style={styles.iconGoogle}
        />
        <Text style={styles.textSignInGoogle}> Google</Text>
      </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSignInGoogle}>
        <Image
          source={require("../assets/images/app.png")}
          style={styles.iconGoogle}
        />
        <Text style={styles.textSignInGoogle}> Apple</Text>
      </TouchableOpacity>
      </View>
      <Image
        source={require("../assets/images/Orlogin.png")}
        style={styles.imglogin}
      />
      <Text style={styles.Email}>Email Address

      </Text>
      <View
        style={[
          styles.inputContainer,
          { borderColor: error.username ? "red" : "#DFDFDF" },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Enter Email Address"
          value={username}
          onChangeText={setUsername}
        />
      </View>
      {/* Display error message for username */}
      {error.username && <Text style={styles.errorText}>{error.username}</Text>}
      
      <Text style={styles.Email}>Password

      </Text>{/* Password input field */}
      <View
        style={[
          styles.inputContainer,
          { borderColor: error.password ? "red" : "#DFDFDF" },
        ]}
      >
        
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {/* Eye icon for password visibility toggle (not functional in this code) */}
        <Image
          source={require("../assets/images/icon-eye.png")}
          style={styles.eyeIcon}
        />
      </View>
      {/* Display error message for password */}
      {error.password && <Text style={styles.errorText}>{error.password}</Text>}
      {/* Sign In button */}

      <View style={styles.rememberContainer}>
      <CheckBox
      title="Remember Me"
      checked={rememberMe}
      onPress={() => setRememberMe(!rememberMe)}
      containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
      textStyle={{ color: '#000' }}
    />
      <Text style={styles.textforgot} >Forgot Password?</Text>
    </View>
      <TouchableOpacity style={styles.buttonSignIn} onPress={handleLogin}>
        <Text style={styles.textSignIn}>Login</Text>
      </TouchableOpacity >
   

      {/* Bottom container with links to Register and Reset Password */}
      <View style={styles.bottomContainer}>
        <Text style={styles.text}>
          Don't have an accont?{" "}
          <Text
            style={styles.textLink}
            onPress={() => navigation.navigate("Register")}
          >
            Register Now
          </Text>
        </Text>
      
      </View>
      {/* Loading overlay */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D17842" />
        </View>
      )}
    </View>
  );
};

// Define the styles for the component
const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 10,
    backgroundColor: "#FFFFFF",
   
  },
  containercon:{
  width: 80,
  height: 80,
  marginTop:20,
  
  },
  imgApp: {
  width: 80,
  height: 39.5,
  marginBottom: 30,
  },
  textLight: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
    fontFamily:"Lexend",
  },
  textGray: {
    fontSize: 14,
    color: "#A1A1A1",
    marginTop:10,
    fontWeight: "bold",
  },
  logingoapp:{
  width: 343,
  height: 56,
  flexDirection: "row",          // ➜ Đặt các phần tử con nằm ngang
  justifyContent: "space-between", // ➜ Cách đều các phần tử
  alignItems: "center", 
  marginBottom:20,
  marginTop:10,
  
  },
   buttonSignInGoogle: {
    width: 165.5,
    height:56,
    borderRadius: 30,
    marginTop: 10,
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  imglogin:{
  width:"100%",
  marginBottom:10,
  },
  
  inputContainer: {
    width: "100%",
    marginTop: 10,
    borderColor: "#52555A",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  Email:{
    color: "#BFBFBF",
    marginTop:15
  },
  input: {
    color: "#DFDFDF",
    width:100,
    height:30,
    outlineColor: "#000",
    borderColor: "#000",
    borderWidth: 0,
  },
  eyeIcon: {
    position: "absolute",
    alignItems:"center",
    marginTop:5,
    right: 14,
  },
  buttonSignIn: {
    width: "100%",
    height:56,
    borderRadius: 30,
    marginTop: 20,
    padding: 15,
    backgroundColor: "#EDEDED",
    alignItems: "center",
  },
  textSignIn: {
    color: "#BFBFBF",
    fontSize:17,
    fontWeight: "bold",
  },
 
  iconGoogle: {
    position: "absolute",
    left: 30,
  },
  textSignInGoogle: {
    color: "#000",
    fontWeight: "bold",
  },
 rememberContainer: {
  flexDirection: "row",          // ➜ Đặt các phần tử con nằm ngang
  justifyContent: "space-between", // ➜ Cách đều các phần tử
  alignItems: "center", 
 
 },
  textforgot:{
  color: '#3255FB',   
  fontWeight: 'bold' 
  },
   rememberText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  bottomContainer: {
    marginTop: 30,
    width: "100%",
    height: 50,
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  text: {
    color: "#52555A",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    position: "absolute",
    marginTop:130,
  },
  textLink: {
    color: "#3255FB",
    fontSize: 12,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
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

export default LogIn;
