import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

type NormalizedPlace = {
  name: string;
  time: string;
  location: string;
  notes: string;
};

type NormalizedDay = {
  dayNumber: number;
  places: NormalizedPlace[];
};

type ItineraryPlaceInput = {
  name?: unknown;
  time?: unknown;
  location?: unknown;
  notes?: unknown;
};

type ItineraryDayInput = {
  dayNumber?: unknown;
  places?: unknown;
};

type ItineraryPatchOperation =
  | {
      operation: "upsert_day";
      day: ItineraryDayInput;
    }
  | {
      operation: "remove_day";
      dayNumber: unknown;
    }
  | {
      operation: "add_place";
      dayNumber: unknown;
      place: ItineraryPlaceInput;
    }
  | {
      operation: "update_place";
      dayNumber: unknown;
      placeId: unknown;
      place: ItineraryPlaceInput;
    }
  | {
      operation: "remove_place";
      dayNumber: unknown;
      placeId: unknown;
    };

function normalizePlace(place: ItineraryPlaceInput) {
  const name = typeof place.name === "string" ? place.name.trim() : "";
  const time = typeof place.time === "string" ? place.time.trim() : "";
  const location =
    typeof place.location === "string" ? place.location.trim() : "";
  const notes = typeof place.notes === "string" ? place.notes.trim() : "";

  if (!name) {
    return { error: "Place name is required" };
  }

  if (!time) {
    return { error: "Place time is required" };
  }

  if (!location) {
    return { error: "Place location is required" };
  }

  return {
    data: {
      name,
      time,
      location,
      notes,
    },
  };
}

function normalizeDay(day: ItineraryDayInput) {
  const dayNumber = Number(day.dayNumber);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    return { error: "dayNumber must be a positive integer" };
  }

  if (!Array.isArray(day.places)) {
    return { error: "places must be an array" };
  }

  const normalizedPlaces: NormalizedPlace[] = [];

  for (const place of day.places as unknown[]) {
    if (!place || typeof place !== "object") {
      return { error: "Invalid place payload" };
    }

    const normalizedPlace = normalizePlace(place as ItineraryPlaceInput);
    if (normalizedPlace.error) {
      return { error: normalizedPlace.error };
    }

    if (!normalizedPlace.data) {
      return { error: "Invalid place payload" };
    }

    normalizedPlaces.push(normalizedPlace.data);
  }

  return {
    data: {
      dayNumber,
      places: normalizedPlaces,
    },
  };
}

function normalizeDays(days: unknown) {
  if (!Array.isArray(days)) {
    return { error: "days must be an array" };
  }

  const normalizedDays: NormalizedDay[] = [];

  for (const day of days as unknown[]) {
    if (!day || typeof day !== "object") {
      return { error: "Invalid day payload" };
    }

    const normalizedDay = normalizeDay(day as ItineraryDayInput);
    if (normalizedDay.error) {
      return { error: normalizedDay.error };
    }

    if (!normalizedDay.data) {
      return { error: "Invalid day payload" };
    }

    normalizedDays.push(normalizedDay.data);
  }

  const dayNumbers = normalizedDays.map((day) => day.dayNumber);
  if (new Set(dayNumbers).size !== dayNumbers.length) {
    return { error: "Duplicate day numbers are not allowed" };
  }

  normalizedDays.sort((a, b) => a.dayNumber - b.dayNumber);

  return {
    data: normalizedDays,
  };
}

async function getAuthorizedUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

async function getTripId(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  return id || "";
}

