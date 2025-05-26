import { Button, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import _layout from "./_layout";
import Toast from "react-native-toast-message";
import { useEffect } from "react";

// Call the _layout component in the NavigationContainer instead of running from the index.tsx file, which allows for customized first screens
export default function Index() {
  useEffect(() => {
    Toast.show({
      type: 'success',
      text1: 'Hello',
      text2: 'This is a toast message'
    });
  }, []);

  return (
    <>
      <NavigationContainer>
        <_layout />
      </NavigationContainer>
      <Toast />
    </>
    
  );
}

const styles = StyleSheet.create({});
