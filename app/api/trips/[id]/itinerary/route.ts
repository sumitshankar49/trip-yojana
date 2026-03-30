import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/backend/config/db";
import { auth } from "@/backend/lib/auth";
import Trip from "@/backend/models/Trip";
import Itinerary from "@/backend/models/Itinerary";

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

async function getTripId(params: Promise<{ id: string }>) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return id;
}

async function verifyTripOwnership(tripId: string, userId: string) {
  const trip = await Trip.exists({ _id: tripId, userId });
  return Boolean(trip);
}

async function ensureItineraryDocument(tripId: string, userId: string) {
  await Itinerary.findOneAndUpdate(
    { tripId, userId },
    { $setOnInsert: { tripId, userId, days: [] } },
    { upsert: true, new: false }
  );
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

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    const itinerary = await Itinerary.findOne({ tripId, userId })
      .select("tripId days updatedAt")
      .lean();

    return NextResponse.json(
      {
        success: true,
        itinerary: itinerary || { tripId, days: [] },
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
    if (!tripId) {
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

    await connectDB();

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    const itinerary = await Itinerary.findOneAndUpdate(
      { tripId, userId },
      {
        $set: {
          days: normalizedDays.data,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    )
      .select("tripId days updatedAt")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary updated successfully",
        itinerary,
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
    if (!tripId) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    const operationBody = (await req.json()) as Partial<ItineraryPatchOperation>;

    await connectDB();

    const ownsTrip = await verifyTripOwnership(tripId, userId);
    if (!ownsTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    await ensureItineraryDocument(tripId, userId);

    if (operationBody.operation === "upsert_day") {
      const normalizedDay = normalizeDay(operationBody.day || {});
      if (normalizedDay.error) {
        return NextResponse.json(
          { success: false, message: normalizedDay.error },
          { status: 400 }
        );
      }

      if (!normalizedDay.data) {
        return NextResponse.json(
          { success: false, message: "Invalid day payload" },
          { status: 400 }
        );
      }

      const result = await Itinerary.updateOne(
        { tripId, userId, "days.dayNumber": normalizedDay.data.dayNumber },
        {
          $set: {
            "days.$.places": normalizedDay.data.places,
          },
        }
      );

      if (result.matchedCount === 0) {
        await Itinerary.updateOne(
          { tripId, userId },
          {
            $push: {
              days: {
                $each: [normalizedDay.data],
                $sort: { dayNumber: 1 },
              },
            },
          }
        );
      }
    } else if (operationBody.operation === "remove_day") {
      const dayNumber = Number(operationBody.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return NextResponse.json(
          { success: false, message: "dayNumber must be a positive integer" },
          { status: 400 }
        );
      }

      await Itinerary.updateOne(
        { tripId, userId },
        {
          $pull: {
            days: { dayNumber },
          },
        }
      );
    } else if (operationBody.operation === "add_place") {
      const dayNumber = Number(operationBody.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return NextResponse.json(
          { success: false, message: "dayNumber must be a positive integer" },
          { status: 400 }
        );
      }

      const normalizedPlace = normalizePlace(operationBody.place || {});
      if (normalizedPlace.error) {
        return NextResponse.json(
          { success: false, message: normalizedPlace.error },
          { status: 400 }
        );
      }

      const addToExistingDay = await Itinerary.updateOne(
        { tripId, userId, "days.dayNumber": dayNumber },
        {
          $push: {
            "days.$.places": normalizedPlace.data,
          },
        }
      );

      if (addToExistingDay.matchedCount === 0) {
        await Itinerary.updateOne(
          { tripId, userId },
          {
            $push: {
              days: {
                $each: [
                  {
                    dayNumber,
                    places: [normalizedPlace.data],
                  },
                ],
                $sort: { dayNumber: 1 },
              },
            },
          }
        );
      }
    } else if (operationBody.operation === "update_place") {
      const dayNumber = Number(operationBody.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return NextResponse.json(
          { success: false, message: "dayNumber must be a positive integer" },
          { status: 400 }
        );
      }

      const placeId = String(operationBody.placeId || "");
      if (!mongoose.Types.ObjectId.isValid(placeId)) {
        return NextResponse.json(
          { success: false, message: "Invalid placeId" },
          { status: 400 }
        );
      }

      const normalizedPlace = normalizePlace(operationBody.place || {});
      if (normalizedPlace.error) {
        return NextResponse.json(
          { success: false, message: normalizedPlace.error },
          { status: 400 }
        );
      }

      const result = await Itinerary.updateOne(
        { tripId, userId },
        {
          $set: {
            "days.$[day].places.$[place]": {
              _id: new mongoose.Types.ObjectId(placeId),
              ...normalizedPlace.data,
            },
          },
        },
        {
          arrayFilters: [
            { "day.dayNumber": dayNumber },
            { "place._id": new mongoose.Types.ObjectId(placeId) },
          ],
        }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: "Place not found" },
          { status: 404 }
        );
      }
    } else if (operationBody.operation === "remove_place") {
      const dayNumber = Number(operationBody.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return NextResponse.json(
          { success: false, message: "dayNumber must be a positive integer" },
          { status: 400 }
        );
      }

      const placeId = String(operationBody.placeId || "");
      if (!mongoose.Types.ObjectId.isValid(placeId)) {
        return NextResponse.json(
          { success: false, message: "Invalid placeId" },
          { status: 400 }
        );
      }

      const result = await Itinerary.updateOne(
        { tripId, userId },
        {
          $pull: {
            "days.$[day].places": {
              _id: new mongoose.Types.ObjectId(placeId),
            },
          },
        },
        {
          arrayFilters: [{ "day.dayNumber": dayNumber }],
        }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: "Place not found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported operation. Use: upsert_day, remove_day, add_place, update_place, remove_place",
        },
        { status: 400 }
      );
    }

    const itinerary = await Itinerary.findOne({ tripId, userId })
      .select("tripId days updatedAt")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary patched successfully",
        itinerary,
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