async function verifyTripOwnership(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({ 
    where: { id: tripId, userId } 
  });
  return Boolean(trip);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthorizedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tripId = await getTripId(params);
    if (!tripId || !tripId.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    // Fetch all itinerary days for this trip
    const itineraryDays = await prisma.itinerary.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' },
      select: {
        dayNumber: true,
        date: true,
        activities: true,
        notes: true,
        updatedAt: true,
      },
    });

    // Format as days array with places (activities)
    const days = itineraryDays.map(day => ({
      dayNumber: day.dayNumber,
      date: day.date,
      places: Array.isArray(day.activities) ? day.activities : [],
      notes: day.notes,
    }));

    return NextResponse.json(
      {
        success: true,
        itinerary: { tripId, days },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get itinerary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthorizedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tripId = await getTripId(params);
    if (!tripId || !tripId.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const normalizedDays = normalizeDays(body?.days);
    if (normalizedDays.error) {
      return NextResponse.json(
        { success: false, message: normalizedDays.error },
        { status: 400 }
      );
    }

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    // Get trip dates to calculate day dates
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { startDate: true },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    // Delete existing itinerary days for this trip
    await prisma.itinerary.deleteMany({
      where: { tripId },
    });

    // Create new itinerary days
    const itineraryDays = normalizedDays.data?.map((day) => {
      const dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + (day.dayNumber - 1));
      
      return {
        tripId,
        dayNumber: day.dayNumber,
        date: dayDate,
        activities: day.places,
        notes: null,
      };
    });

    if (itineraryDays && itineraryDays.length > 0) {
      await prisma.itinerary.createMany({
        data: itineraryDays,
      });
    }

    // Fetch the updated itinerary
    const updatedItinerary = await prisma.itinerary.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' },
      select: {
        dayNumber: true,
        date: true,
        activities: true,
        notes: true,
      },
    });

    const days = updatedItinerary.map(day => ({
      dayNumber: day.dayNumber,
      date: day.date,
      places: Array.isArray(day.activities) ? day.activities : [],
      notes: day.notes,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary updated successfully",
        itinerary: { tripId, days },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Replace itinerary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthorizedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tripId = await getTripId(params);
    if (!tripId || !tripId.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    const operationBody = (await req.json()) as Partial<ItineraryPatchOperation>;

    if (operationBody.operation === "upsert_day") {
      const normalizedDay = normalizeDay(operationBody.day || {});
      if (normalizedDay.error || !normalizedDay.data) {
        return NextResponse.json(
          { success: false, message: normalizedDay.error || "Invalid day payload" },
          { status: 400 }
        );
      }

      // Get trip dates
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { startDate: true },
      });

      if (!trip) {
        return NextResponse.json(
          { success: false, message: "Trip not found" },
          { status: 404 }
        );
      }

      const dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + (normalizedDay.data.dayNumber - 1));

      // Upsert the day
      await prisma.itinerary.upsert({
        where: {
          tripId_dayNumber: {
            tripId,
            dayNumber: normalizedDay.data.dayNumber,
          },
        },
        update: {
          activities: normalizedDay.data.places,
        },
        create: {
          tripId,
          dayNumber: normalizedDay.data.dayNumber,
          date: dayDate,
          activities: normalizedDay.data.places,
        },
      });
    } else if (operationBody.operation === "remove_day") {
      const dayNumber = Number(operationBody.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return NextResponse.json(
          { success: false, message: "dayNumber must be a positive integer" },
          { status: 400 }
        );
      }

      await prisma.itinerary.delete({
        where: {
          tripId_dayNumber: {
            tripId,
            dayNumber,
          },
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported operation. Use: upsert_day, remove_day",
        },
        { status: 400 }
      );
    }

    // Fetch updated itinerary
    const itineraryDays = await prisma.itinerary.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' },
      select: {
        dayNumber: true,
        date: true,
        activities: true,
        notes: true,
      },
    });

    const days = itineraryDays.map(day => ({
      dayNumber: day.dayNumber,
      date: day.date,
      places: Array.isArray(day.activities) ? day.activities : [],
      notes: day.notes,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary patched successfully",
        itinerary: { tripId, days },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Patch itinerary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthorizedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tripId = await getTripId(params);
    if (!tripId) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    // Delete all itinerary days for this trip
    await prisma.itinerary.deleteMany({
      where: { tripId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary cleared successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete itinerary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
