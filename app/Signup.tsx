import AxiosInstance from "@/helpers/Axioslnstance";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Register: React.FC = ({ navigation }: any) => {
  // State variables for loading status, user input fields, error messages, and modal visibility
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [error, setError] = useState<{
    name: string | null;
    email: string | null;
    password: string | null;
    rePassword: string | null;
  }>({
    name: null,
    email: null,
    password: null,
    rePassword: null,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Function to handle user registration
  const handleRegister = async () => {
    // Check if any input field is empty and set error messages
    if (!name || !email || !password || !rePassword) {
      setError({
        name: !name ? "Username can't be empty" : null,
        email: !email ? "Email can't be empty" : null,
        password: !password ? "Password can't be empty" : null,
        rePassword: !rePassword
          ? "Password confirmation can't be empty"
          : null,
      });
      return;
    }

    setLoading(true);
    try {
      // Check if password and re-typed password match
      if (password !== rePassword) {
        setError({
          name: null,
          email: null,
          password: null,
          rePassword: "Passwords don't match",
        });
      } else {
        // Make a POST request to the register endpoint
        const res = await AxiosInstance().post("/users/register", {
          email: email,
          password: password,
          name: name,
        });
        if (res.status) {
          // If registration is successful, navigate to the LogIn screen
          navigation.navigate("LogIn");
        } else {
          // If registration fails, show the modal
          setIsModalVisible(true);
        }
      }
    } catch (error) {
      // Handle any errors during the registration process
      setIsModalVisible(true);
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
           <Text style={styles.textLight}>Register your account</Text>
           
         <Text style={styles.textGray}>Enter your information below</Text>
      {/* Name input field */}


      <Text style={styles.Name}>Name</Text>
      <View
        style={[
          styles.inputContainer,
          { borderColor: error.name ? "red" : "#DFDFDF" },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      </View>
      {/* Display error message for name */}
      {error.name && <Text style={styles.errorText}>{error.name}</Text>}
      {/* Email input field */}
      <Text style={styles.Email}>Email Address</Text>
      <View
        style={[
          styles.inputContainer,
          { borderColor: error.email ? "red" : "#DFDFDF" },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      {/* Display error message for email */}
      {error.email && <Text style={styles.errorText}>{error.email}</Text>}
      {/* Password input field */}
      <Text style={styles.Email}>Password</Text>
      <View
        style={[
          styles.inputContainer,
          { borderColor: error.password ? "red" : "#DFDFDF" },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Password"
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
      {/* Re-type Password input field */}
      <Text style={styles.Email}>Re-Enter Password</Text>
      <View
        style={[
          styles.inputContainer,
          { borderColor: error.rePassword ? "red" : "#DFDFDF" },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Re-type Password"
          secureTextEntry
          value={rePassword}
          onChangeText={setRePassword}
        />
        {/* Eye icon for password visibility toggle (not functional in this code) */}
        <Image
          source={require("../assets/images/icon-eye.png")}
          style={styles.eyeIcon}
        />
      </View>
      {/* Display error message for re-typed password */}
      {error.rePassword && (
        <Text style={styles.errorText}>{error.rePassword}</Text>
      )}
      {/* Register button */}
      <TouchableOpacity style={styles.buttonRegister} onPress={handleRegister}>
        <Text style={styles.textRegister}>Register</Text>
      </TouchableOpacity>
      {/* Link to LogIn screen */}
      <View style={styles.loginContainer}>
      <Text style={styles.text}>
        Already have an account?{" "}
        <Text
          style={styles.textLink}
          onPress={() => navigation.navigate("LogIn")}
        >
          Login
        </Text>
      </Text>
    </View>
      {/* Loading overlay */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D17842" />
        </View>
      )}
      {/* Modal for registration error */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Account already existed!</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Define the styles for the component
const styles = StyleSheet.create({
   container: {
    width: "100%",
    height: "100%",
    padding: 10,
    marginTop:20,
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
  Name:{
  fontSize:14,
  color: "#A1A1A1",
  marginTop:25,
  },
  Email:{
  fontSize:14,
  color: "#A1A1A1",
  marginTop:13,
  },

  inputContainer: {
    width: "100%",
    marginTop: 10,
    borderColor: "#52555A",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    color: "#52555A",
    fontWeight: "bold",
    outlineColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
  },
  buttonRegister: {
    width: "100%",
    height:55,
    borderRadius: 40,
    marginTop: 40,
    marginBottom: 10,
    padding: 15,
    backgroundColor: "#3255FB",
    alignItems: "center",
  },
  textRegister: {
    color: "#fff",
    fontWeight: "bold",

  },
  loginContainer: {
  alignItems: "center",  // căn giữa ngang
  marginTop: 10,
},
 text: {
  color: "#52555A",
  fontSize: 15,
  fontWeight: "bold",
  justifyContent: "center",
  alignItems: "center",
},
  textLink: {
    color: "#3255FB",
    fontSize: 15,
    fontWeight: "bold",
    
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
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
  modalButton: {
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

export default Register;
