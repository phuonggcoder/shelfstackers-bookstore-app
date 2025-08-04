import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Stack } from 'expo-router';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { AddressData } from '../services/addressService';

export default function TestAddressAPIScreen() {
  const handleAddressSelect = (address: AddressData) => {
    console.log('Address selected in test screen:', address);
    
    // You can add more logic here like:
    // - Save to local storage
    // - Send to server
    // - Update form state
    // - Navigate to next screen
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Test Address API',
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Address Autocomplete Test</Text>
          <Text style={styles.subtitle}>
            Test the address autocomplete functionality with real API integration
          </Text>
        </View>
        
        <View style={styles.componentContainer}>
          <AddressAutocomplete onAddressSelect={handleAddressSelect} />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Features:</Text>
          <Text style={styles.infoText}>• Real API integration with fallback</Text>
          <Text style={styles.infoText}>• Mock data support</Text>
          <Text style={styles.infoText}>• Error handling</Text>
          <Text style={styles.infoText}>• Loading states</Text>
          <Text style={styles.infoText}>• TypeScript support</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  componentContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
}); 