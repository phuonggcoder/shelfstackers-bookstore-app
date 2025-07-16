import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { Provider } from 'react-redux';
import TokenExpiredAlert from '../components/TokenExpiredAlert';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { usePushNotification } from '../hooks/usePushNotification';
import SplashScreen from '../screens/SplashScreen';
import { store } from '../store/store';
import { useFCMListener } from '@/hooks/useFCMListener';

function RootLayoutNav() {
  console.log('🔧 RootLayoutNav: Initializing FCM and Notifee...');
  usePushNotification();
  useFCMListener(); // Sẽ được gọi khi có navigation
  const { isLoading, tokenExpiredAlertVisible, hideTokenExpiredAlert } = useAuth();
  const splashShown = useRef(false);
  const [isSplashing, setIsSplashing] = useState(true);

  useEffect(() => {
    console.log('RootLayoutNav mounted');
    if (!splashShown.current) {
      splashShown.current = true;
      setTimeout(() => {
        setIsSplashing(false);
        console.log('RootLayoutNav: splash done');
      }, 1800);
    } else {
      setIsSplashing(false);
      console.log('RootLayoutNav: splash skipped');
    }
  }, []);

  useEffect(() => {
    console.log('HomeScreen mounted');
  }, []);

  if (isSplashing) {
    console.log('RootLayoutNav: show splash');
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A3780" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            presentation: 'modal',
            animation: 'fade',
          }} 
        />
      </Stack>
      <TokenExpiredAlert 
        visible={tokenExpiredAlertVisible}
        onClose={hideTokenExpiredAlert}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <CartProvider>
        <AuthProvider>
          <MenuProvider>
            <RootLayoutNav />
          </MenuProvider>
        </AuthProvider>
      </CartProvider>
    </Provider>
  );
}
