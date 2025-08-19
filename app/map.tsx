import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

// Wrapper screen that navigates to the WebView-based map implementation.
export default function MapScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.center}>
  <Text style={{ marginBottom: 12 }}>Open map to pick an address.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => (router.replace as any)('/osmmap')}>
          <Text style={styles.btnText}>Open Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
          <Text style={styles.btnTextSecondary}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: {
    backgroundColor: '#3255FB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  btnSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  btnTextSecondary: { color: '#333', fontWeight: '600' }
});
