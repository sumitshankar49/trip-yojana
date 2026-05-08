import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

function validateTripPayload(payload: {
  title?: unknown;
  source?: unknown;
  destination?: unknown;
  budget?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  places?: unknown;
  travelType?: unknown;
}) {
  const hasPlacesArray = Array.isArray(payload.places);
  const rawPlaces: unknown[] = hasPlacesArray ? (payload.places as unknown[]) : [];
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const source = typeof payload.source === "string" ? payload.source.trim() : "";
  const destination = typeof payload.destination === "string" ? payload.destination.trim() : "";
  const travelType = typeof payload.travelType === "string" ? payload.travelType.trim() : "";
  const budget = Number(payload.budget);
  const startDate = new Date(String(payload.startDate));
  const endDate = new Date(String(payload.endDate));
  const places = rawPlaces
    .filter((place): place is string => typeof place === "string")
    .map((place) => place.trim())
    .filter(Boolean);

  if (!title) {
    return { error: "Trip title is required" };
  }

  if (!destination) {
    return { error: "Destination is required" };
  }

  if (!Number.isFinite(budget) || budget < 0) {
    return { error: "Budget must be a valid non-negative number" };
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Start date and end date must be valid dates" };
  }

  if (!hasPlacesArray) {
    return { error: "Places must be provided as an array" };
  }

  if (places.length === 0) {
    return { error: "At least one place is required" };
  }

  if (startDate > endDate) {
    return { error: "Start date cannot be after end date" };
  }

  return {
    data: {
      title,
      source: source || destination,
      destination,
      budget,
      startDate,
      endDate,
      places,
      travelType: travelType || "leisure",
    } as {
      title: string;
      source: string;
      destination: string;
      budget: number;
      startDate: Date;
      endDate: Date;
      places: string[];
      travelType: string;
    },
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const trips = await prisma.trip.findMany({
      where: { userId: String(session.user.id) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        source: true,
        destination: true,
        startDate: true,
        endDate: true,
        budget: true,
        travelType: true,
        places: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format trips for frontend (convert id to _id for compatibility)
    const formattedTrips = trips.map(trip => ({
      _id: trip.id,
      ...trip,
    }));

    return NextResponse.json(
      {
        success: true,
        trips: formattedTrips,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get trips error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = validateTripPayload(body);

    if (validation.error) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    if (!validation.data) {
      return NextResponse.json(
        { success: false, message: "Invalid trip data" },
        { status: 400 }
      );
    }

    const tripData = validation.data;

    const trip = await prisma.trip.create({
      data: {
        userId: String(session.user.id),
        title: tripData.title,
        source: tripData.source,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        budget: tripData.budget,
        travelType: tripData.travelType,
        places: tripData.places,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Trip created successfully",
        trip: {
          _id: trip.id,
          ...trip,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
