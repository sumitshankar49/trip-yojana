"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/src/utils/leafletFix";

interface Place {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: "attraction" | "restaurant" | "hotel" | "activity";
  time?: string;
  address?: string;
}

interface MapComponentProps {
  places: Place[];
}

// Helper to create numbered markers
const createNumberIcon = (number: number) => {
  return L.divIcon({
    html: `<div style="
      background:#2563EB;
      color:white;
      width:28px;
      height:28px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:12px;
      font-weight:bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Component to fit bounds
function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();

  useEffect(() => {
    if (!places.length || !map) return;

    const bounds = places.map((p) => [p.lat, p.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [places, map]);

  return null;
}

// Helper to get center
const getCenter = (places: Place[]): [number, number] => {
  if (!places.length) return [20, 0];

  const isIndia = places.every(
    (p) => p.lat >= 6 && p.lat <= 37 && p.lng >= 68 && p.lng <= 97
  );

  return isIndia ? [22.5, 78.9] : [20, 0];
};

export function MapComponent({ places }: MapComponentProps) {
  const positions = places.map((p) => [p.lat, p.lng] as [number, number]);
  const center = getCenter(places);
  const zoom = places.length ? 4 : 2;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <FitBounds places={places} />

      {/* Polyline connecting places */}
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "#2563EB", weight: 3, opacity: 0.7 }}
        />
      )}

      {/* Markers */}
      {places.map((place, index) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={createNumberIcon(index + 1)}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm">{place.name}</h3>
              <p className="text-xs text-gray-600">{place.description}</p>
              {place.time && <p className="text-xs text-gray-500 mt-1">{place.time}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
