import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { DataProvider } from '../../context/DataContext';

const TabsLayout = () => {
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
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
        <Tabs.Screen name="favourite" options={{ title: 'Favorite' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </DataProvider>
  );
};

export default TabsLayout; 