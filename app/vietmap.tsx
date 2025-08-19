import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function VietmapScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Vietmap integration was removed. Use the Map option to pick an address.</Text>
      <TouchableOpacity onPress={() => router.replace('/map')}>
        <Text style={{ color: '#3255FB', marginTop: 12 }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// styles were removed — this file is a simple stub
