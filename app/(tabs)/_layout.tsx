import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataProvider } from '../../context/DataContext';

const { width } = Dimensions.get('window');

const TabsLayout = () => {
  const { t } = useTranslation();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const slideToTab = (direction: 'left' | 'right') => {
    const toValue = direction === 'right' ? width : -width;
    slideAnim.setValue(0);
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <DataProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;
            if (route.name === 'index') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'categories') {
              iconName = focused ? 'apps' : 'apps-outline';
            } else if (route.name === 'favourite') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e9ecef',
            // ensure tab bar accounts for device safe area and appears taller
            paddingBottom: Math.max(24, insets.bottom + 14),
            paddingTop: 10,
            height: Math.max(90, insets.bottom + 75),
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          },
        })}
      >
        <Tabs.Screen 
          name="index" 
          options={{ title: t('home') }} 
        />
        <Tabs.Screen 
          name="search" 
          options={{ title: t('search') }} 
        />
        <Tabs.Screen 
          name="categories" 
          options={{ title: t('categories') }} 
        />
        <Tabs.Screen 
          name="favourite" 
          options={{ title: t('favorite') }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ title: t('profile') }} 
        />
      </Tabs>
    </DataProvider>
  );
};

export default TabsLayout; 
