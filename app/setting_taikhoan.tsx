import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import AxiosInstance from "@/helpers/AxiosInstance";

const AccountSettings: React.FC = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("a");
  const [password, setPassword] = useState("a");
  const [rePassword, setRePassword] = useState("a");

  // Gửi yêu cầu API...
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleSave = async () => {
    console.log("handleSave invoked");
    if (!name.trim() || !email.trim() || !password.trim() || !rePassword.trim()) {
      setModalMessage("Please fill in all fields.");
      setModalVisible(true);
      return;
    }
    if (password !== rePassword) {
      setModalMessage("Passwords do not match.");
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      console.log("Sending API request...");
      const res = await AxiosInstance().post("/users/update-profile", {
        email,
        password,
        name,
      });
      console.log("API response received", res);

      // Trích xuất kết quả bất kể nó có được bọc trong data hay không
      const result = res.data !== undefined ? res.data : res;
      if (result.status === true) {
        setModalMessage("Profile updated successfully!");
      } else {
        setModalMessage("Failed to update profile. Please try again.");
      }
      setModalVisible(true);
    } catch (error) {
      console.error("API error:", error);
      setModalMessage("An error occurred. Please try again.");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.appDfColor}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.btnIconBack}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Image source={require("@/assets/images/arrow-left.png")} />
        </TouchableOpacity>
        <Text style={styles.title}>Setting</Text>
      </View>
      <View style={styles.imgContainer}>
        <Image
          style={styles.imgAccount}
          source={require("@/assets/images/img_user.png")}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#52555A"
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#52555A"
            value={email}
            editable={false} 
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#52555A"
            secureTextEntry
            value={password}
            editable={false} 
            onChangeText={setPassword}
          />
          <Image
            source={require("../assets/images/icon-eye.png")}
            style={styles.eyeIcon}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Re-type Password"
            placeholderTextColor="#52555A"
            secureTextEntry
            value={rePassword}
            editable={false} 
            onChangeText={setRePassword}
          />
          <Image
            source={require("../assets/images/icon-eye.png")}
            style={styles.eyeIcon}
          />
        </View>
        <TouchableOpacity 
          style={styles.buttonRegister} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.textRegister}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/*  Modal để hiển thị phản hồi từ API */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appDfColor: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  btnIconBack: {
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252A32",
    borderRadius: 5,
    position: "absolute",
    left: 0,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  imgContainer: {
    marginTop: 30,
    justifyContent: "center",
    flexDirection: "row",
  },
  imgAccount: {
    width: 150,
    height: 150,
    borderRadius: 10,
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
    color: "#fff",
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
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: "#D17842",
    alignItems: "center",
  },
  textRegister: {
    color: "#fff",
    fontWeight: "bold",
  },
  body: {
    marginTop: 50,
    marginHorizontal: 20,
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

export default AccountSettings;
