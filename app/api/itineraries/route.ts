import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

// GET /api/itineraries?tripId=xxx - Get itineraries for a specific trip
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tripIdParam = searchParams.get("tripId");
    const tripId = tripIdParam ? tripIdParam : null;

    if (!tripId || !tripId.trim()) {
      return NextResponse.json(
        { success: false, message: "Trip ID is required" },
        { status: 400 }
      );
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    const itineraries = await prisma.itinerary.findMany({
      where: { tripId },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        itineraries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get itineraries error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/itineraries - Create a new itinerary day
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
    const { tripId, dayNumber, date, activities, notes } = body;

    if (!tripId || typeof dayNumber !== "number" || !date) {
      return NextResponse.json(
        { success: false, message: "Trip ID, day number, and date are required" },
        { status: 400 }
      );
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if day already exists for this trip
    const existingDay = await prisma.itinerary.findFirst({
      where: {
        tripId,
        dayNumber,
      },
    });

    if (existingDay) {
      return NextResponse.json(
        { success: false, message: "Itinerary for this day already exists" },
        { status: 400 }
      );
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        tripId,
        dayNumber,
        date: new Date(date),
        activities: activities || [],
        notes: notes || "",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary created successfully",
        itinerary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create itinerary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
