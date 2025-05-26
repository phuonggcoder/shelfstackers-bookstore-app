import { MyContext } from "@/helpers/MyContext";
import React, { useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Định nghĩa component Settings
const Settings: React.FC = ({ navigation }: any) => {
// Biến trạng thái để kiểm soát hiển thị modal
  const [isModalVisible, setIsModalVisible] = useState(false);
 // Lấy hàm setIsAuth từ context
  const { setIsAuth } = React.useContext(MyContext);

  return (
    <SafeAreaView style={styles.appDfColor}>
      {/* // Phần tiêu đề*/}
      <View style={styles.headerContainer}>
        {/*  Nút quay lại */}
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
      <View style={{ marginTop: 20 }}>
        {/* // Điều hướng đến màn hình AccountSetting khi nhấn */}
        <TouchableOpacity
          style={styles.rowContainer}
          onPress={() => {
            navigation.navigate("AccountSetting");
          }}
        >
          <View style={styles.blockIcon}>
            <View style={styles.iconBox}>
              <Image source={require("@/assets/images/Vector.png")} />
            </View>
            <Text style={styles.text}>Personal Details</Text>
          </View>
          <Image source={require("@/assets/images/Arrow 3.png")} />
        </TouchableOpacity>
        {/* 
// Điều hướng đến màn hình Address khi nhấn */}
        <TouchableOpacity style={styles.rowContainer}>
          <View style={styles.blockIcon}>
            <View style={styles.iconBox}>
              <Image source={require("@/assets/images/Vector1.png")} />
            </View>
            <Text style={styles.text}>Address</Text>
          </View>
          <Image source={require("@/assets/images/Arrow 3.png")} />
        </TouchableOpacity>
        {/* Navigate to PaymentMethod screen when pressed */}
        <TouchableOpacity style={styles.rowContainer}>
          <View style={styles.blockIcon}>
            <View style={styles.iconBox}>
              <Image source={require("@/assets/images/Vector2.png")} />
            </View>
            <Text style={styles.text}>Payment Method</Text>
          </View>
          <Image source={require("@/assets/images/Arrow 3.png")} />
        </TouchableOpacity>
        {/* Navigate to About screen when pressed */}
        <TouchableOpacity style={styles.rowContainer}>
          <View style={styles.blockIcon}>
            <View style={styles.iconBox}>
              <Image source={require("@/assets/images/Vector3.png")} />
            </View>
            <Text style={styles.text}>About</Text>
          </View>
          <Image source={require("@/assets/images/Arrow 3.png")} />
        </TouchableOpacity>
        {/* Navigate to Help screen when pressed */}
        <TouchableOpacity style={styles.rowContainer}>
          <View style={styles.blockIcon}>
            <View style={styles.iconBox}>
              <Image source={require("@/assets/images/Vector4.png")} />
            </View>
            <Text style={styles.text}>Help</Text>
          </View>
          <Image source={require("@/assets/images/Arrow 3.png")} />
        </TouchableOpacity>
        {/* Show logout confirmation modal when pressed */}
        <TouchableOpacity
          style={styles.rowContainer}
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.blockIcon}>
            <View style={styles.iconBox}>
              <Image source={require("@/assets/images/Vector5.png")} />
            </View>
            <Text style={styles.text}>Log out</Text>
          </View>
          <Image source={require("@/assets/images/Arrow 3.png")} />
        </TouchableOpacity>
      </View>
      {/* Logout confirmation modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.modelRowContainer}>
              {/* Cancel button */}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>NO</Text>
              </TouchableOpacity>
              {/* Confirm logout button */}
              <TouchableOpacity
                style={styles.modalButton1}
                onPress={() => {
                  setIsModalVisible(false);
                  navigation.navigate("Auth");
                  setIsAuth(false);
                }}
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

// Define the styles for the component
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
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  blockIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    padding: 10,
    borderRadius: "50%",
    backgroundColor: "#2A1813",
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 20,
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

export default Settings;
