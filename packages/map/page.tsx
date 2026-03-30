"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/packages/components/shared/Navbar";
import { TripFilter, type TripOption } from "@/packages/components/shared/TripFilter";
import { PlacesList, SelectedPlaceOverlay } from "./components";
import { useMapData } from "./hooks";
import { TRIP_PLACES } from "@/packages/constants/tripData";
import type { Place } from "./types";
import { toast } from "sonner";

type ApiTrip = {
  _id: string;
  title: string;
  places?: string[];
};

// Dynamic import for map component (client-side only)
const MapComponent = dynamic(
  () => import("./components/MapComponent"),
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

  const [trips, setTrips] = useState<TripOption[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState("");
  
  const {
    places,
    selectedPlace,
    setSelectedPlace,
    removePlace,
  } = useMapData();

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || "Failed to load trips for map");
          if (isMounted) {
            setTrips([]);
          }
          return;
        }

        const apiTrips = Array.isArray(data?.trips) ? (data.trips as ApiTrip[]) : [];
        const mappedTrips: TripOption[] = apiTrips.map((trip) => ({
          id: String(trip._id),
          destination: trip.places?.[0] || trip.title,
        }));

        if (!isMounted) {
          return;
        }

        setTrips(mappedTrips);

        if (mappedTrips.length === 0) {
          setSelectedTripId("");
          return;
        }

        if (destination) {
          const destinationLower = destination.toLowerCase();
          const matchedTrip = mappedTrips.find((trip) =>
            destinationLower.includes(trip.destination.toLowerCase())
          );
          setSelectedTripId(matchedTrip?.id || mappedTrips[0].id);
        } else {
          setSelectedTripId(mappedTrips[0].id);
        }
      } catch (error) {
        console.error("Map trips load error:", error);
        toast.error("Could not load trips");
        if (isMounted) {
          setTrips([]);
          setSelectedTripId("");
        }
      } finally {
        if (isMounted) {
          setIsTripsLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, [destination]);

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  const fallbackTripPlaces: Place[] = selectedTrip
    ? [
        {
          id: selectedTrip.id,
          name: selectedTrip.destination,
          description: "Newly created trip destination",
          lat: 20.5937,
          lng: 78.9629,
          category: "attraction",
          time: "Anytime",
          address: selectedTrip.destination,
        },
      ]
    : places;

  // Get places for selected trip
  const tripPlaces = TRIP_PLACES[selectedTripId] || fallbackTripPlaces;
  
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
              trips={trips}
              isLoading={isTripsLoading}
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
