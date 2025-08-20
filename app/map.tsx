import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

// Wrapper screen that navigates to the WebView-based map implementation.
export default function MapScreen() {
  const router = useRouter();
  // Auto-redirect directly to the OSM WebView map so "Open map" goes straight there.
  React.useEffect(() => {
    // use a micro-task to avoid React warning about navigation during render
    setTimeout(() => (router.replace as any)('/osmmap'), 0);
  }, [router]);
  return <View style={styles.container} />;
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
