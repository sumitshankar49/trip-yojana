"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/src/utils/leafletFix";
import type { Place, MapComponentProps } from "../types";
import { MAP_DEFAULTS } from "../constants";

const CATEGORY_THEME: Record<Place["category"], { color: string; emoji: string }> = {
  attraction: { color: "#2563EB", emoji: "📍" },
  restaurant: { color: "#EA580C", emoji: "🍽️" },
  hotel: { color: "#7C3AED", emoji: "🏨" },
  activity: { color: "#059669", emoji: "🎯" },
};

function haversineDistanceKm(start: [number, number], end: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latDelta = toRad(end[0] - start[0]);
  const lngDelta = toRad(end[1] - start[1]);
  const lat1 = toRad(start[0]);
  const lat2 = toRad(end[0]);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

const createNumberIcon = (number: number, category: Place["category"]) => {
  const theme = CATEGORY_THEME[category];

  return L.divIcon({
    html: `<div style="
      position:relative;
      width:34px;
      height:34px;
      display:flex;
      align-items:center;
      justify-content:center;
      ">
      <style>
        @keyframes markerPulse {
          0% { transform: scale(0.92); opacity: 0.75; }
          70% { transform: scale(1.08); opacity: 0.15; }
          100% { transform: scale(0.92); opacity: 0.75; }
        }
      </style>
      <div style="
        position:absolute;
        inset:0;
        border-radius:9999px;
        background:${theme.color};
        opacity:0.28;
        animation: markerPulse 1.8s ease-in-out infinite;
      "></div>
      <div style="
        position:relative;
        z-index:2;
        background:${theme.color};
        color:white;
        width:32px;
        height:32px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:13px;
        font-weight:700;
        border:2px solid white;
        box-shadow: 0 6px 12px rgba(0,0,0,0.28);
        gap:2px;
      "><span>${theme.emoji}</span><span>${number}</span></div>
    </div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

function FitBounds({ places, skipFit }: { places: Place[]; skipFit?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!places.length || !map || skipFit) return;

    const bounds = places.map((p) => [p.lat, p.lng] as [number, number]);
    map.flyToBounds(bounds, {
      padding: MAP_DEFAULTS.MAP_PADDING,
      duration: 0.9,
      easeLinearity: 0.35,
    });
  }, [places, map, skipFit]);

  return null;
}

function ZoomToPlace({ places, focusPlace }: { places: Place[]; focusPlace?: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focusPlace || !map || !places.length) return;

    const matchedPlace = places.find(
      (p) => p.name.toLowerCase().includes(focusPlace.toLowerCase()) ||
             p.address?.toLowerCase().includes(focusPlace.toLowerCase())
    );

    if (matchedPlace) {
      map.flyTo([matchedPlace.lat, matchedPlace.lng], 12, {
        duration: 1.5,
        easeLinearity: 0.5,
      });

      setTimeout(() => {
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

  const segmentDistances = places
    .reduce<{
      items: Array<{ fromPreviousKm: number; cumulativeKm: number }>;
      cumulativeKm: number;
    }>((acc, place, index) => {
      if (index === 0) {
        return {
          items: [...acc.items, { fromPreviousKm: 0, cumulativeKm: 0 }],
          cumulativeKm: 0,
        };
      }

      const previous = places[index - 1];
      const fromPreviousKm = haversineDistanceKm(
        [previous.lat, previous.lng],
        [place.lat, place.lng]
      );
      const nextCumulativeKm = acc.cumulativeKm + fromPreviousKm;

      return {
        items: [...acc.items, { fromPreviousKm, cumulativeKm: nextCumulativeKm }],
        cumulativeKm: nextCumulativeKm,
      };
    }, { items: [], cumulativeKm: 0 })
    .items;

  function segmentDistancesAt(index: number) {
    return segmentDistances[index] || { fromPreviousKm: 0, cumulativeKm: 0 };
  }

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
          icon={createNumberIcon(index + 1, place.category)}
          riseOnHover
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm">{place.name}</h3>
              <p className="text-xs text-gray-600">{place.description}</p>
              {place.time && <p className="text-xs text-gray-500 mt-1">{place.time}</p>}
              {place.address && <p className="text-xs text-gray-500 mt-1">{place.address}</p>}
              {index > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Distance from previous: {segmentDistancesAt(index).fromPreviousKm.toFixed(1)} km
                </p>
              )}
              {index > 0 && (
                <p className="text-xs text-gray-500">
                  Total route till here: {segmentDistancesAt(index).cumulativeKm.toFixed(1)} km
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapComponent;
