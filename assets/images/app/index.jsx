import { Redirect } from "expo-router";
import { useEffect, useState, useContext } from "react";
import { Image, StyleSheet, View } from "react-native";
import { AppContext } from "@/app-context"

export default function Index() {
  const [time, setTime] = useState(true);
  const {isAuth} = useContext(AppContext);

  useEffect(() => {
    setTimeout(() => {
      setTime(false);
    }, 3000);
  }, []);

  if (time) {
    return (
      <View style={myStyles.container}>
        <Image
          source={require('../assets/images/logoapp.png')}
          style={myStyles.logo}
        />
      </View>
    )
  }
  return isAuth ? <Redirect href="/home/"/> : <Redirect href="/login"/>;
}

const myStyles = StyleSheet.create({
  container: {
    backgroundColor: "#0C0F14",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 123,
    height: 103,
    padding: 50
  },
});
