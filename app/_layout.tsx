import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Image, StyleSheet } from "react-native";
import Home from "./Home";
import Cart from "./GioHang";
import Notify from "./thongbao";
import Favorite from "./favorite";
import LogIn from "./Login";
import Register from "./Signup";
import ProductDetail from "./product_detail";
import Splash from "./Splash";
import Settings from "./setting";
import AccountSettings from "./setting_taikhoan";
import React from "react";
import { MyProvider } from "@/helpers/MyContext";
import Payment from "./Thanhtoan";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Một stack riêng cho xác thực, dành riêng cho màn hình đăng nhập và đăng ký
function AuthStack() {
  return (
    //Đặt tuyến ban đầu thành màn hình đăng nhập để nó xuất hiện đầu tiên.
 <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LogIn}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


function TabNavigator() {
  return (
    <Tab.Navigator
    
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: 60,
          flexDirection: "row",
          alignItems: "center",
        },
        headerShown: false,
        tabBarLabel: () => null,
        tabBarVisible: route.name !== "LogIn" && route.name !== "Register",
      })}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../assets/images/Home (3).png")}
              style={[
                styles.icon,
                { tintColor: color, width: 45, height: 45},
              ]}
            />
            
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={Cart}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../assets/images/Categories.png")}
              style={[
                styles.icon,
                { tintColor: color, width: 60, height: 60 },
              ]}
            />
          ),
        }}
      />
     
      <Tab.Screen
        name="Favorite"
        component={Favorite}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../assets/images/Favourite.png")}
              style={[
                styles.icon,
                { tintColor: color, width: 50, height: 50 },
              ]}
            />
          ),
        }}
      />
       
      <Tab.Screen
        name="Notification"
        component={Notify}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../assets/images/Profile.png")}
              style={[
                styles.icon,
                { tintColor: color, width: 40, height: 40 },
              ]}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


export default function Index() {
  return (
   <MyProvider>
      <Stack.Navigator initialRouteName="Splash">
        {/* Splash hiển thị đầu tiên */}
        <Stack.Screen
          name="Splash"
          component={Splash}
          options={{ headerShown: false }}
        />
        {/* Điều hướng từ Splash sang Auth stack */}
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Detail"
          component={ProductDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Setting"
          component={Settings}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AccountSetting"
          component={AccountSettings}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Payment"
          component={Payment}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </MyProvider>
  );
}

const styles = StyleSheet.create({
  icon: {
    resizeMode: "contain",
  },
});
