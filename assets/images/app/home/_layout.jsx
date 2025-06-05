import { Tabs } from "expo-router";
import { Image } from "react-native";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        return {
          tabBarLabel: ({ focused }) => null,
          tabBarStyle:{backgroundColor : "#0C0F14", borderColor:"black", height:50},
          headerShown: false,
          tabBarIcon: ({ focused }) => {
            if (route.name.toString() == "index") {
              return focused ? <Image style={{width:25, height:25}} source={require('@/assets/images/home (1).png')}/> : <Image style={{width:25, height:25}} source={require('@/assets/images/home.png')}/>
            }
            else if (route.name.toString() == "cart"){
              return focused ? <Image style={{width:25, height:25}} source={require('@/assets/images/grocery-store (1).png')}/> : <Image style={{width:25, height:25}} source={require('@/assets/images/grocery-store.png')}/>
            }
            else if (route.name.toString() == "favorite"){
              return focused ? <Image style={{width:25, height:25}} source={require('@/assets/images/heart (1).png')}/> : <Image style={{width:25, height:25}} source={require('@/assets/images/heart.png')}/>
            }else{
              return focused ? <Image style={{width:25, height:25}} source={require('@/assets/images/bell (1).png')}/> : <Image style={{width:25, height:25}} source={require('@/assets/images/bell.png')}/>
            }
          }
        }
      }}

    />
  )
};