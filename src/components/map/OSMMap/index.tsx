import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import colors from '@colors';

function buildHtml(lat, lng, zoom) {
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e8eaed}.leaflet-control-attribution{font-size:8px}</style>
</head><body><div id="map"></div>
<script>
  function post(o){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  var map = L.map('map',{zoomControl:false}).setView([${lat},${lng}], ${zoom});
  L.tileLayer('${tileUrl}',{maxZoom:19,subdomains:'abcd',attribution:'© OpenStreetMap, © CARTO'}).addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var lineLayer = L.layerGroup().addTo(map);
  window.rnSetView=function(la,ln,z){ map.setView([la,ln], z||map.getZoom(), {animate:true}); };
  window.rnFitBounds=function(cs){ if(!cs||!cs.length) return; map.fitBounds(L.latLngBounds(cs.map(function(c){return [c.latitude,c.longitude];})),{padding:[60,60],maxZoom:16}); };
  window.rnSetMarkers=function(ms){ markerLayer.clearLayers(); (ms||[]).forEach(function(m){
    var icon; if(m.emoji){ icon=L.divIcon({className:'',iconSize:[38,38],iconAnchor:[19,19],html:'<div style="width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid rgba(0,0,0,.15);box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:20px">'+m.emoji+'</div>'}); }
    else { var color=m.type==='customer'?'#22C55E':(m.type==='rider'?'#FF6B35':'#0B0D12'); icon=L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:'<div style="width:18px;height:18px;border-radius:50%;background:'+color+';border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>'}); }
    L.marker([m.lat,m.lng],{icon:icon}).addTo(markerLayer);
  }); };
  window.rnSetPolyline=function(cs){ lineLayer.clearLayers(); if(cs&&cs.length>1){ L.polyline(cs.map(function(c){return [c.latitude,c.longitude];}),{color:'#FF6B35',weight:4,opacity:0.85}).addTo(lineLayer); } };
  post({type:'ready'});
</script></body></html>`;
}

const OSMMap = forwardRef(function OSMMap({ center, zoom = 14, markers = [], polyline = [], style }, ref) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);

  const inject = (js) => webRef.current && webRef.current.injectJavaScript(`${js}; true;`);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => inject(`window.rnSetView && window.rnSetView(${region.latitude}, ${region.longitude}, 15)`),
    fitToCoordinates: (coords) => inject(`window.rnFitBounds && window.rnFitBounds(${JSON.stringify(coords)})`),
  }));

  const html = useMemo(() => buildHtml(center.latitude, center.longitude, zoom), []);
  const markersJson = JSON.stringify(markers);
  const polyJson = JSON.stringify(polyline);

  useEffect(() => {
    if (ready) inject(`window.rnSetMarkers && window.rnSetMarkers(${markersJson})`);
  }, [markersJson, ready]);
  useEffect(() => {
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
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'ready') {
              setReady(true);
              inject(`window.rnSetMarkers(${markersJson}); window.rnSetPolyline(${polyJson})`);
            }
          } catch {
            // ignore
          }
        }}
      />
    </View>
  );
});

export default OSMMap;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface
  }
});
