import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

// GET /api/budgets?tripId=xxx - Get budgets for a specific trip
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

    const budgets = await prisma.budget.findMany({
      where: { tripId },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        budgets,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Create a new budget category
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
    const { tripId, category, allocated } = body;

    if (!tripId || !category || typeof allocated !== "number") {
      return NextResponse.json(
        { success: false, message: "Trip ID, category, and allocated amount are required" },
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

    // Check if category already exists for this trip
    const existingBudget = await prisma.budget.findFirst({
      where: {
        tripId,
        category,
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        { success: false, message: "Budget category already exists for this trip" },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        tripId,
        category,
        allocated,
        spent: 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Budget category created successfully",
        budget,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create budget error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
