import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { hasGroupAccess } from "@/app/api/expense-groups/_lib";
import { sendGroupExpenseAddedEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";
const db = prisma as any;

const createExpenseSchema = z.object({
  title: z.string().min(2).max(120),
  amount: z.number().positive(),
  category: z.string().min(2).max(60),
  notes: z.string().max(500).optional().or(z.literal("")),
  paidByMemberId: z.string().min(1),
  splitMethod: z.enum(["equal", "custom"]).optional(),
  participantIds: z.array(z.string().min(1)).min(1).optional(),
  shares: z
    .array(
      z.object({
        memberId: z.string().min(1),
        amount: z.number().nonnegative(),
      })
    )
    .min(1)
    .optional(),
  paidAt: z.string().datetime().optional(),
});

async function getGroupId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

function splitEqually(total: number, participants: string[]) {
  const amountInPaise = Math.round(total * 100);
  const count = participants.length;
  const base = Math.floor(amountInPaise / count);
  const remainder = amountInPaise % count;

  return participants.map((memberId, index) => ({
    memberId,
    amount: (base + (index < remainder ? 1 : 0)) / 100,
  }));
}

function normalizeShares(shares: Array<{ memberId: string; amount: number }>) {
  const map = new Map<string, number>();

  shares.forEach((share) => {
    const previous = map.get(share.memberId) || 0;
    map.set(share.memberId, previous + share.amount);
  });

  return Array.from(map.entries()).map(([memberId, amount]) => ({
    memberId,
    amount: Math.round(amount * 100) / 100,
  }));
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const groupId = await getGroupId(context.params);
    const canAccess = await hasGroupAccess(String(session.user.id), groupId);

    if (!canAccess) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const expenses = await db.expenseGroupExpense.findMany({
      where: { groupId },
      include: {
        paidByMember: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    return NextResponse.json({ success: true, expenses }, { status: 200 });
  } catch (error) {
    console.error("Get group expenses error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const groupId = await getGroupId(context.params);
    const userId = String(session.user.id);

    const canAccess = await hasGroupAccess(userId, groupId);
    if (!canAccess) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const parsed = createExpenseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const members = await db.expenseGroupMember.findMany({
      where: {
        groupId,
        status: {
          notIn: ["declined", "removed"],
        },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
      },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active members in this group" },
        { status: 400 }
      );
    }

    const memberIds = new Set(members.map((member: any) => member.id));

    if (!memberIds.has(payload.paidByMemberId)) {
      return NextResponse.json(
        { success: false, message: "Payer must be an active member" },
        { status: 400 }
      );
    }

    const participants = (payload.participantIds?.length
      ? payload.participantIds
      : members.map((member: any) => member.id)
    ).filter((id: string) => memberIds.has(id));

    if (participants.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one valid participant is required" },
        { status: 400 }
      );
    }

    const splitMethod = payload.splitMethod || "equal";
    let shares = splitEqually(payload.amount, participants);

    if (splitMethod === "custom") {
      const requestedShares = payload.shares || [];
      const normalizedShares = normalizeShares(requestedShares).filter((share) =>
        participants.includes(share.memberId)
      );

      if (normalizedShares.length === 0) {
        return NextResponse.json(
          { success: false, message: "At least one custom split share is required" },
          { status: 400 }
        );
      }

      const totalCustom = Math.round(
        normalizedShares.reduce((sum, share) => sum + share.amount, 0) * 100
      );
      const totalAmount = Math.round(payload.amount * 100);

      if (totalCustom !== totalAmount) {
        return NextResponse.json(
          {
            success: false,
            message: "Custom split amounts must add up to the total expense amount",
          },
          { status: 400 }
        );
      }

      shares = normalizedShares;
    }

    const expense = await db.$transaction(async (tx: any) => {
      const createdExpense = await tx.expenseGroupExpense.create({
        data: {
          groupId,
          createdById: userId,
          paidByMemberId: payload.paidByMemberId,
          title: payload.title.trim(),
          amount: payload.amount,
          category: payload.category.trim(),
          notes: payload.notes?.trim() || null,
          splitMethod,
          paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
          shares: {
            createMany: {
              data: shares.map((share) => ({
                memberId: share.memberId,
                amount: share.amount,
              })),
            },
          },
        },
        include: {
          paidByMember: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          shares: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  userId: true,
                },
              },
            },
          },
          group: {
            select: {
              name: true,
              tripId: true,
            },
          },
        },
      });

      const linkedTrip = await tx.trip.findUnique({
        where: { id: createdExpense.group.tripId },
        select: { id: true, budget: true },
      });

      if (linkedTrip) {
        const nextBudget = Math.max(0, Math.round((linkedTrip.budget - payload.amount) * 100) / 100);
        await tx.trip.update({
          where: { id: linkedTrip.id },
          data: { budget: nextBudget },
        });
      }

      return createdExpense;
    });

    const memberUserIds = expense.shares
      .map((share: any) => share.member.userId)
      .filter((value: any): value is string => Boolean(value));

    const dedupedUserIds = Array.from(new Set(memberUserIds)).filter((id) => id !== userId);

    if (dedupedUserIds.length > 0) {
      await db.notification.createMany({
        data: dedupedUserIds.map((targetUserId) => ({
          userId: targetUserId,
          type: "expense",
          title: `New expense in ${expense.group.name}`,
          message: `${expense.paidByMember.name} added ${expense.title} (${expense.amount.toFixed(2)}).`,
          link: `/expenses?groupId=${groupId}`,
        })),
      });
    }

    expense.shares.forEach((share: any) => {
      if (!share.member.email || share.member.userId === userId) return;
      sendGroupExpenseAddedEmail(
        share.member.email,
        expense.group.name,
        expense.title,
        expense.amount,
        expense.paidByMember.name
      ).catch((err) => {
        console.error(`Failed to send expense update email to ${share.member.email}:`, err);
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense added successfully",
        expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create group expense error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
