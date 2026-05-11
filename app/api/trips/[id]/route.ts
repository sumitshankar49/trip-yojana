import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { fetchPincodeLocation } from "@/packages/lib/pincode";

export const runtime = "nodejs";

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

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId,
      },
      include: {
        budgets: true,
        expenses: true,
        itineraries: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      trip: {
        _id: trip.id,
        ...trip,
      },
    }, { status: 200 });
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

    if (!tripId || !tripId.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid trip id" },
        { status: 400 }
      );
    }

    // Verify trip ownership
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId,
      },
    });

    if (!existingTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const nextSource = typeof body.source === "string" ? body.source.trim() : existingTrip.source || "";
    const nextDestination = typeof body.destination === "string" ? body.destination.trim() : existingTrip.destination;
    const nextSourcePincode = typeof body.sourcePincode === "string" ? body.sourcePincode.trim() : existingTrip.sourcePincode || "";
    const nextDestinationPincode = typeof body.destinationPincode === "string" ? body.destinationPincode.trim() : existingTrip.destinationPincode || "";

    if (nextSourcePincode && !/^\d{6}$/.test(nextSourcePincode)) {
      return NextResponse.json(
        { success: false, message: "Source pincode must be exactly 6 digits" },
        { status: 400 }
      );
    }

    if (nextDestinationPincode && !/^\d{6}$/.test(nextDestinationPincode)) {
      return NextResponse.json(
        { success: false, message: "Destination pincode must be exactly 6 digits" },
        { status: 400 }
      );
    }

    const duplicateTrip = await prisma.trip.findFirst({
      where: {
        userId,
        id: { not: tripId },
        source: { equals: nextSource, mode: "insensitive" },
        destination: { equals: nextDestination, mode: "insensitive" },
        startDate: body.startDate ? new Date(body.startDate) : existingTrip.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existingTrip.endDate,
      },
      select: { id: true },
    });

    if (duplicateTrip) {
      return NextResponse.json(
        { success: false, message: "A trip with the same source, destination, and dates already exists." },
        { status: 409 }
      );
    }

    const [sourceLocation, destinationLocation] = await Promise.all([
      nextSourcePincode ? fetchPincodeLocation(nextSourcePincode) : Promise.resolve(null),
      nextDestinationPincode ? fetchPincodeLocation(nextDestinationPincode) : Promise.resolve(null),
    ]);

    if (nextSourcePincode && !sourceLocation) {
      return NextResponse.json(
        { success: false, message: "Could not resolve source pincode" },
        { status: 400 }
      );
    }

    if (nextDestinationPincode && !destinationLocation) {
      return NextResponse.json(
        { success: false, message: "Could not resolve destination pincode" },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        title: body.title,
        source: nextSource,
        sourcePincode: sourceLocation?.pincode ?? existingTrip.sourcePincode,
        sourceState: sourceLocation?.state ?? existingTrip.sourceState,
        sourceCountry: sourceLocation?.country ?? existingTrip.sourceCountry,
        destination: nextDestination,
        destinationPincode: destinationLocation?.pincode ?? existingTrip.destinationPincode,
        destinationState: destinationLocation?.state ?? existingTrip.destinationState,
        destinationCountry: destinationLocation?.country ?? existingTrip.destinationCountry,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        budget: body.budget ? Number(body.budget) : undefined,
        travelType: body.travelType,
        places: body.places,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Trip updated successfully",
        trip: {
          _id: trip.id,
          ...trip,
        },
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
    const { id: tripId } = await params;
    
    if (!tripId || !tripId.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid trip ID" },
        { status: 400 }
      );
    }
    
    const userId = await getAuthorizedUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify trip ownership
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId,
      },
    });

    if (!existingTrip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    await prisma.trip.delete({
      where: { id: tripId },
    });

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
