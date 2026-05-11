import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { computeGroupBalances, hasGroupAccess, suggestSettlements } from "@/app/api/expense-groups/_lib";
import { sendSettlementCompletedEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

const createSettlementSchema = z.object({
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amount: z.number().positive(),
});

async function getGroupId(params: Promise<{ id: string }> | { id: string }) {
  const resolved = await Promise.resolve(params);
  return resolved.id;
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

    const [balances, settlements] = await Promise.all([
      computeGroupBalances(groupId),
      prisma.settlementTransaction.findMany({
        where: { groupId },
        include: {
          fromMember: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toMember: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { settledAt: "desc" },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        balances,
        suggestions: suggestSettlements(balances),
        settlements,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get settlements error:", error);
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

    const userId = String(session.user.id);
    const groupId = await getGroupId(context.params);

    const canAccess = await hasGroupAccess(userId, groupId);
    if (!canAccess) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const parsed = createSettlementSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    if (payload.fromMemberId === payload.toMemberId) {
      return NextResponse.json(
        { success: false, message: "Settlement members must be different" },
        { status: 400 }
      );
    }

    const [fromMember, toMember, group] = await Promise.all([
      prisma.expenseGroupMember.findFirst({
        where: {
          id: payload.fromMemberId,
          groupId,
          status: "accepted",
        },
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
        },
      }),
      prisma.expenseGroupMember.findFirst({
        where: {
          id: payload.toMemberId,
          groupId,
          status: "accepted",
        },
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
        },
      }),
      prisma.expenseGroup.findUnique({
        where: { id: groupId },
        select: { name: true },
      }),
    ]);

    if (!fromMember || !toMember || !group) {
      return NextResponse.json(
        { success: false, message: "Invalid member selection" },
        { status: 400 }
      );
    }

    const balances = await computeGroupBalances(groupId);
    const fromBalance = balances.find((entry) => entry.memberId === payload.fromMemberId)?.balance || 0;
    const toBalance = balances.find((entry) => entry.memberId === payload.toMemberId)?.balance || 0;

    if (fromBalance >= -0.01 || toBalance <= 0.01) {
      return NextResponse.json(
        { success: false, message: "Selected members do not have an active payable balance" },
        { status: 400 }
      );
    }

    const maxAllowed = Math.min(Math.abs(fromBalance), toBalance);
    if (payload.amount - maxAllowed > 0.01) {
      return NextResponse.json(
        { success: false, message: `Settlement amount exceeds pending balance (${maxAllowed.toFixed(2)})` },
        { status: 400 }
      );
    }

    const settlement = await prisma.settlementTransaction.create({
      data: {
        groupId,
        fromMemberId: payload.fromMemberId,
        toMemberId: payload.toMemberId,
        amount: payload.amount,
        status: "completed",
        settledById: userId,
        settledAt: new Date(),
      },
      include: {
        fromMember: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
          },
        },
        toMember: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
          },
        },
      },
    });

    const notifyUserIds = [settlement.fromMember.userId, settlement.toMember.userId].filter(
      (value): value is string => Boolean(value)
    );

    if (notifyUserIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((targetUserId) => ({
          userId: targetUserId,
          type: "payment_reminder",
          title: `Settlement recorded in ${group.name}`,
          message: `${settlement.fromMember.name} paid ${settlement.toMember.name} (${settlement.amount.toFixed(2)}).`,
          link: `/expenses?groupId=${groupId}`,
        })),
      });
    }

    [settlement.fromMember.email, settlement.toMember.email].forEach((email) => {
      sendSettlementCompletedEmail(
        email,
        group.name,
        settlement.amount,
        settlement.fromMember.name,
        settlement.toMember.name
      ).catch((err) => {
        console.error(`Failed to send settlement email to ${email}:`, err);
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Settlement recorded",
        settlement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
