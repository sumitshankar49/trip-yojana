import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { sendExpenseMemberInviteEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

// GET /api/expenses?tripId=xxx - Get expenses for a specific trip
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

    const expenses = await prisma.expense.findMany({
      where: { tripId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        expenses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
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
    const { tripId, title, amount, category, paidBy, splitWith, date, notes } = body;

    if (!tripId || !title || typeof amount !== "number" || !category) {
      return NextResponse.json(
        { success: false, message: "Trip ID, title, amount, and category are required" },
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

    const expense = await prisma.expense.create({
      data: {
        tripId,
        title,
        amount,
        category,
        paidBy: paidBy || session.user.name || "Unknown",
        splitWith: Array.isArray(splitWith) ? splitWith : [],
        date: date ? new Date(date) : new Date(),
        notes: notes || "",
      },
    });

    // Send email notifications to members added to this expense (non-blocking)
    if (Array.isArray(splitWith) && splitWith.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const memberEmails = splitWith.filter((member: string) => 
        typeof member === 'string' && emailRegex.test(member)
      );

      if (memberEmails.length > 0) {
        const inviterName = session.user.name || "A trip member";
        const expenseDetails = {
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
        };

        // Send emails to all members (asynchronously, don't block the response)
        memberEmails.forEach((email: string) => {
          sendExpenseMemberInviteEmail(email, inviterName, trip.title, expenseDetails)
            .catch((err) => 
              console.error(`Failed to send expense invite email to ${email}:`, err)
            );
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Expense created successfully",
        expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
