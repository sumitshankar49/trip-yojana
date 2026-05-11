import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

const updateMemberSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["member", "admin"]).optional(),
});

type MemberRow = {
  id: string;
  groupId: string;
  userId: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  invitedById: string | null;
};

type ActorRow = {
  id: string;
  role: string;
  group: {
    ownerId: string;
  };
};

type DbClient = {
  expenseGroupMember: {
    findFirst: (args: unknown) => Promise<MemberRow | ActorRow | null>;
    update: (args: unknown) => Promise<MemberRow>;
    delete: (args: unknown) => Promise<MemberRow>;
  };
  expenseGroupExpense: {
    count: (args: unknown) => Promise<number>;
  };
  settlementTransaction: {
    count: (args: unknown) => Promise<number>;
  };
};

const db = prisma as unknown as DbClient;

async function getIds(params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string }) {
  const resolved = await Promise.resolve(params);
  return resolved;
}

async function getActor(userId: string, groupId: string) {
  return db.expenseGroupMember.findFirst({
    where: {
      groupId,
      OR: [{ userId }, { group: { is: { ownerId: userId } } }],
    },
    select: {
      id: true,
      role: true,
      group: {
        select: {
          ownerId: true,
        },
      },
    },
  }) as Promise<ActorRow | null>;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId, memberId } = await getIds(context.params);
    const userId = String(session.user.id);

    const actor = await getActor(userId, groupId);
    if (!actor) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const isOwner = actor.group.ownerId === userId;
    const canManage = isOwner || actor.role === "admin";
    if (!canManage) {
      return NextResponse.json({ success: false, message: "Only owner/admin can update members" }, { status: 403 });
    }

    const member = (await db.expenseGroupMember.findFirst({
      where: { id: memberId, groupId },
      select: {
        id: true,
        groupId: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        invitedById: true,
      },
    })) as MemberRow | null;

    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json({ success: false, message: "Owner member cannot be edited" }, { status: 400 });
    }

    const parsed = updateMemberSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updatedMember = await db.expenseGroupMember.update({
      where: { id: memberId },
      data: {
        name: parsed.data.name?.trim(),
        role: parsed.data.role,
      },
      select: {
        id: true,
        groupId: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        invitedById: true,
      },
    });

    return NextResponse.json({ success: true, message: "Member updated successfully", member: updatedMember }, { status: 200 });
  } catch (error) {
    console.error("Update group member error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId, memberId } = await getIds(context.params);
    const userId = String(session.user.id);

    const actor = await getActor(userId, groupId);
    if (!actor) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const isOwner = actor.group.ownerId === userId;
    const canManage = isOwner || actor.role === "admin";
    if (!canManage) {
      return NextResponse.json({ success: false, message: "Only owner/admin can remove members" }, { status: 403 });
    }

    const member = (await db.expenseGroupMember.findFirst({
      where: { id: memberId, groupId },
      select: {
        id: true,
        groupId: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        invitedById: true,
      },
    })) as MemberRow | null;

    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json({ success: false, message: "Owner member cannot be removed" }, { status: 400 });
    }

    const relatedExpenseCount = await db.expenseGroupExpense.count({
      where: { paidByMemberId: memberId },
    });

    const relatedSettlementCount = await db.settlementTransaction.count({
      where: {
        OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
      },
    });

    if (relatedExpenseCount > 0 || relatedSettlementCount > 0) {
      const removedMember = await db.expenseGroupMember.update({
        where: { id: memberId },
        data: {
          status: "removed",
          role: member.role === "admin" ? "admin" : "member",
        },
        select: {
          id: true,
          groupId: true,
          userId: true,
          email: true,
          name: true,
          role: true,
          status: true,
          invitedById: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Member removed from active list",
          member: removedMember,
          softRemoved: true,
        },
        { status: 200 }
      );
    }

    await db.expenseGroupMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true, message: "Member removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete group member error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
