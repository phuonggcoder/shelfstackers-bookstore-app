import { StyleSheet, View } from 'react-native';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { WebView } from 'react-native-webview';

interface Props {
  initialQuery?: string;
  initialLat?: number;
  initialLon?: number;
  // allowedBbox: [lat_min, lat_max, lon_min, lon_max]
  allowedBbox?: [number, number, number, number] | null;
  onSelect: (res: { lat: number; lon: number; display_name: string; address?: any; type?: string }) => void;
  onClose?: () => void;
  onRequestLocation?: () => void;
}

const AddressMapSearch = forwardRef<any, Props>(({ initialQuery = '', initialLat, initialLon, allowedBbox = null, onSelect, onRequestLocation }, ref) => {
  const webViewRef = useRef<any>(null);
  const initialPosJson = (initialLat !== undefined && initialLon !== undefined) ? JSON.stringify({ lat: initialLat, lon: initialLon }) : 'null';
  const allowedBboxJson = allowedBbox ? JSON.stringify(allowedBbox) : 'null';

  useImperativeHandle(ref, () => ({
    injectJavaScript: (script: string) => {
      webViewRef.current?.injectJavaScript(script);
    }
  }));

  const injectedJS = `
    (function(){
      // create map and UI with a fixed center marker and a confirm button
      var L_script = document.createElement('script');
      L_script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(L_script);
      var css = document.createElement('link');
      css.rel='stylesheet'; css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      var geocoderScript = document.createElement('script');
      geocoderScript.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js';
      document.head.appendChild(geocoderScript);

      function init() {
        try {
          // smoother mobile interaction options
          var map = L.map('map', { zoomControl: true, tap: false, inertia: true, inertiaDeceleration: 3000, preferCanvas: true }).setView([14.0583,108.2772], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, maxNativeZoom: 19 }).addTo(map);

          // Tạo geocoder với giới hạn phạm vi nếu có
          var geocoderOptions = {
            defaultMarkGeocode: false,
            geocoder: L.Control.Geocoder.nominatim({ 
              geocodingQueryParams: { 
                countrycodes: 'vn',
                limit: 5,
                addressdetails: 1
              } 
            }),
            placeholder: 'Tìm kiếm địa chỉ...',
            errorMessage: 'Không tìm thấy địa chỉ',
            showResultIcons: true,
            suggestMinLength: 2,
            suggestTimeout: 250
          };

          // Nếu có bbox giới hạn, thêm vào query params
          if (window.ALLOWED_BBOX) {
            try {
              var bbox = window.ALLOWED_BBOX;
              geocoderOptions.geocoder.options.geocodingQueryParams.viewbox = bbox[2] + ',' + bbox[1] + ',' + bbox[3] + ',' + bbox[0];
              geocoderOptions.geocoder.options.geocodingQueryParams.bounded = 1;
            } catch (e) {
              console.warn('Failed to set bbox for geocoder', e);
            }
          }

          var geocoder = L.Control.geocoder(geocoderOptions).addTo(map);

          // create a fixed center marker overlay and attach it to the map container
          var centerMarker = document.createElement('div');
          centerMarker.id = 'centerMarker';
          centerMarker.style.position = 'absolute';
          centerMarker.style.left = '50%';
          centerMarker.style.top = '50%';
          centerMarker.style.transform = 'translate(-50%, -100%)';
          centerMarker.style.pointerEvents = 'none';
          centerMarker.style.zIndex = 1000;
          centerMarker.innerHTML = '<svg width="36" height="48" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C7.03 0 3 4.03 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.97-4.03-9-9-9zm0 12.25A3.25 3.25 0 1 1 12 5.75a3.25 3.25 0 0 1 0 6.5z" fill="#d00"/></svg>';
          // attach marker into the map container to avoid reflows on body
          map.getContainer().appendChild(centerMarker);

          // Center on me button
          var centerBtn = document.createElement('button');
          centerBtn.id = 'centerBtn';
          centerBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/></svg>';
          centerBtn.style.position = 'absolute';
          centerBtn.style.right = '10px';
          centerBtn.style.bottom = '10px';
          centerBtn.style.zIndex = 1001;
          centerBtn.style.padding = '8px';
          centerBtn.style.background = '#fff';
          centerBtn.style.border = '1px solid #ccc';
          centerBtn.style.borderRadius = '50%';
          centerBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          centerBtn.style.cursor = 'pointer';
          map.getContainer().appendChild(centerBtn);

          // Center on me functionality
          centerBtn.addEventListener('click', function() {
            // Gửi message để React Native xử lý geolocation
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'request_location' 
            }));
          });

          function postCenterSelection(extraName) {
            var c = map.getCenter();
            var lat = c.lat; var lon = c.lng;
            // If an allowed bbox was provided, enforce it on confirm
            try {
              if (window.ALLOWED_BBOX) {
                var b = window.ALLOWED_BBOX; // [lat_min, lat_max, lon_min, lon_max]
                var latMin = parseFloat(b[0]);
                var latMax = parseFloat(b[1]);
                var lonMin = parseFloat(b[2]);
                var lonMax = parseFloat(b[3]);
                if (!(lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax)) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'oob', lat: lat, lon: lon }));
                  return;
                }
              }
            } catch (err) {
              // ignore bbox parsing errors and continue
            }

            fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+lat+'&lon='+lon+'&addressdetails=1')
              .then(function(r){ return r.json(); })
              .then(function(data){
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'confirm', lat: lat, lon: lon, display_name: data.display_name || extraName || '', address: data.address || null }));
              }).catch(function(){
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'confirm', lat: lat, lon: lon, display_name: extraName || '', address: null }));
              });
          }



          // if initial position provided from React Native, center map there
          try {
            if (window.INITIAL_POS) {
              var p = window.INITIAL_POS;
              // use a moderate zoom to avoid heavy tile loading; user can zoom further
              map.setView([p.lat, p.lon], 17);
            }
          } catch(e){}

          // when geocoder returns a result, fly to that location for smooth animation
          geocoder.on('markgeocode', function(e) {
            var latlng = e.geocode.center;
            map.flyTo(latlng, 17, { animate: true, duration: 0.6 });
            // Auto-confirm when geocoder result is selected
            postCenterSelection(e.geocode.name);
          });

          // Auto-update position when map is moved
          map.on('moveend', function() {
            var center = map.getCenter();
            // Update current position without confirming
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'position_update', 
              lat: center.lat, 
              lon: center.lng 
            }));
          });

          // reduce default event handlers that may conflict on mobile devices
          map.off('click');
        } catch(e) { console.warn(e); }
      }

      var readyInterval = setInterval(function(){
        if(window.L && window.L.Control && window.L.Control.Geocoder) { clearInterval(readyInterval); init(); }
      }, 200);
    })();
  `;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <style>html,body,#map{height:100%;margin:0;padding:0}</style>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
      </head>
      <body>
        <div id="map"></div>
  <script>window.INITIAL_POS = ${initialPosJson}; window.ALLOWED_BBOX = ${allowedBboxJson};</script>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
        <script>
          ${injectedJS}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={{ height: 320 }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (!msg || !msg.type) return;
            
            // Handle location request
            if (msg.type === 'request_location') {
              if (onRequestLocation) {
                onRequestLocation();
              }
              return;
            }
            
            // forward select, confirm, and out-of-bounds (oob) messages
            if (msg.type === 'select' || msg.type === 'confirm' || msg.type === 'oob' || msg.type === 'position_update') {
              onSelect({ lat: msg.lat, lon: msg.lon, display_name: msg.display_name, address: msg.address, type: msg.type });
            }
          } catch { /* ignore */ }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' } });

export default AddressMapSearch;
