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

async function getBudgetId(params: unknown): Promise<string> {
  const resolvedParams = await Promise.resolve(params);
  const paramsObj = resolvedParams as { id?: string };
  const id = paramsObj.id || "";
  return id;
}

// PUT /api/budgets/[id] - Update a budget category
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

    const budgetId = await getBudgetId(context.params);
    if (!budgetId || !budgetId.trim()) {
      return NextResponse.json(
        { success: false, message: "Budget ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { allocated, spent } = body;

    // Find budget and verify ownership through trip
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        trip: {
          userId,
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { success: false, message: "Budget not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData: { allocated?: number; spent?: number } = {};
    if (typeof allocated === "number") updateData.allocated = allocated;
    if (typeof spent === "number") updateData.spent = spent;

    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Budget updated successfully",
        budget: updatedBudget,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update budget error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets/[id] - Delete a budget category
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

    const budgetId = await getBudgetId(context.params);
    if (!budgetId || !budgetId.trim()) {
      return NextResponse.json(
        { success: false, message: "Budget ID is required" },
        { status: 400 }
      );
    }

    // Find budget and verify ownership through trip
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        trip: {
          userId,
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { success: false, message: "Budget not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Budget deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
