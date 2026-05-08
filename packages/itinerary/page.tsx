"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/packages/components/shared/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Button } from "@/packages/components/ui/button";
import { Input } from "@/packages/components/ui/input";
import { Label } from "@/packages/components/ui/label";
import { Checkbox } from "@/packages/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/packages/components/ui/select";
import { Badge } from "@/packages/components/ui/badge";
import { cn } from "@/packages/lib/utils";
import { toast } from "@/packages/lib/toast";
import type { Place } from "@/packages/map/types";
import { ITINERARY_LABELS, ITINERARY_MESSAGES } from "./constants";

type ItineraryMapProps = {
  places: Place[];
  focusPlace?: string | null;
};

type Interest = "temple" | "nature" | "food";
type SlotName = "morning" | "afternoon" | "evening";

type ApiTrip = {
  _id: string;
  title: string;
  source?: string;
  startDate: string;
  endDate: string;
  places?: string[];
};

type TripOption = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
};

type TripPlace = {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  category: string;
  address?: string;
  time?: string;
};

type SlotPlan = {
  id: string;
  slot: SlotName;
  time: string;
  name: string;
  location: string;
  notes: string;
  area: string;
  durationMin: number;
  lat: number;
  lng: number;
  distanceFromPreviousKm: number;
  travelTimeMinFromPrevious: number;
};

type DayPlan = {
  dayNumber: number;
  slots: SlotPlan[];
  estimatedTravelMin: number;
  estimatedDistanceKm: number;
  totalPlannedMin: number;
  warnings: string[];
};

const SLOT_ORDER: SlotName[] = ["morning", "afternoon", "evening"];

const ItineraryMap = dynamic<ItineraryMapProps>(
  () =>
    (import("../map/components/MapComponent") as Promise<Record<string, unknown>>).then(
      (mod) =>
        ((mod.default || mod.MapComponent) as ComponentType<ItineraryMapProps>)
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-130 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {ITINERARY_LABELS.MAP_LOADING}
      </div>
    ),
  }
);

const SLOT_TIMES: Record<SlotName, string> = {
  morning: "09:00 AM",
  afternoon: "02:00 PM",
  evening: "06:30 PM",
};

