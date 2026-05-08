import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { sendExpenseMemberInviteEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

async function getAuthorizedUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

async function getExpenseId(params: unknown): Promise<string> {
  const resolvedParams = await Promise.resolve(params);
  const paramsObj = resolvedParams as { id?: string };
  const id = paramsObj.id || "";
  return id;
}

// PUT /api/expenses/[id] - Update an expense
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

    const expenseId = await getExpenseId(context.params);
    if (!expenseId || !expenseId.trim()) {
      return NextResponse.json(
        { success: false, message: "Expense ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, amount, category, paidBy, splitWith, date, notes } = body;

    // Find expense and verify ownership through trip
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        trip: {
          userId,
        },
      },
      include: {
        trip: {
          select: {
            title: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found or unauthorized" },
        { status: 404 }
      );
    }

    // Track newly added members for email notifications
    const previousMembers = expense.splitWith || [];
    const newMembers = Array.isArray(splitWith)
      ? splitWith.filter((member: string) => !previousMembers.includes(member))
      : [];

    const updateData: {
      title?: string;
      amount?: number;
      category?: string;
      paidBy?: string;
      splitWith?: string[];
      date?: Date;
      notes?: string;
    } = {};

    if (title) updateData.title = title;
    if (typeof amount === "number") updateData.amount = amount;
    if (category) updateData.category = category;
    if (paidBy) updateData.paidBy = paidBy;
    if (Array.isArray(splitWith)) updateData.splitWith = splitWith;
    if (date) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes;

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });

    // Send email notifications to newly added members (non-blocking)
    if (newMembers.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const memberEmails = newMembers.filter((member: string) =>
        typeof member === 'string' && emailRegex.test(member)
      );

      if (memberEmails.length > 0) {
        const inviterName = expense.trip.user.name || "A trip member";
        const expenseDetails = {
          title: updatedExpense.title,
          amount: updatedExpense.amount,
          category: updatedExpense.category,
          date: updatedExpense.date,
        };

        // Send emails to newly added members
        memberEmails.forEach((email: string) => {
          sendExpenseMemberInviteEmail(email, inviterName, expense.trip.title, expenseDetails)
            .catch((err) =>
              console.error(`Failed to send expense invite email to ${email}:`, err)
            );
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete an expense
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

    const expenseId = await getExpenseId(context.params);
    if (!expenseId || !expenseId.trim()) {
      return NextResponse.json(
        { success: false, message: "Expense ID is required" },
        { status: 400 }
      );
    }

    // Find expense and verify ownership through trip
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        trip: {
          userId,
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
