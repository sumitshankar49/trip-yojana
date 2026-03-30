import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

async function getAuthorizedUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

async function getTripId(params: Promise<{ id: string }>) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return id;
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

    if (!tripId) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    await connectDB();

    const trip = await Trip.findOne({ _id: tripId, userId }).lean();

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, trip }, { status: 200 });
  } catch (error) {
    console.error("Get trip by id error:", error);
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

    if (!tripId) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
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

    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      validation.data,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Trip updated successfully",
        trip: updatedTrip,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update trip error:", error);
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

    await connectDB();

    const deletedTrip = await Trip.findOneAndDelete({ _id: tripId, userId }).lean();

    if (!deletedTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Trip deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
