import type { Place } from "../types";
import { MAP_DEFAULTS } from "../constants";

/**
 * Determines the optimal map center based on place locations
 * Returns India center if all places are in India, otherwise world center
 */
export function getMapCenter(places: Place[]): [number, number] {
  if (!places.length) return MAP_DEFAULTS.WORLD_CENTER;

  const { minLat, maxLat, minLng, maxLng } = MAP_DEFAULTS.INDIA_BOUNDS;
  const isIndia = places.every(
    (p) => p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng
  );

  return isIndia ? MAP_DEFAULTS.INDIA_CENTER : MAP_DEFAULTS.WORLD_CENTER;
}

/**
 * Calculates bounds from an array of places
 */
export function calculateBounds(places: Place[]): [[number, number], [number, number]] | null {
  if (places.length === 0) return null;

  const lats = places.map((p) => p.lat);
  const lngs = places.map((p) => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/**
 * Calculates the distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the total distance of a route through all places
 */
export function calculateTotalDistance(places: Place[]): number {
  if (places.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < places.length - 1; i++) {
    const current = places[i];
    const next = places[i + 1];
    total += calculateDistance(current.lat, current.lng, next.lat, next.lng);
  }

  return total;
}

/**
 * Formats distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