function dayDiffInclusive(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

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

function estimateTravelTimeMin(distanceKm: number) {
  const avgCitySpeedKmh = 24;
  const bufferMin = 8;
  return Math.max(0, Math.round((distanceKm / avgCitySpeedKmh) * 60 + bufferMin));
}

function generateItineraryFromPlaces(tripPlaces: TripPlace[], days: number): DayPlan[] {
  const SLOT_ORDER: SlotName[] = ["morning", "afternoon", "evening"];
  const totalSlots = days * SLOT_ORDER.length;
  const output: DayPlan[] = [];

  // Distribute places across days
  let placeIndex = 0;
  
  for (let day = 1; day <= days; day += 1) {
    const slots: SlotPlan[] = [];
    let previousCoords: [number, number] | null = null;
    let totalDistanceKm = 0;
    let totalTravelMin = 0;

    SLOT_ORDER.forEach((slotName) => {
      const place = tripPlaces[placeIndex];
      
      if (place) {
        const currentCoords: [number, number] = [place.lat, place.lng];
        const distanceFromPreviousKm = previousCoords
          ? haversineDistanceKm(previousCoords, currentCoords)
          : 0;
        const travelTimeMinFromPrevious = previousCoords ? estimateTravelTimeMin(distanceFromPreviousKm) : 0;

        totalDistanceKm += distanceFromPreviousKm;
        totalTravelMin += travelTimeMinFromPrevious;
        previousCoords = currentCoords;

        slots.push({
          id: `${day}-${slotName}-${place.id}`,
          slot: slotName,
          time: place.time || SLOT_TIMES[slotName],
          name: place.name,
          location: place.address || "Location",
          notes: place.description || "",
          area: "custom",
          durationMin: 90,
          lat: place.lat,
          lng: place.lng,
          distanceFromPreviousKm,
          travelTimeMinFromPrevious,
        });
        
        placeIndex++;
      } else {
        // Free slot if no more places
        slots.push({
          id: `${day}-${slotName}-free`,
          slot: slotName,
          time: SLOT_TIMES[slotName],
          name: "Free Time",
          location: "Flexible",
          notes: "Keep this slot open for rest or spontaneous plans.",
          area: "custom",
          durationMin: 90,
          lat: 0,
          lng: 0,
          distanceFromPreviousKm: 0,
          travelTimeMinFromPrevious: 0,
        });
      }
    });

    const totalActivityMin = slots.reduce((sum, slot) => sum + slot.durationMin, 0);
    const totalPlannedMin = totalActivityMin + totalTravelMin;
    const warnings: string[] = [];

    if (totalPlannedMin > 8 * 60) {
      warnings.push("Overloaded day: consider moving one place to another day");
    }

    output.push({
      dayNumber: day,
      slots,
      estimatedTravelMin: totalTravelMin,
      estimatedDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalPlannedMin,
      warnings,
    });
  }

  return output;
}

type ItineraryOutput = {
  dayNumber: number;
  estimatedTravelMin: number;
  estimatedDistanceKm: number;
  totalPlannedMin: number;
  warnings: string[];
  places: Array<{
    name: string;
    location: string;
    time: string;
    notes: string;
    slot: SlotName;
    travelTimeMinFromPrevious: number;
    distanceFromPreviousKm: number;
  }>;
};

function toDayWiseOutput(dayPlans: DayPlan[]): ItineraryOutput[] {
  return dayPlans.map((day) => ({
    dayNumber: day.dayNumber,
    estimatedTravelMin: day.estimatedTravelMin,
    estimatedDistanceKm: day.estimatedDistanceKm,
    totalPlannedMin: day.totalPlannedMin,
    warnings: day.warnings,
    places: day.slots.map((slot) => ({
      name: slot.name,
      location: slot.location,
      time: slot.time,
      notes: slot.notes,
      slot: slot.slot,
      travelTimeMinFromPrevious: slot.travelTimeMinFromPrevious,
      distanceFromPreviousKm: Number(slot.distanceFromPreviousKm.toFixed(1)),
    })),
  }));
}

function travelBalanceLabel(day: DayPlan) {
  let transitions = 0;
  for (let i = 1; i < day.slots.length; i += 1) {
    if (day.slots[i].area !== day.slots[i - 1].area) {
      transitions += 1;
    }
  }
  if (transitions <= 1) {
    return "Low travel time";
  }
  if (transitions === 2) {
    return "Balanced travel";
  }
  return "High travel";
}

function mapApiDaysToPlans(days: Array<{ dayNumber: number; places: Array<{ name: string; time: string; location: string; notes?: string }> }>): DayPlan[] {
  return [...days]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day) => {
      let previousCoords: [number, number] | null = null;
      const slots = SLOT_ORDER.map((slotName, index) => {
        const place = day.places[index] || {
          name: "Free Exploration",
          time: SLOT_TIMES[slotName],
          location: "Flexible",
          notes: "Keep this slot open for rest or spontaneous plans.",
        };
        // Use placeholder coordinates based on day and slot index
        const coords = {
          lat: 20.5937 + (day.dayNumber * 0.01) + (index * 0.005),
          lng: 78.9629 + (day.dayNumber * 0.01) + (index * 0.005),
        };
        const currentCoords: [number, number] = [coords.lat, coords.lng];
        const distanceFromPreviousKm = previousCoords
          ? haversineDistanceKm(previousCoords, currentCoords)
          : 0;
        const travelTimeMinFromPrevious = index === 0 ? 0 : estimateTravelTimeMin(distanceFromPreviousKm);
        previousCoords = currentCoords;

        return {
          id: `${day.dayNumber}-${slotName}-${index}`,
          slot: slotName,
          time: place.time || SLOT_TIMES[slotName],
          name: place.name,
          location: place.location,
          notes: place.notes || "",
          area: "custom",
          durationMin: 90,
          lat: coords.lat,
          lng: coords.lng,
          distanceFromPreviousKm,
          travelTimeMinFromPrevious,
        } as SlotPlan;
      });

      const estimatedTravelMin = slots.reduce((sum, slot) => sum + slot.travelTimeMinFromPrevious, 0);
      const estimatedDistanceKm = Number(slots.reduce((sum, slot) => sum + slot.distanceFromPreviousKm, 0).toFixed(1));
      const totalActivityMin = slots.reduce((sum, slot) => sum + slot.durationMin, 0);
      const totalPlannedMin = totalActivityMin + estimatedTravelMin;
      const warnings = totalPlannedMin > 8 * 60 ? ["Overloaded day: consider moving one place to another day"] : [];

      return {
        dayNumber: day.dayNumber,
        slots,
        estimatedTravelMin,
        estimatedDistanceKm,
        totalPlannedMin,
        warnings,
      };
    });
}

