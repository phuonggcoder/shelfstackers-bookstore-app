import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import SplashScreen from '../screens/SplashScreen'; // 🔄 Import splash screen

function RootLayoutNav() {
  const { isLoading } = useAuth();

  const [isSplashing, setIsSplashing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 3000); // 3 giây splash

    return () => clearTimeout(timer);
  }, []);

  // ⏳ Giai đoạn hiển thị splash screen
  if (isSplashing) {
    return <SplashScreen />;
  }

  // 🔒 Sau splash → kiểm tra login
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A3780" />
      </View>
    );
  }

  // ✅ Khi login đã kiểm tra xong → hiển thị Stack
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
