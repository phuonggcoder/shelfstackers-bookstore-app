import React, { useEffect } from "react";
import { Image, StyleSheet, View, Text, TouchableOpacity,  } from "react-native";  // Thêm import Text

const Splash: React.FC = ({ navigation }: any) => {
   useEffect(() => {
    const timer = setTimeout(() => {
     navigation.replace("Auth"); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo99.png")}
        style={styles.imgApp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  
  
  container: {
    width: "100%",
    height: "100%",
   justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3255FB",
    
  },
  imgApp: {
    width: 120,
    justifyContent: "center",
    alignItems: "center",
    height: 120,
    marginTop:40,
  },
 
    
  
 
});

export default Splash;
