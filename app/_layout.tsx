import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';

function RootLayoutNav() {
  const { isLoading } = useAuth();
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
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
