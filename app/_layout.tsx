// Silence Firebase deprecation warnings
(globalThis as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

import { useFCMListener } from '@/hooks/useFCMListener';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { RootSiblingParent } from 'react-native-root-siblings';
import { Provider } from 'react-redux';
import TokenExpiredAlert from '../components/TokenExpiredAlert';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AvatarProvider } from '../context/AvatarContext';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { NameProvider } from '../context/NameContext';
import { UnifiedModalProvider } from '../context/UnifiedModalContext';
import { usePushNotification } from '../hooks/usePushNotification';
import SplashScreen from '../screens/SplashScreen';
import { store } from '../store/store';



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
    <RootSiblingParent>
      <Provider store={store}>
        <LanguageProvider>
          <CartProvider>
            <UnifiedModalProvider>
              <AuthProvider>
                <MenuProvider>
                  <AvatarProvider>
                    <NameProvider>
                      <RootLayoutNav />
                    </NameProvider>
                  </AvatarProvider>
                </MenuProvider>
              </AuthProvider>
            </UnifiedModalProvider>
          </CartProvider>
        </LanguageProvider>
      </Provider>
    </RootSiblingParent>
  );
}