function buildItineraryPayload(dayPlans: DayPlan[]) {
  return {
    days: dayPlans.map((day) => ({
      dayNumber: day.dayNumber,
      places: day.slots.map((slot) => ({
        name: slot.name,
        time: slot.time,
        location: slot.location,
        notes: slot.notes,
      })),
    })),
  };
}

export default function ItineraryPage() {
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [tripPlaces, setTripPlaces] = useState<TripPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);

  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [draggingSlot, setDraggingSlot] = useState<{ dayIndex: number; slotIndex: number } | null>(null);
  const skipNextAutoSaveRef = useRef(true);
  const lastSavedSignatureRef = useRef("");

  const optimizedItinerary = useMemo(() => toDayWiseOutput(dayPlans), [dayPlans]);

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || ITINERARY_MESSAGES.LOAD_TRIPS_FAILED);
          if (isMounted) {
            setTrips([]);
          }
          return;
        }

        const apiTrips = Array.isArray(data?.trips) ? (data.trips as ApiTrip[]) : [];
        const mapped: TripOption[] = apiTrips.map((trip) => ({
          id: String(trip._id),
          title: trip.title,
          destination: trip.places?.[0] || trip.title,
          startDate: trip.startDate,
          endDate: trip.endDate,
        }));

        if (!isMounted) {
          return;
        }

        setTrips(mapped);
        const firstTrip = mapped[0];
        if (firstTrip) {
          setSelectedTripId(firstTrip.id);
          setDestination(firstTrip.destination);
          setDays(dayDiffInclusive(firstTrip.startDate, firstTrip.endDate));
        }
      } catch (error) {
        console.error("Load trips error:", error);
        toast.error(ITINERARY_MESSAGES.LOAD_TRIPS_ERROR);
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
  }, []);

  useEffect(() => {
    if (!selectedTripId) {
      return;
    }

    const selected = trips.find((trip) => trip.id === selectedTripId);
    if (!selected) {
      return;
    }

    setDestination(selected.destination);
    setDays(dayDiffInclusive(selected.startDate, selected.endDate));

    let isMounted = true;

    const loadPlaces = async () => {
      setIsLoadingPlaces(true);
      try {
        const response = await fetch(`/api/places?tripId=${selectedTripId}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.error || "Failed to load places");
          if (isMounted) {
            setTripPlaces([]);
          }
          return;
        }

        const places = Array.isArray(data) ? data : [];
        if (isMounted) {
          setTripPlaces(places);
        }
      } catch (error) {
        console.error("Load places error:", error);
        toast.error("Error loading trip places");
        if (isMounted) {
          setTripPlaces([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlaces(false);
        }
      }
    };

    const loadItinerary = async () => {
      setIsLoadingItinerary(true);
      try {
        const response = await fetch(`/api/trips/${selectedTripId}/itinerary`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || ITINERARY_MESSAGES.LOAD_ITINERARY_FAILED);
          return;
        }

        const apiDays = Array.isArray(data?.itinerary?.days) ? data.itinerary.days : [];
        
        // If there's old itinerary data but no places, it's stale data - ignore it
        if (isMounted && apiDays.length > 0 && tripPlaces.length > 0) {
          const mappedPlans = mapApiDaysToPlans(apiDays);
          skipNextAutoSaveRef.current = true;
          lastSavedSignatureRef.current = JSON.stringify(buildItineraryPayload(mappedPlans));
          setDayPlans(mappedPlans);
        } else if (isMounted) {
          // No itinerary or stale itinerary with 0 places
          skipNextAutoSaveRef.current = true;
          lastSavedSignatureRef.current = "";
          setDayPlans([]);
        }
      } catch (error) {
        console.error("Load itinerary error:", error);
        toast.error(ITINERARY_MESSAGES.LOAD_ITINERARY_ERROR);
      } finally {
        if (isMounted) {
          setIsLoadingItinerary(false);
        }
      }
    };

    loadPlaces();
    loadItinerary();

    return () => {
      isMounted = false;
    };
  }, [selectedTripId, trips]);

  const totalActivities = useMemo(() => dayPlans.reduce((sum, day) => sum + day.slots.length, 0), [dayPlans]);

  useEffect(() => {
    if (dayPlans.length === 0) {
      setSelectedDayNumber(1);
      return;
    }

    const hasSelectedDay = dayPlans.some((day) => day.dayNumber === selectedDayNumber);
    if (!hasSelectedDay) {
      setSelectedDayNumber(dayPlans[0].dayNumber);
    }
  }, [dayPlans, selectedDayNumber]);

  const selectedDayPlan = useMemo(
    () => dayPlans.find((day) => day.dayNumber === selectedDayNumber) || dayPlans[0],
    [dayPlans, selectedDayNumber]
  );

  const selectedDayMapPlaces = useMemo<Place[]>(() => {
    if (!selectedDayPlan) {
      return [];
    }

    return selectedDayPlan.slots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      description: slot.notes || `${slot.slot} activity`,
      lat: slot.lat,
      lng: slot.lng,
      category: "attraction",
      time: slot.time,
      address: slot.location,
    }));
  }, [selectedDayPlan]);

  const handleGenerate = () => {
    if (!selectedTripId) {
      toast.error("Please select a trip first");
      return;
    }

    if (tripPlaces.length === 0) {
      toast.error("No places added to this trip. Please add places in the Map section first.");
      return;
    }

    if (days < 1 || days > 14) {
      toast.error(ITINERARY_MESSAGES.DAYS_OUT_OF_RANGE);
      return;
    }

    const generated = generateItineraryFromPlaces(tripPlaces, days);
    setDayPlans(generated);
    toast.success(`Itinerary generated with ${tripPlaces.length} places across ${days} days. Click Save to store it.`);
  };

  const saveItinerary = useCallback(async (source: "manual" | "auto") => {
    if (!selectedTripId) {
      toast.error(ITINERARY_MESSAGES.SELECT_TRIP_FIRST);
      return false;
    }

    if (dayPlans.length === 0) {
      toast.error(ITINERARY_MESSAGES.GENERATE_BEFORE_SAVE);
      return false;
    }

    if (source === "manual") {
      setIsSaving(true);
    } else {
      setIsAutoSaving(true);
    }

    const payload = buildItineraryPayload(dayPlans);
    const payloadSignature = JSON.stringify(payload);

    try {
      const response = await fetch(`/api/trips/${selectedTripId}/itinerary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.message || ITINERARY_MESSAGES.SAVE_FAILED);
        return false;
      }

      lastSavedSignatureRef.current = payloadSignature;
      toast.success(source === "auto" ? ITINERARY_MESSAGES.AUTO_SAVED : ITINERARY_MESSAGES.SAVED_TO_DB);
      return true;
    } catch (error) {
      console.error("Save itinerary error:", error);
      toast.error("Could not save itinerary");
      return false;
    } finally {
      if (source === "manual") {
        setIsSaving(false);
      } else {
        setIsAutoSaving(false);
      }
    }
  }, [dayPlans, selectedTripId]);

  const handleSave = async () => {
    await saveItinerary("manual");
  };

  const handleClear = async () => {
    if (!selectedTripId) {
      toast.error("No trip selected");
      return;
    }

    if (!window.confirm("Are you sure you want to clear the current itinerary? This will delete all saved data.")) {
      return;
    }

    try {
      const response = await fetch(`/api/trips/${selectedTripId}/itinerary`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data?.message || "Failed to clear itinerary");
        return;
      }

      setDayPlans([]);
      lastSavedSignatureRef.current = "";
      toast.success("Itinerary cleared successfully");
    } catch (error) {
      console.error("Clear itinerary error:", error);
      toast.error("Failed to clear itinerary");
    }
  };

  useEffect(() => {
    if (!selectedTripId || dayPlans.length === 0 || isLoadingItinerary) {
      return;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    const payloadSignature = JSON.stringify(buildItineraryPayload(dayPlans));
    if (payloadSignature === lastSavedSignatureRef.current) {
      return;
    }

    const timerId = setTimeout(() => {
      void saveItinerary("auto");
    }, 1200);

    return () => {
      clearTimeout(timerId);
    };
  }, [dayPlans, isLoadingItinerary, saveItinerary, selectedTripId]);

  const handleDragStart = (dayIndex: number, slotIndex: number) => {
    setDraggingSlot({ dayIndex, slotIndex });
  };

  const handleDrop = (dayIndex: number, slotIndex: number) => {
    if (!draggingSlot) {
      return;
    }

    if (draggingSlot.dayIndex === dayIndex && draggingSlot.slotIndex === slotIndex) {
      setDraggingSlot(null);
      return;
    }

    setDayPlans((prev) => {
      const next = prev.map((day) => ({ ...day, slots: [...day.slots] }));
      const source = next[draggingSlot.dayIndex]?.slots[draggingSlot.slotIndex];
      const target = next[dayIndex]?.slots[slotIndex];

      if (!source || !target) {
        return prev;
      }

      next[draggingSlot.dayIndex].slots[draggingSlot.slotIndex] = target;
      next[dayIndex].slots[slotIndex] = source;
      return next;
    });

    setDraggingSlot(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.09),transparent_42%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)] dark:bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.18),transparent_35%),linear-gradient(to_bottom,#09090b,#0a0a0a)]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{ITINERARY_LABELS.PAGE_TITLE}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {ITINERARY_LABELS.PAGE_DESCRIPTION}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="h-fit border-zinc-200/80 bg-white/90 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/85">
            <CardHeader>
              <CardTitle className="text-lg">Generator Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Trip</Label>
                <Select value={selectedTripId} onValueChange={setSelectedTripId} disabled={isTripsLoading || trips.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={isTripsLoading ? "Loading trips..." : "Select trip"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Ex: Jaipur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">{ITINERARY_LABELS.DAYS_LABEL}</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={14}
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value || 1))}
                />
              </div>

              <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 dark:border-cyan-900 dark:bg-cyan-950/30">
                <div className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                  Trip Places: {tripPlaces.length}
                </div>
                <div className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
                  {isLoadingPlaces ? "Loading places..." : tripPlaces.length === 0 ? "No places added yet. Add places in Map section." : `${tripPlaces.length} place${tripPlaces.length !== 1 ? 's' : ''} will be distributed across ${days} day${days !== 1 ? 's' : ''}`}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700" 
                  onClick={handleGenerate}
                  disabled={tripPlaces.length === 0 || isLoadingPlaces}
                >
                  {ITINERARY_LABELS.GENERATE_BUTTON}
                </Button>
                <Button variant="outline" onClick={handleSave} disabled={isSaving || isAutoSaving || dayPlans.length === 0}>
                  {isSaving || isAutoSaving ? ITINERARY_LABELS.SAVING_BUTTON : ITINERARY_LABELS.SAVE_BUTTON}
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={dayPlans.length === 0} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
                  Clear
                </Button>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {ITINERARY_LABELS.DRAG_HINT}
                <span className="ml-1 font-medium text-zinc-700 dark:text-zinc-300">
                  {ITINERARY_LABELS.AUTO_SAVE_LABEL} {isAutoSaving ? ITINERARY_LABELS.AUTO_SAVE_SAVING : ITINERARY_LABELS.AUTO_SAVE_ON}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-zinc-200/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/85">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{ITINERARY_LABELS.GENERATED_DAYS_LABEL}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{dayPlans.length}</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-200/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/85">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{ITINERARY_LABELS.TIMELINE_SLOTS_LABEL}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalActivities}</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-200/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/85">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {isLoadingItinerary
                      ? "Loading itinerary..."
                      : dayPlans.length > 0
                        ? (optimizedItinerary.some((day) => day.warnings.length > 0) ? "Needs review" : "Ready")
                        : "Not generated"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {dayPlans.length === 0 ? (
              <Card className="border-dashed border-zinc-300 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/70">
                <CardContent className="py-16 text-center">
                  {!selectedTripId ? (
                    <div>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">No Trip Selected</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Please select a trip from the dropdown above to view or create an itinerary.</p>
                    </div>
                  ) : tripPlaces.length === 0 ? (
                    <div>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">No Places Added</p>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        You haven't added any places to this trip yet. Add places first to generate an itinerary.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/map'}
                        className="bg-cyan-600 text-white hover:bg-cyan-700"
                      >
                        Go to Map → Add Places
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">No Itinerary Generated</p>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        You have {tripPlaces.length} place{tripPlaces.length !== 1 ? 's' : ''} added. Click "Generate" above to create your day-by-day itinerary.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <Card className="border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Days</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3">
                      {dayPlans.map((day) => (
                        <Button
                          key={day.dayNumber}
                          type="button"
                          variant={selectedDayNumber === day.dayNumber ? "default" : "outline"}
                          className={cn(
                            "justify-start",
                            selectedDayNumber === day.dayNumber && "bg-cyan-600 text-white hover:bg-cyan-700"
                          )}
                          onClick={() => setSelectedDayNumber(day.dayNumber)}
                        >
                          Day {day.dayNumber}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {selectedDayPlan && (
                    <Card className="border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
                      <CardHeader className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
                        <div className="flex items-center justify-between gap-4">
                          <CardTitle className="text-lg">Day {selectedDayPlan.dayNumber}</CardTitle>
                          <Badge variant="secondary">{travelBalanceLabel(selectedDayPlan)}</Badge>
                        </div>
                        {selectedDayPlan.warnings.length > 0 && (
                          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            {selectedDayPlan.warnings.join(". ")}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-5">
                        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-500">Distance</p>
                            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{selectedDayPlan.estimatedDistanceKm.toFixed(1)} km</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-500">Travel</p>
                            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{selectedDayPlan.estimatedTravelMin} min</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-500">Planned</p>
                            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{selectedDayPlan.totalPlannedMin} min</p>
                          </div>
                        </div>
                        <div className="relative space-y-4">
                          <div className="absolute left-4.75 top-2 h-[calc(100%-8px)] w-px bg-zinc-200 dark:bg-zinc-800" />
                          {selectedDayPlan.slots.map((slot, slotIndex) => {
                            const selectedDayIndex = dayPlans.findIndex((day) => day.dayNumber === selectedDayPlan.dayNumber);

                            return (
                              <div
                                key={slot.id}
                                className={cn(
                                  "relative ml-0 flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-all dark:border-zinc-800 dark:bg-zinc-900",
                                  draggingSlot?.dayIndex === selectedDayIndex && draggingSlot?.slotIndex === slotIndex
                                    ? "opacity-60"
                                    : "opacity-100"
                                )}
                                draggable
                                onDragStart={() => handleDragStart(selectedDayIndex, slotIndex)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => handleDrop(selectedDayIndex, slotIndex)}
                              >
                                <div className="relative z-10 mt-2 h-3 w-3 shrink-0 rounded-full bg-cyan-500" />
                                <div className="flex-1">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">{slot.slot}</Badge>
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{slot.time}</span>
                                    <span className="text-xs text-zinc-400">{slot.durationMin} min</span>
                                    {slot.travelTimeMinFromPrevious > 0 && (
                                      <span className="text-xs text-zinc-400">+{slot.travelTimeMinFromPrevious} min travel</span>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{slot.name}</h3>
                                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{slot.location}</p>
                                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{slot.notes}</p>
                                  {slot.distanceFromPreviousKm > 0 && (
                                    <p className="mt-1 text-xs text-zinc-400">Distance from previous: {slot.distanceFromPreviousKm.toFixed(1)} km</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card className="border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
                  <CardHeader className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <CardTitle className="text-lg">
                      Map - Day {selectedDayPlan?.dayNumber || "-"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {selectedDayMapPlaces.length === 0 ? (
                      <div className="flex h-130 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        Select a day to view markers
                      </div>
                    ) : (
                      <div className="h-130 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <ItineraryMap places={selectedDayMapPlaces} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
