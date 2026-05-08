import type { Place, PlaceCategory } from "../types";

export const STORAGE_KEY = "tripyojana_map_data";
export const DATA_VERSION = "v3_user_data";

// Empty initial places - users will add their own places
export const INITIAL_PLACES: Place[] = [];

export const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  attraction: "#3b82f6",
  restaurant: "#ef4444",
  hotel: "#8b5cf6",
  activity: "#10b981",
};

export const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  attraction: "🏛️",
  restaurant: "🍽️",
  hotel: "🏨",
  activity: "🎯",
};

// Map configuration
export const MAP_DEFAULTS = {
  WORLD_CENTER: [20, 0] as [number, number],
  INDIA_CENTER: [22.5, 78.9] as [number, number],
  INDIA_BOUNDS: {
    minLat: 6,
    maxLat: 37,
    minLng: 68,
    maxLng: 97,
  },
  DEFAULT_ZOOM: 2,
  PLACES_ZOOM: 4,
  MAP_PADDING: [50, 50] as [number, number],
};
