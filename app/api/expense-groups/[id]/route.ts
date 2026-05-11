import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { computeGroupBalances, hasGroupAccess, suggestSettlements } from "@/app/api/expense-groups/_lib";

export const runtime = "nodejs";

const updateGroupSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).nullable().optional(),
  currency: z.string().length(3).optional(),
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
    const userId = String(session.user.id);

    const canAccess = await hasGroupAccess(userId, groupId);
    if (!canAccess) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const [group, balances, history] = await Promise.all([
      prisma.expenseGroup.findUnique({
        where: { id: groupId },
        include: {
          trip: {
            select: {
              id: true,
              title: true,
              destination: true,
              startDate: true,
              endDate: true,
            },
          },
          members: {
            select: {
              id: true,
              userId: true,
              name: true,
              email: true,
              role: true,
              status: true,
              joinedAt: true,
              createdAt: true,
            },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          },
          expenses: {
            include: {
              paidByMember: {
                select: { id: true, name: true, email: true },
              },
              shares: {
                include: {
                  member: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
            orderBy: { paidAt: "desc" },
            take: 30,
          },
        },
      }),
      computeGroupBalances(groupId),
      prisma.settlementTransaction.findMany({
        where: { groupId },
        include: {
          fromMember: { select: { id: true, name: true, email: true } },
          toMember: { select: { id: true, name: true, email: true } },
        },
        orderBy: { settledAt: "desc" },
        take: 30,
      }),
    ]);

    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const settlementSuggestions = suggestSettlements(balances);
    const viewerMember = group.members.find((member) => member.userId === userId) || null;

    return NextResponse.json(
      {
        success: true,
        viewer: {
          userId,
          memberId: viewerMember?.id || null,
        },
        group,
        summary: {
          totalExpense: group.expenses.reduce((sum, expense) => sum + expense.amount, 0),
          balances,
          settlementSuggestions,
        },
        settlements: history,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get expense group details error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const group = await prisma.expenseGroup.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: "Only group owner can update group details" },
        { status: 403 }
      );
    }

    const parsed = updateGroupSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.expenseGroup.update({
      where: { id: groupId },
      data: {
        name: parsed.data.name?.trim(),
        description: parsed.data.description === null ? null : parsed.data.description?.trim(),
        currency: parsed.data.currency?.toUpperCase(),
      },
    });

    return NextResponse.json({ success: true, group: updated }, { status: 200 });
  } catch (error) {
    console.error("Update expense group error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const groupId = await getGroupId(context.params);
    const userId = String(session.user.id);

    const group = await prisma.expenseGroup.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    if (group.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: "Only group owner can delete this group" },
        { status: 403 }
      );
    }

    await prisma.expenseGroup.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true, message: "Group deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete expense group error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
