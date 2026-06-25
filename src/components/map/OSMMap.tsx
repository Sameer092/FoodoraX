import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Coordinates } from '@types/index';

export interface MapMarker {
  lat: number;
  lng: number;
  type: 'restaurant' | 'customer' | 'rider';
  emoji?: string;
}

export interface OSMMapHandle {
  animateToRegion: (region: Coordinates & { latitudeDelta?: number; longitudeDelta?: number }) => void;
  fitToCoordinates: (coords: Coordinates[]) => void;
}

interface OSMMapProps {
  center: Coordinates;
  zoom?: number;
  markers?: MapMarker[];
  polyline?: Coordinates[];
  dark?: boolean;
  interactive?: boolean;
  onRegionChange?: (c: Coordinates) => void;
  style?: any;
}

const PRIMARY = '#FF6B35';

/**
 * Free, key-less map: a WebView running Leaflet.js with OpenStreetMap/CartoDB
 * tiles. No Google Maps API key needed and it works in Expo Go.
 * Exposes a react-native-maps-compatible imperative API (animateToRegion / fitToCoordinates).
 */
export const OSMMap = forwardRef<OSMMapHandle, OSMMapProps>(function OSMMap(
  { center, zoom = 14, markers = [], polyline = [], dark = false, interactive = true, onRegionChange, style },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const inject = (js: string) => webRef.current?.injectJavaScript(`${js}; true;`);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) =>
      inject(`window.rnSetView && window.rnSetView(${region.latitude}, ${region.longitude}, ${deltaToZoom(region.latitudeDelta)})`),
    fitToCoordinates: (coords) =>
      inject(`window.rnFitBounds && window.rnFitBounds(${JSON.stringify(coords)})`),
  }));

  const html = useMemo(
    () => buildHtml(center.latitude, center.longitude, zoom, dark, interactive),
    // build once; updates go through injectJavaScript
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Push marker/polyline updates whenever they change (after map is ready)
  const markersJson = JSON.stringify(markers);
  const polyJson = JSON.stringify(polyline);
  React.useEffect(() => {
    if (ready) inject(`window.rnSetMarkers && window.rnSetMarkers(${markersJson})`);
  }, [markersJson, ready]);
  React.useEffect(() => {
    if (ready) inject(`window.rnSetPolyline && window.rnSetPolyline(${polyJson})`);
  }, [polyJson, ready]);

  return (
    <View style={[styles.fill, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.fill}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'ready') {
              setReady(true);
              inject(`window.rnSetMarkers(${markersJson}); window.rnSetPolyline(${polyJson})`);
            } else if (msg.type === 'region' && onRegionChange) {
              onRegionChange({ latitude: msg.lat, longitude: msg.lng });
            }
          } catch {
            // ignore
          }
        }}
      />
    </View>
  );
});

function deltaToZoom(delta?: number): number {
  if (!delta) return 15;
  return Math.round(Math.log2(360 / delta));
}

function buildHtml(lat: number, lng: number, zoom: number, dark: boolean, interactive: boolean): string {
  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:${dark ? '#0f172a' : '#e8eaed'}}
  .leaflet-control-attribution{font-size:8px;background:rgba(255,255,255,.6)}
</style>
</head><body><div id="map"></div>
<script>
  function post(o){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  var map = L.map('map', { zoomControl:false, attributionControl:true, dragging:${interactive}, tap:${interactive} })
    .setView([${lat},${lng}], ${zoom});
  L.tileLayer('${tileUrl}', { maxZoom:19, subdomains:'abcd', attribution:'© OpenStreetMap, © CARTO' }).addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var lineLayer = L.layerGroup().addTo(map);

  window.rnSetView = function(la,ln,z){ map.setView([la,ln], z || map.getZoom(), { animate:true }); };

  window.rnFitBounds = function(cs){
    if(!cs || cs.length===0) return;
    var b = L.latLngBounds(cs.map(function(c){ return [c.latitude, c.longitude]; }));
    map.fitBounds(b, { padding:[60,60], maxZoom:16 });
  };

  window.rnSetMarkers = function(ms){
    markerLayer.clearLayers();
    (ms||[]).forEach(function(m){
      var icon;
      if (m.emoji) {
        icon = L.divIcon({ className:'', iconSize:[38,38], iconAnchor:[19,19],
          html:'<div style="width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid rgba(0,0,0,.15);box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:20px">'+m.emoji+'</div>' });
      } else {
        var color = m.type==='customer' ? '#22C55E' : (m.type==='rider' ? '${PRIMARY}' : '#0B0D12');
        icon = L.divIcon({ className:'', iconSize:[20,20], iconAnchor:[10,10],
          html:'<div style="width:18px;height:18px;border-radius:50%;background:'+color+';border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>' });
      }
      L.marker([m.lat,m.lng], {icon:icon}).addTo(markerLayer);
    });
  };

  window.rnSetPolyline = function(cs){
    lineLayer.clearLayers();
    if(cs && cs.length>1){
      L.polyline(cs.map(function(c){return [c.latitude,c.longitude];}), { color:'${PRIMARY}', weight:4, opacity:0.85 }).addTo(lineLayer);
    }
  };

  map.on('moveend', function(){ var c=map.getCenter(); post({type:'region', lat:c.lat, lng:c.lng}); });
  post({type:'ready'});
</script>
</body></html>`;
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: '100%', height: '100%' },
});
