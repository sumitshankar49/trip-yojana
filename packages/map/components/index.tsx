"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/src/utils/leafletFix";
import type { Place, MapComponentProps } from "../types";
import { MAP_DEFAULTS } from "../constants";

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
function FitBounds({ places, skipFit }: { places: Place[]; skipFit?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!places.length || !map || skipFit) return;

    const bounds = places.map((p) => [p.lat, p.lng] as [number, number]);
    map.fitBounds(bounds, { padding: MAP_DEFAULTS.MAP_PADDING });
  }, [places, map, skipFit]);

  return null;
}

// Component to zoom to a specific place
function ZoomToPlace({ places, focusPlace }: { places: Place[]; focusPlace?: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focusPlace || !map || !places.length) return;

    // Find matching place
    const matchedPlace = places.find(
      (p) => p.name.toLowerCase().includes(focusPlace.toLowerCase()) ||
             p.address?.toLowerCase().includes(focusPlace.toLowerCase())
    );

    if (matchedPlace) {
      // Zoom to the specific place with animation
      map.flyTo([matchedPlace.lat, matchedPlace.lng], 12, {
        duration: 1.5,
        easeLinearity: 0.5,
      });
      
      // Open popup for the place
      setTimeout(() => {
        const index = places.findIndex((p) => p.id === matchedPlace.id);
        // Find and open the marker's popup (this is a simple approach)
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            const markerLatLng = layer.getLatLng();
            if (markerLatLng.lat === matchedPlace.lat && markerLatLng.lng === matchedPlace.lng) {
              layer.openPopup();
            }
          }
        });
      }, 1600);
    }
  }, [focusPlace, places, map]);

  return null;
}

// Helper to get center
const getCenter = (places: Place[]): [number, number] => {
  if (!places.length) return MAP_DEFAULTS.WORLD_CENTER;

  const { minLat, maxLat, minLng, maxLng } = MAP_DEFAULTS.INDIA_BOUNDS;
  const isIndia = places.every(
    (p) => p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng
  );

  return isIndia ? MAP_DEFAULTS.INDIA_CENTER : MAP_DEFAULTS.WORLD_CENTER;
};

export function MapComponent({ places, focusPlace }: MapComponentProps) {
  const positions = places.map((p) => [p.lat, p.lng] as [number, number]);
  const center = getCenter(places);
  const zoom = places.length ? MAP_DEFAULTS.PLACES_ZOOM : MAP_DEFAULTS.DEFAULT_ZOOM;

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

      <FitBounds places={places} skipFit={!!focusPlace} />
      <ZoomToPlace places={places} focusPlace={focusPlace} />

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

// Export all components
export { PlaceCard } from "./PlaceCard";
export { PlacesList } from "./PlacesList";
export { SelectedPlaceOverlay } from "./SelectedPlaceOverlay";

