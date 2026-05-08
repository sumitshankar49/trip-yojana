import type { Place } from "@/packages/map/types";

// Trip-specific place data - DEPRECATED
// This static data has been removed. Places are now stored per-trip in the database.
// Use the Trip.places field from the database instead.
export const TRIP_PLACES: Record<string, Place[]> = {};
