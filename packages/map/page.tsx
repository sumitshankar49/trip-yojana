"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/packages/components/shared/Navbar";
import { TripFilter, type TripOption } from "@/packages/components/shared/TripFilter";
import { PlacesList, SelectedPlaceOverlay, AddPlaceForm } from "./components";
import type { Place, MapComponentProps } from "./types";
import { toast } from "sonner";

type ApiTrip = {
  _id: string;
  title: string;
  source?: string;
  destination: string;
  places?: string[];
};

type DbPlace = {
  id: string;
  name: string;
  description?: string | null;
  lat: number;
  lng: number;
  category: string;
  address?: string | null;
  time?: string | null;
};

// Dynamic import for map component (client-side only)
const MapComponent = dynamic<MapComponentProps>(
  () => import("./components/MapComponent").then(mod => ({ default: mod.MapComponent })),
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
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

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
          destination: trip.source || trip.title,
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

  // Load places when selected trip changes
  useEffect(() => {
    if (!selectedTripId) {
      setPlaces([]);
      return;
    }

    let isMounted = true;

    const loadPlaces = async () => {
      setIsPlacesLoading(true);
      try {
        const response = await fetch(`/api/places?tripId=${selectedTripId}`);
        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to load places:", data.error);
          if (isMounted) {
            setPlaces([]);
          }
          return;
        }

        if (isMounted) {
          const dbPlaces = data.places || [];
          // Convert database format to Place format
          const convertedPlaces: Place[] = dbPlaces.map((p: DbPlace) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            lat: p.lat,
            lng: p.lng,
            category: p.category as Place["category"],
            address: p.address || undefined,
            time: p.time || undefined,
          }));
          setPlaces(convertedPlaces);
        }
      } catch (error) {
        console.error("Places load error:", error);
        if (isMounted) {
          setPlaces([]);
        }
      } finally {
        if (isMounted) {
          setIsPlacesLoading(false);
        }
      }
    };

    loadPlaces();

    return () => {
      isMounted = false;
    };
  }, [selectedTripId]);

  // Remove place handler
  const removePlace = async (placeId: string) => {
    try {
      const response = await fetch(`/api/places/${placeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to delete place");
        return;
      }

      // Remove from local state
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
      if (selectedPlace?.id === placeId) {
        setSelectedPlace(null);
      }
      toast.success("Place removed");
    } catch (error) {
      console.error("Remove place error:", error);
      toast.error("Failed to remove place");
    }
  };

  // Add place handler
  const handlePlaceAdded = (newPlace: Place) => {
    setPlaces((prev) => [...prev, newPlace]);
  };

  // Auto-select place when destination is provided
  useEffect(() => {
    if (destination && places.length > 0) {
      const matchedPlace = places.find(
        (p) => p.name.toLowerCase().includes(destination.toLowerCase()) ||
               p.address?.toLowerCase().includes(destination.toLowerCase())
      );
      if (matchedPlace) {
        setSelectedPlace(matchedPlace);
      }
    }
  }, [destination, places]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {isTripsLoading ? (
        // Loading State
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading your trips...</p>
          </div>
        </div>
      ) : trips.length === 0 ? (
        // Empty State - No Trips
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-24 h-24 mx-auto text-zinc-300 dark:text-zinc-700"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              No Trips Yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Create your first trip to start exploring destinations on the map. Plan your journey, add places, and visualize your adventure!
            </p>
            <a
              href="/create-trip"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Your First Trip
            </a>
          </div>
        </div>
      ) : (
        // Map View with Trips
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

            {/* Trip Selected Status */}
            {selectedTripId && (
              <div className="px-4 pt-2 pb-3 bg-cyan-50 dark:bg-cyan-950/30 border-b border-cyan-200 dark:border-cyan-900">
                <p className="text-xs text-cyan-700 dark:text-cyan-300">
                  <span className="font-medium">Selected: </span>
                  {trips.find(t => t.id === selectedTripId)?.destination || 'Trip'}
                </p>
              </div>
            )}

            {/* Add Place Form */}
            {selectedTripId && (
              <AddPlaceForm 
                tripId={selectedTripId} 
                onPlaceAdded={handlePlaceAdded} 
              />
            )}
            
            {/* Places List */}
            <div className="flex-1 overflow-hidden">
              {isPlacesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Loading places...</p>
                  </div>
                </div>
              ) : (
                <PlacesList
                  places={places}
                  selectedPlace={selectedPlace}
                  onSelectPlace={setSelectedPlace}
                  onRemovePlace={removePlace}
                />
              )}
            </div>
          </div>

          {/* RIGHT MAP */}
          <div className="flex-1 relative">
            <MapComponent 
              places={places} 
              focusPlace={destination}
            />

            {/* Selected Place Info Overlay */}
            {selectedPlace && (
              <SelectedPlaceOverlay
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
