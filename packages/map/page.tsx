"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/packages/components/shared/Navbar";
import { TripFilter } from "@/packages/components/shared/TripFilter";
import { PlacesList, SelectedPlaceOverlay } from "./components";
import { useMapData } from "./hooks";
import { TRIP_PLACES } from "@/packages/constants/tripData";
import { DUMMY_TRIPS } from "@/packages/dashboard/constants";

// Dynamic import for map component (client-side only)
const MapComponent = dynamic(
  () => import("./components").then((mod) => ({ default: mod.MapComponent })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination");
  
  // Find trip ID from destination or default to first trip
  const defaultTripId = destination 
    ? DUMMY_TRIPS.find(t => destination.toLowerCase().includes(t.destination.toLowerCase()))?.id || "1"
    : "1";
  
  const [selectedTripId, setSelectedTripId] = useState(defaultTripId);
  
  const {
    places,
    selectedPlace,
    setSelectedPlace,
    removePlace,
  } = useMapData();

  // Get places for selected trip
  const tripPlaces = TRIP_PLACES[selectedTripId] || places;
  
  // Auto-select place when destination is provided
  useEffect(() => {
    if (destination && tripPlaces.length > 0) {
      const matchedPlace = tripPlaces.find(
        (p) => p.name.toLowerCase().includes(destination.toLowerCase()) ||
               p.address?.toLowerCase().includes(destination.toLowerCase())
      );
      if (matchedPlace) {
        setSelectedPlace(matchedPlace);
      }
    }
  }, [destination, tripPlaces, setSelectedPlace]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">
        {/* LEFT PANEL */}
        <div className="w-100 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
          {/* Trip Filter */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <TripFilter 
              selectedTripId={selectedTripId} 
              onTripChange={setSelectedTripId} 
              className="w-full"
            />
          </div>
          
          {/* Places List */}
          <div className="flex-1 overflow-hidden">
            <PlacesList
              places={tripPlaces}
              selectedPlace={selectedPlace}
              onSelectPlace={setSelectedPlace}
              onRemovePlace={removePlace}
            />
          </div>
        </div>

        {/* RIGHT MAP */}
        <div className="flex-1 relative">
          <MapComponent places={tripPlaces} focusPlace={destination} />

          {/* Selected Place Info Overlay */}
          {selectedPlace && (
            <SelectedPlaceOverlay
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
