import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

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
  <div id="pin" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:999;pointer-events:none;">
  <svg width="48" height="48" viewBox="0 0 24 24"><path fill="#e53935" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
</div>
<script>
  const map = L.map('map').setView([10.762913, 106.682036], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  // No-click selection: user positions map so crosshair points to desired coord.
  // Return the map center coordinates (pin is visually centered)
  window.getMapCenter = function() {
    const c = map.getCenter();
    return { latitude: c.lat, longitude: c.lng };
  }

  // Center map on device location using browser geolocation
  window.centerOnMe = function() {
    console.log('[OSM Web] centerOnMe requested');
    if (!navigator.geolocation) {
      console.log('[OSM Web] geolocation not available in browser');
      return window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'center', status: 'no-geolocation' }));
    }
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      console.log('[OSM Web] got device location', lat, lng);
      map.setView([lat, lng], 16);
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'center', status: 'success', latitude: lat, longitude: lng }));
    }, function(err) {
      console.log('[OSM Web] geolocation error', err.message);
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'center', status: 'failed', detail: err.message }));
    }, { enableHighAccuracy: true });
  }

  window.confirmSelection = function() {
    const c = map.getCenter();
    console.log('[OSM Web] confirmSelection (center)', c.lat, c.lng);
    window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'confirm', latitude: c.lat, longitude: c.lng }));
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
      console.log('[OSMMap] onMessage', data);
      if (data && data.event === 'confirm' && data.latitude && data.longitude) {
        (async () => {
          const payload = { lat: data.latitude, lng: data.longitude };
          console.log('[OSMMap] confirm payload', payload);
          const encoded = encodeURIComponent(JSON.stringify(payload));
          (router.replace as any)(`/add-address?osm=${encoded}`);
        })();
      } else if (data && data.event === 'center') {
        console.log('[OSMMap] center event', data);
      } else if (data && data.error) {
        console.warn('[OSMMap] webview error', data);
      }
    } catch (e) {
      console.warn('Invalid message from OSM WebView', e);
    }
  };

  const centerOnMe = useCallback(async () => {
    try {
  console.log('[OSMMap] centerOnMe pressed (native)');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to center the map on your position.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
  console.log('[OSMMap] native location obtained', lat, lng);
      const js = `map.setView([${lat}, ${lng}], 16); true;`;
      webviewRef.current?.injectJavaScript(js);
    } catch (err: any) {
  console.warn('[OSMMap] centerOnMe failed', err);
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
      <View style={styles.controlsFloating}>
        <TouchableOpacity style={styles.btnSecondary} onPress={centerOnMe}>
          <Text style={styles.btnTextSecondary}>Center</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => webviewRef.current?.injectJavaScript('window.confirmSelection && window.confirmSelection(); true;')}
        >
          <Text style={styles.btnText}>Use Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
          <Text style={styles.btnTextSecondary}>Cancel</Text>
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
  ,
  controlsFloating: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
