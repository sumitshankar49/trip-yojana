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

type PlaceCandidate = {
  id: string;
  name: string;
  location: string;
  notes: string;
  interests: Interest[];
  area: string;
  durationMin: number;
  bestSlot: SlotName;
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

const AREA_COORDS: Record<string, [number, number]> = {
  north: [28.7041, 77.1025],
  south: [12.9716, 77.5946],
  east: [22.5726, 88.3639],
  west: [19.076, 72.8777],
  central: [23.2599, 77.4126],
  custom: [20.5937, 78.9629],
};

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

const INTEREST_OPTIONS: { value: Interest; label: string }[] = [
  { value: "temple", label: "Temple" },
  { value: "nature", label: "Nature" },
  { value: "food", label: "Food" },
];

const PLACE_LIBRARY: PlaceCandidate[] = [
  {
    id: "p1",
    name: "Old City Heritage Walk",
    location: "Historic Quarter",
    notes: "Great for architecture photos and local stories.",
    interests: ["temple", "nature"],
    area: "central",
    durationMin: 120,
    bestSlot: "morning",
  },
  {
    id: "p2",
    name: "Museum and Art Gallery",
    location: "Museum District",
    notes: "Book tickets online to skip queues.",
    interests: ["temple", "nature"],
    area: "central",
    durationMin: 150,
    bestSlot: "afternoon",
  },
  {
    id: "p3",
    name: "City Viewpoint",
    location: "Hill Top",
    notes: "Best around golden hour.",
    interests: ["nature"],
    area: "north",
    durationMin: 90,
    bestSlot: "evening",
  },
  {
    id: "p4",
    name: "Street Food Trail",
    location: "Market Street",
    notes: "Try 3-4 signature dishes.",
    interests: ["food"],
    area: "central",
    durationMin: 120,
    bestSlot: "evening",
  },
  {
    id: "p5",
    name: "Botanical Garden",
    location: "Garden Zone",
    notes: "Relaxing walk and shaded pathways.",
    interests: ["nature"],
    area: "east",
    durationMin: 100,
    bestSlot: "morning",
  },
  {
    id: "p6",
    name: "Adventure Activity Park",
    location: "Outskirts",
    notes: "Keep hydration and spare clothes.",
    interests: ["nature"],
    area: "west",
    durationMin: 180,
    bestSlot: "afternoon",
  },
  {
    id: "p7",
    name: "Local Handicraft Market",
    location: "Bazaar Road",
    notes: "Bargain politely for better prices.",
    interests: ["food", "temple"],
    area: "south",
    durationMin: 110,
    bestSlot: "afternoon",
  },
  {
    id: "p8",
    name: "Riverfront Walk",
    location: "River Promenade",
    notes: "Ideal for sunset views.",
    interests: ["nature", "food"],
    area: "east",
    durationMin: 90,
    bestSlot: "evening",
  },
  {
    id: "p9",
    name: "Historic Fort Complex",
    location: "Fort Area",
    notes: "Carry light walking shoes.",
    interests: ["temple", "nature"],
    area: "north",
    durationMin: 160,
    bestSlot: "morning",
  },
  {
    id: "p10",
    name: "Temple Circuit",
    location: "Sacred Zone",
    notes: "Respect local customs and dress code.",
    interests: ["temple"],
    area: "south",
    durationMin: 130,
    bestSlot: "morning",
  },
  {
    id: "p11",
    name: "Cafe and Bakery Crawl",
    location: "Downtown",
    notes: "Perfect slow-paced break between attractions.",
    interests: ["food"],
    area: "central",
    durationMin: 100,
    bestSlot: "afternoon",
  },
  {
    id: "p12",
    name: "Night Cultural Show",
    location: "Performance Center",
    notes: "Reserve seats in advance.",
    interests: ["temple", "food"],
    area: "central",
    durationMin: 120,
    bestSlot: "evening",
  },
];

function dayDiffInclusive(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function hashToOffset(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function resolveLatLng(area: string, seed: string, dayNumber: number, slotIndex: number): { lat: number; lng: number } {
  const base = AREA_COORDS[area] || AREA_COORDS.custom;
  const seedOffset = hashToOffset(seed);
  const dayOffset = dayNumber * 0.03;
  const slotOffset = slotIndex * 0.015;

  return {
    lat: base[0] + seedOffset * 0.12 + dayOffset,
    lng: base[1] + seedOffset * 0.14 + slotOffset,
  };
}

function buildFallbackPlace(destination: string, interest: Interest, index: number): PlaceCandidate {
  return {
    id: `fallback-${interest}-${index}`,
    name: `${interest[0].toUpperCase() + interest.slice(1)} Experience`,
    location: destination || "City Center",
    notes: `Explore a ${interest} spot in ${destination || "the destination"}.`,
    interests: [interest],
    area: ["central", "north", "east", "south", "west"][index % 5],
    durationMin: 90,
    bestSlot: SLOT_ORDER[index % SLOT_ORDER.length],
  };
}

function scoreCandidate(candidate: PlaceCandidate, interests: Interest[], slot: SlotName, previousArea: string | null) {
  const interestMatches = candidate.interests.filter((value) => interests.includes(value)).length;
  const slotScore = candidate.bestSlot === slot ? 3 : 0;
  const commuteScore = previousArea && candidate.area === previousArea ? 2 : 0;
  return interestMatches * 5 + slotScore + commuteScore;
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

function generateItinerary(destination: string, days: number, interests: Interest[]): DayPlan[] {
  const totalSlots = days * SLOT_ORDER.length;
  const MAX_PLACES_PER_DAY = SLOT_ORDER.length;
  const OVERLOAD_LIMIT_MIN = 8 * 60;
  const effectiveInterests: Interest[] =
    interests.length > 0 ? interests : (["temple", "nature", "food"] as Interest[]);

  const ranked = PLACE_LIBRARY
    .map((place) => {
      const matches = place.interests.filter((interest) => effectiveInterests.includes(interest)).length;
      return { place, rank: matches * 10 + (place.bestSlot === "morning" ? 1 : 0) };
    })
    .sort((a, b) => b.rank - a.rank)
    .map((entry) => entry.place);

  const selectedPool: PlaceCandidate[] = [...ranked];
  let fallbackCounter = 1;

  while (selectedPool.length < totalSlots) {
    const fallbackInterest = effectiveInterests[(fallbackCounter - 1) % effectiveInterests.length];
    selectedPool.push(buildFallbackPlace(destination, fallbackInterest, fallbackCounter));
    fallbackCounter += 1;
  }

  const remaining = selectedPool.slice(0, totalSlots);
  const output: DayPlan[] = [];

  for (let day = 1; day <= days; day += 1) {
    const slots: SlotPlan[] = [];
    let previousArea: string | null = null;
    let previousCoords: [number, number] | null = null;
    let totalDistanceKm = 0;
    let totalTravelMin = 0;

    SLOT_ORDER.forEach((slotName, slotIndex) => {
      const rankedCandidates = remaining
        .map((candidate, index) => {
          const coords = resolveLatLng(candidate.area, candidate.name, day, slotIndex);
          const distanceKm = previousCoords
            ? haversineDistanceKm(previousCoords, [coords.lat, coords.lng])
            : 0;
          const score = scoreCandidate(candidate, effectiveInterests, slotName, previousArea);
          return { candidate, index, score, distanceKm };
        })
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return a.distanceKm - b.distanceKm;
        });

      const picked = rankedCandidates[0];
      const selected = picked
        ? remaining.splice(picked.index, 1)[0]
        : buildFallbackPlace(destination, effectiveInterests[0], day * 10 + slotIndex);
      previousArea = selected.area;
      const coords = resolveLatLng(selected.area, selected.name, day, slotIndex);
      const distanceFromPreviousKm = previousCoords
        ? haversineDistanceKm(previousCoords, [coords.lat, coords.lng])
        : 0;
      const travelTimeMinFromPrevious = slotIndex === 0 ? 0 : estimateTravelTimeMin(distanceFromPreviousKm);

      totalDistanceKm += distanceFromPreviousKm;
      totalTravelMin += travelTimeMinFromPrevious;
      previousCoords = [coords.lat, coords.lng];

      slots.push({
        id: `${day}-${slotName}-${selected.id}`,
        slot: slotName,
        time: SLOT_TIMES[slotName],
        name: selected.name,
        location: selected.location.includes(destination) || !destination
          ? selected.location
          : `${selected.location}, ${destination}`,
        notes: selected.notes,
        area: selected.area,
        durationMin: selected.durationMin,
        lat: coords.lat,
        lng: coords.lng,
        distanceFromPreviousKm,
        travelTimeMinFromPrevious,
      });
    });

    const totalActivityMin = slots.reduce((sum, slot) => sum + slot.durationMin, 0);
    const totalPlannedMin = totalActivityMin + totalTravelMin;
    const warnings: string[] = [];

    if (slots.length > MAX_PLACES_PER_DAY) {
      warnings.push("Too many places assigned for one day");
    }

    if (totalPlannedMin > OVERLOAD_LIMIT_MIN) {
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
        const coords = resolveLatLng("custom", `${place.name}-${place.location}`, day.dayNumber, index);
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

  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState<Interest[]>(["temple", "nature", "food"]);

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
        if (isMounted && apiDays.length > 0) {
          const mappedPlans = mapApiDaysToPlans(apiDays);
          skipNextAutoSaveRef.current = true;
          lastSavedSignatureRef.current = JSON.stringify(buildItineraryPayload(mappedPlans));
          setDayPlans(mappedPlans);
        } else if (isMounted) {
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

  const handleInterestToggle = (interest: Interest, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") {
      return;
    }
    setInterests((prev) => {
      if (checked) {
        return prev.includes(interest) ? prev : [...prev, interest];
      }
      return prev.filter((item) => item !== interest);
    });
  };

  const handleGenerate = () => {
    const cleanDestination = destination.trim();
    if (!cleanDestination) {
      toast.error(ITINERARY_MESSAGES.DESTINATION_REQUIRED);
      return;
    }

    if (days < 1 || days > 14) {
      toast.error(ITINERARY_MESSAGES.DAYS_OUT_OF_RANGE);
      return;
    }

    const generated = generateItinerary(cleanDestination, days, interests);
    setDayPlans(generated);
    const optimized = toDayWiseOutput(generated);
    const overloadedDays = optimized.filter((day) => day.warnings.length > 0).length;

    if (overloadedDays > 0) {
      toast.warning(`Optimized itinerary generated with ${overloadedDays} overloaded day${overloadedDays > 1 ? "s" : ""}`);
      return;
    }

    toast.success(ITINERARY_MESSAGES.GENERATED_SUCCESS);
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

              <div className="space-y-3">
                <Label>{ITINERARY_LABELS.INTERESTS_LABEL}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INTEREST_OPTIONS.map((item) => (
                    <label
                      key={item.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        interests.includes(item.value)
                          ? "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                      )}
                    >
                      <Checkbox
                        checked={interests.includes(item.value)}
                        onCheckedChange={(checked) => handleInterestToggle(item.value, checked)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700" onClick={handleGenerate}>
                  {ITINERARY_LABELS.GENERATE_BUTTON}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleSave} disabled={isSaving || isAutoSaving || dayPlans.length === 0}>
                  {isSaving || isAutoSaving ? ITINERARY_LABELS.SAVING_BUTTON : ITINERARY_LABELS.SAVE_BUTTON}
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
                  <p className="text-zinc-600 dark:text-zinc-400">No itinerary yet. Generate one to see the day-wise timeline.</p>
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
