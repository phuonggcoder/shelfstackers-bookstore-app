import React, { useRef, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

// Simple Leaflet + OSM map in a WebView. Click to select a point, then Confirm.
const html = `
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0}</style>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
<div id="map"></div>
<div id="crosshair" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:999;pointer-events:none;">
  <svg width="32" height="32" viewBox="0 0 24 24"><path fill="#d33" d="M11 2h2v4h-2V2zM11 18h2v4h-2v-4zM2 11h4v2H2v-2zM18 11h4v2h-4v-2zM6.34 6.34l1.41 1.41-2.83 2.83-1.41-1.41 2.83-2.83zM17.66 17.66l1.41 1.41-2.83 2.83-1.41-1.41 2.83-2.83zM6.34 17.66l-2.83 2.83-1.41-1.41 2.83-2.83 1.41 1.41zM19.07 4.93l-1.41 1.41-2.83-2.83 1.41-1.41 2.83 2.83z"/></svg>
</div>
<script>
  const map = L.map('map').setView([10.762913, 106.682036], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  // No-click selection: user positions map so crosshair points to desired coord.
  window.getMapCenter = function() {
    const c = map.getCenter();
    return { latitude: c.lat, longitude: c.lng };
  }

  // Center map on device location using browser geolocation
  window.centerOnMe = function() {
    if (!navigator.geolocation) return window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'no-geolocation' }));
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      map.setView([lat, lng], 16);
    }, function(err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'geolocation-failed', detail: err.message }));
    }, { enableHighAccuracy: true });
  }

  window.confirmSelection = function() {
    const c = map.getCenter();
    window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: c.lat, longitude: c.lng }));
  }
</script>
</body>
</html>
`;

export default function OSMMap() {
  const webviewRef = useRef<any>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.latitude && data.longitude) {
        (async () => {
          const payload = { lat: data.latitude, lng: data.longitude };
          const encoded = encodeURIComponent(JSON.stringify(payload));
          (router.replace as any)(`/add-address?osm=${encoded}`);
        })();
      }
    } catch (e) {
      console.warn('Invalid message from OSM WebView', e);
    }
  };

  const centerOnMe = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to center the map on your position.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const js = `map.setView([${lat}, ${lng}], 16); true;`;
      webviewRef.current?.injectJavaScript(js);
    } catch (err: any) {
      Alert.alert('Location error', err.message || String(err));
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={{ marginTop: 12 }}>Loading map…</Text>
        </View>
      )}
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{ flex: 1 }}
        ref={webviewRef}
        onMessage={onMessage}
        onLoadEnd={() => setLoading(false)}
      />
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btnSecondary} onPress={centerOnMe}>
          <Text style={styles.btnTextSecondary}>Center on me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => webviewRef.current?.injectJavaScript('window.confirmSelection && window.confirmSelection(); true;')}>
          <Text style={styles.btnText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
          <Text style={styles.btnTextSecondary}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
