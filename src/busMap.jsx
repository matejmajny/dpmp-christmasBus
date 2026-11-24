import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const busIcon = L.divIcon({
  className: "bus-marker",
  html: "🚌",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function BusMap({ lat, lon }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Create the map once
  useEffect(() => {
    const map = L.map(containerRef.current).setView([lat, lon], 14);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerRef.current = L.marker([lat, lon], { icon: busIcon }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Move the marker when new coordinates arrive
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current.setLatLng([lat, lon]);
    // Only re-centre if the bus left the visible area
    if (!map.getBounds().contains([lat, lon])) {
      map.panTo([lat, lon]);
    }
  }, [lat, lon]);

  return <div ref={containerRef} className="map" />;
}

export default BusMap;
