import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

async function getAuthorizedUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

async function getItineraryId(params: unknown): Promise<string> {
  const resolvedParams = await Promise.resolve(params);
  const paramsObj = resolvedParams as { id?: string };
  const id = paramsObj.id || "";
  return id;
}

// PUT /api/itineraries/[id] - Update an itinerary
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await getAuthorizedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const itineraryId = await getItineraryId(context.params);
    if (!itineraryId || !itineraryId.trim()) {
      return NextResponse.json(
        { success: false, message: "Itinerary ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { date, activities, notes } = body;

    // Find itinerary and verify ownership through trip
    const itinerary = await prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        trip: {
          userId,
        },
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { success: false, message: "Itinerary not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData: {
      date?: Date;
      activities?: any;
      notes?: string;
    } = {};

    if (date) updateData.date = new Date(date);
    if (activities !== undefined) updateData.activities = activities as any;
    if (notes !== undefined) updateData.notes = notes;

    const updatedItinerary = await prisma.itinerary.update({
      where: { id: itineraryId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary updated successfully",
        itinerary: updatedItinerary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update itinerary error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/itineraries/[id] - Delete an itinerary
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await getAuthorizedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const itineraryId = await getItineraryId(context.params);
    if (!itineraryId || !itineraryId.trim()) {
      return NextResponse.json(
        { success: false, message: "Itinerary ID is required" },
        { status: 400 }
      );
    }

    // Find itinerary and verify ownership through trip
    const itinerary = await prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        trip: {
          userId,
        },
      },
    });

    if (!itinerary) {
      return NextResponse.json(
        { success: false, message: "Itinerary not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.itinerary.delete({
      where: { id: itineraryId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Itinerary deleted successfully",
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
