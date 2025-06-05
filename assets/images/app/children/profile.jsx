import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useState } from 'react'
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { AppContext } from '../../app-context';

const profile = () => {
  const Data = [
    {
      id: "1",
      content: 'Personal Details',
      image: require('@/assets/images/usericon.png')
    },
    {
      id: "2",
      content: 'Address',
      image: require('@/assets/images/location.png')
    },
    {
      id: "3",
      content: 'Payment Method',
      image: require('@/assets/images/card-payment.png')
    },
    {
      id: "4",
      content: 'About',
      image: require('@/assets/images/info.png')
    },
    {
      id: "5",
      content: 'Help',
      image: require('@/assets/images/question.png')
    },
    {
      id: "6",
      content: 'Log out',
      image: require('@/assets/images/logout.png')
    },
  ];

  const [settingData, setSettingData] = useState(Data);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const { logout } = useContext(AppContext)


  const renderTag = ({ item, index }) => {
    const { content, image } = item;
    return (
      <TouchableOpacity style={styles.buttonItem} onPress={() => { index == 0 ? router.push("/children/edit_profile") : index == 2 ? router.push("/children/payment") : index == 5 ? setModalVisible(true) : console.log("test"); }}>
        <View style={styles.icon1}>
          <Image style={styles.icon} source={item.image} />
        </View>
        <Text style={styles.textItem}>{item.content}</Text>
        <Image style={styles.iconNext} source={require("@/assets/images/greater-than-symbol.png")} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.button} onPress={() => { router.push("/home") }}>
          <Image style={styles.icon} source={require("@/assets/images/back.png")} />
        </TouchableOpacity>
        <Text style={styles.headerName}>Setting</Text>
      </View>
      <FlashList
        data={settingData}
        renderItem={renderTag}
        horizontal={false}
        estimatedItemSize={200}
        showsHorizontalScrollIndicator={false}
      />
      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to logout?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  logout();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default profile

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
  buttonItem: {
    flexDirection: "row",
    marginVertical: 10
  },
  icon1: {
    width: 15,
    height: 15,
    padding: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(209, 120, 66, 0.5)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 30
  },
  iconNext: {
    position: "absolute",
    right: 0,
    width: 20,
    height: 20
  },
  textItem: {
    fontSize: 16,
    fontWeight: 500,
    color: "#FFFFFF",
    alignContent: "center"
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#555",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#E07A5F",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },

})