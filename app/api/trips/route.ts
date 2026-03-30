import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/backend/config/db";
import { auth } from "@/backend/lib/auth";
import Trip from "@/backend/models/Trip";

export const runtime = "nodejs";

function validateTripPayload(payload: {
  title?: unknown;
  budget?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  places?: unknown;
}) {
  const hasPlacesArray = Array.isArray(payload.places);
  const rawPlaces: unknown[] = hasPlacesArray ? (payload.places as unknown[]) : [];
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
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
      budget,
      startDate,
      endDate,
      places,
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

    await connectDB();

    const trips = await Trip.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        trips,
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

    await connectDB();

    const trip = await Trip.create({
      userId: session.user.id,
      ...validation.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Trip created successfully",
        trip,
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
