import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  initialLat?: number;
  initialLon?: number;
  allowedBbox?: [number, number, number, number] | null;
  onSelect: (res: { lat: number; lon: number; display_name: string; address?: any; type?: string }) => void;
  onRequestLocation?: () => void;
}

const AddressMapSearch = forwardRef<any, Props>(({ 
  initialLat, 
  initialLon, 
  allowedBbox = null, 
  onSelect, 
  onRequestLocation 
}, ref) => {
  const webViewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  
  const initialPosJson = (initialLat !== undefined && initialLon !== undefined) 
    ? JSON.stringify({ lat: initialLat, lon: initialLon }) 
    : 'null';
  const allowedBboxJson = allowedBbox ? JSON.stringify(allowedBbox) : 'null';

  useImperativeHandle(ref, () => ({
    injectJavaScript: (script: string) => {
      if (webViewRef.current && mapReady) {
        webViewRef.current.injectJavaScript(script);
      }
    }
  }));

  // Optimized map initialization
  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Address Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          #map {
            position: relative;
            overflow: hidden;
          }
          
          .center-marker {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -100%);
            pointer-events: none;
            z-index: 1000;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          
          .location-btn {
            position: absolute;
            right: 10px;
            bottom: 10px;
            z-index: 1001;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #3255FB;
            box-shadow: 0 4px 12px rgba(50, 85, 251, 0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          
          .location-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(50, 85, 251, 0.4);
          }
          
          .location-btn:active {
            transform: scale(0.95);
          }
          
          .location-btn svg {
            width: 24px;
            height: 24px;
            fill: #3255FB;
          }
          
          .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3255FB;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="map">
          <div class="loading-overlay" id="loadingOverlay">
            <div class="loading-spinner"></div>
          </div>
        </div>
        
        <script>
          // Global variables
          window.INITIAL_POS = ${initialPosJson};
          window.ALLOWED_BBOX = ${allowedBboxJson};
          window.map = null;
          window.centerMarker = null;
          window.locationBtn = null;
          
          // Initialize map when Leaflet is loaded
          function initMap() {
            try {
              // Create map with optimized settings
              window.map = L.map('map', {
                zoomControl: true,
                tap: false,
                inertia: true,
                inertiaDeceleration: 3000,
                preferCanvas: true,
                maxZoom: 18,
                minZoom: 8
              });
              
              // Add tile layer with optimized settings
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                maxNativeZoom: 18,
                updateWhenIdle: true,
                updateWhenZooming: false
              }).addTo(window.map);
              
                             // Set initial view
               if (window.INITIAL_POS) {
                 console.log('Setting initial map position:', window.INITIAL_POS);
                 window.map.setView([window.INITIAL_POS.lat, window.INITIAL_POS.lon], 17);
               } else {
                 console.log('Using default map position');
                 window.map.setView([10.8231, 106.6297], 10); // TP.HCM default
               }
              
              // Create center marker
              createCenterMarker();
              
              // Create location button
              createLocationButton();
              
              // Add event listeners
              setupEventListeners();
              
              // Hide loading overlay
              document.getElementById('loadingOverlay').style.display = 'none';
              
              // Notify React Native that map is ready
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'map_ready' 
              }));
              
            } catch (error) {
              console.error('Error initializing map:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'map_error', 
                error: error.message 
              }));
            }
          }
          
          function createCenterMarker() {
            const marker = document.createElement('div');
            marker.className = 'center-marker';
            marker.innerHTML = \`
              <svg width="36" height="48" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C7.03 0 3 4.03 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.97-4.03-9-9-9zm0 12.25A3.25 3.25 0 1 1 12 5.75a3.25 3.25 0 0 1 0 6.5z" fill="#d00"/>
              </svg>
            \`;
            document.getElementById('map').appendChild(marker);
            window.centerMarker = marker;
          }
          
          function createLocationButton() {
            const btn = document.createElement('button');
            btn.className = 'location-btn';
            btn.title = 'Định vị vị trí hiện tại';
            btn.innerHTML = \`
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            \`;
            
            btn.addEventListener('click', function() {
            // Show loading state
              this.innerHTML = \`
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#3255FB" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
              \`;
            this.style.pointerEvents = 'none';
            
              // Request location from React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'request_location' 
            }));
            
            // Reset button after 3 seconds
            setTimeout(() => {
                this.innerHTML = \`
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                \`;
              this.style.pointerEvents = 'auto';
            }, 3000);
          });

            document.getElementById('map').appendChild(btn);
            window.locationBtn = btn;
          }
          
          function setupEventListeners() {
            // Update position when map moves
            window.map.on('moveend', function() {
              const center = window.map.getCenter();
              
              // Check if position is within allowed bounds
              if (window.ALLOWED_BBOX) {
                const [latMin, latMax, lonMin, lonMax] = window.ALLOWED_BBOX;
                if (!(center.lat >= latMin && center.lat <= latMax && 
                      center.lng >= lonMin && center.lng <= lonMax)) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'oob', 
                    lat: center.lat, 
                    lon: center.lng 
                  }));
                  return;
                }
              }
              
              // Send position update
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'position_update', 
              lat: center.lat, 
              lon: center.lng 
            }));
          });

            // Handle map clicks for confirmation
            window.map.on('click', function(e) {
              const lat = e.latlng.lat;
              const lng = e.latlng.lng;
              
              // Get address information
              fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${lat}&lon=\${lng}&addressdetails=1\`)
                .then(response => response.json())
                .then(data => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'confirm', 
                    lat: lat, 
                    lon: lng, 
                    display_name: data.display_name || '', 
                    address: data.address || null 
                  }));
                })
                .catch(error => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'confirm', 
                    lat: lat, 
                    lon: lng, 
                    display_name: '', 
                    address: null 
                  }));
                });
            });
          }
          
          // Load Leaflet and initialize map
          function loadLeaflet() {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = initMap;
            document.head.appendChild(script);
          }
          
          // Start loading when page is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadLeaflet);
          } else {
            loadLeaflet();
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
            if (!msg || !msg.type) return;
            
      switch (msg.type) {
        case 'map_ready':
          setMapReady(true);
          setIsLoading(false);
          break;
          
        case 'request_location':
              if (onRequestLocation) {
                onRequestLocation();
              }
          break;
          
        case 'position_update':
        case 'confirm':
        case 'oob':
          onSelect({ 
            lat: msg.lat, 
            lon: msg.lon, 
            display_name: msg.display_name || '', 
            address: msg.address, 
            type: msg.type 
          });
          break;
          
        case 'map_error':
          console.error('Map error:', msg.error);
          setIsLoading(false);
          break;
      }
    } catch (error) {
      console.warn('Error parsing WebView message:', error);
    }
  };

  // Handle location updates from React Native
  useEffect(() => {
    if (mapReady && webViewRef.current) {
                const script = `
                  if (window.map) {
          const center = window.map.getCenter();
                      window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'position_update', 
                        lat: center.lat, 
                        lon: center.lng 
                      }));
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [mapReady]);

  // Expose function to move map to location
  useImperativeHandle(ref, () => ({
    injectJavaScript: (script: string) => {
      if (webViewRef.current && mapReady) {
        webViewRef.current.injectJavaScript(script);
      }
    },
    moveToLocation: (lat: number, lng: number, zoom: number = 17) => {
      if (webViewRef.current && mapReady) {
        const script = `
          if (window.map) {
            console.log('Moving map to location:', ${lat}, ${lng}, ${zoom});
            window.map.setView([${lat}, ${lng}], ${zoom}, {
              animate: true,
              duration: 1.0
            });
                  }
                `;
                webViewRef.current.injectJavaScript(script);
              }
    }
  }), [mapReady]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: mapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onMessage={handleMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          // Keep loading until map is ready
          if (!mapReady) {
            setTimeout(() => setIsLoading(false), 2000);
          }
        }}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

AddressMapSearch.displayName = 'AddressMapSearch';

export default AddressMapSearch;
