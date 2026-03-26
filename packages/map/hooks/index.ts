'use client'
import { useState, useEffect } from "react";
import type { Place } from "../types";
import { STORAGE_KEY, INITIAL_PLACES, DATA_VERSION } from "../constants";

interface OldPlace {
  coordinates?: [number, number];
  lat?: number;
  lng?: number;
  id: string;
  name: string;
  description: string;
  category: Place["category"];
  time?: string;
  address?: string;
}

export function useMapData() {
  const [places, setPlaces] = useState<Place[]>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Check version - if old version, clear and use new data
          if (data.version !== DATA_VERSION) {
            localStorage.removeItem(STORAGE_KEY);
            return INITIAL_PLACES;
          }
          const loadedPlaces = data.places || INITIAL_PLACES;
          // Convert old format if needed
          return loadedPlaces.map((p: OldPlace) => {
            if (p.coordinates) {
              const [lng, lat] = p.coordinates;
              return {
                id: p.id,
                name: p.name,
                description: p.description,
                lat,
                lng,
                category: p.category,
                time: p.time,
                address: p.address,
              };
            }
            return p;
          });
        } catch {
          return INITIAL_PLACES;
        }
      }
    }
    return INITIAL_PLACES;
  });

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && places.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DATA_VERSION, places }));
    }
  }, [places]);

  const removePlace = (placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    if (selectedPlace?.id === placeId) {
      setSelectedPlace(null);
    }
  };

  const addPlace = (place: Place) => {
    setPlaces((prev) => [...prev, place]);
    setSelectedPlace(place);
  };

  const updatePlace = (placeId: string, updates: Partial<Place>) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, ...updates } : p))
    );
  };

  return {
    places,
    selectedPlace,
    setSelectedPlace,
    removePlace,
    addPlace,
    updatePlace,
  };
}
