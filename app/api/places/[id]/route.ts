import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

function parseCoordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalizedValue =
    typeof value === "string"
      ? value.trim().replace(",", ".")
      : value;
  const parsed = typeof normalizedValue === "number" ? normalizedValue : Number(normalizedValue);

  return Number.isFinite(parsed) ? parsed : null;
}

function isCoordinateInRange(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

async function getAuthorizedUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

async function getPlaceId(context: { params: Promise<{ id: string }> }): Promise<string> {
  const params = await context.params;
  return params.id || "";
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthorizedUserId();
    const placeId = await getPlaceId(context);

    if (!placeId || !placeId.trim()) {
      return NextResponse.json({ error: "Invalid place ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, lat, lng, category, address, time, order } = body;

    const hasLat = lat !== undefined;
    const hasLng = lng !== undefined;
    if (hasLat !== hasLng) {
      return NextResponse.json(
        { error: "Latitude and longitude must be provided together" },
        { status: 400 }
      );
    }

    let parsedLat: number | undefined;
    let parsedLng: number | undefined;

    if (hasLat && hasLng) {
      const latValue = parseCoordinate(lat);
      const lngValue = parseCoordinate(lng);

      if (latValue === null || lngValue === null) {
        return NextResponse.json(
          { error: "Latitude and longitude must be valid numbers" },
          { status: 400 }
        );
      }

      if (!isCoordinateInRange(latValue, lngValue)) {
        return NextResponse.json(
          { error: "Latitude/longitude are out of valid range" },
          { status: 400 }
        );
      }

      parsedLat = latValue;
      parsedLng = lngValue;
    }

    // Verify place ownership through trip
    const place = await prisma.tripPlace.findFirst({
      where: { id: placeId },
      include: { trip: true },
    });

    if (!place || place.trip.userId !== userId) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // Update the place
    const updatedPlace = await prisma.tripPlace.update({
      where: { id: placeId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(parsedLat !== undefined && { lat: parsedLat }),
        ...(parsedLng !== undefined && { lng: parsedLng }),
        ...(category !== undefined && { category }),
        ...(address !== undefined && { address }),
        ...(time !== undefined && { time }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ place: updatedPlace }, { status: 200 });
  } catch (error: any) {
    console.error("Place update error:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update place" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthorizedUserId();
    const placeId = await getPlaceId(context);

    if (!placeId || !placeId.trim()) {
      return NextResponse.json({ error: "Invalid place ID" }, { status: 400 });
    }

    // Verify place ownership through trip
    const place = await prisma.tripPlace.findFirst({
      where: { id: placeId },
      include: { trip: true },
    });

    if (!place || place.trip.userId !== userId) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // Delete the place
    await prisma.tripPlace.delete({
      where: { id: placeId },
    });

    return NextResponse.json(
      { message: "Place deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Place deletion error:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete place" },
      { status: 500 }
    );
  }
}
