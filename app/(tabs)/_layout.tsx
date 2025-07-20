import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Dimensions } from 'react-native';
import { DataProvider } from '../../context/DataContext';

const { width } = Dimensions.get('window');

const TabsLayout = () => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

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
          tabBarActiveTintColor: '#4A3780',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          // Position tab bar above Android navigation buttons
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e9ecef',
            paddingBottom: 30,
            paddingTop: 10,
            height: 90,
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
          // Add press effect
          tabBarPressColor: 'transparent',
          tabBarPressOpacity: 0.8,
        })}
        screenListeners={{
          tabPress: (e) => {
            // Add slide animation based on tab position
            const currentRoute = e.target?.split('-')[0];
            const targetRoute = e.target?.split('-')[1];
            
            if (currentRoute && targetRoute) {
              const tabOrder = ['index', 'search', 'categories', 'favourite', 'profile'];
              const currentIndex = tabOrder.indexOf(currentRoute);
              const targetIndex = tabOrder.indexOf(targetRoute);
              
              if (targetIndex > currentIndex) {
                slideToTab('right');
              } else if (targetIndex < currentIndex) {
                slideToTab('left');
              }
            }
          },
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Trang chủ'
          }} 
        />
        <Tabs.Screen 
          name="search" 
          options={{ 
            title: 'Tìm kiếm'
          }} 
        />
        <Tabs.Screen 
          name="categories" 
          options={{ 
            title: 'Danh mục'
          }} 
        />
        <Tabs.Screen 
          name="favourite" 
          options={{ 
            title: 'Yêu thích'
          }} 
        />
        <Tabs.Screen 
          name="profile" 
          options={{ 
            title: 'Cá nhân'
          }} 
        />
      </Tabs>
    </DataProvider>
  );
};

export default TabsLayout; 