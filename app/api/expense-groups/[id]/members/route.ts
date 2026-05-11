import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";
import { sendGroupInviteEmail } from "@/backend/lib/mailer";
import { hasGroupAccess } from "@/app/api/expense-groups/_lib";

export const runtime = "nodejs";

type GroupMemberRow = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  joinedAt: Date | null;
  createdAt: Date;
};

type ExistingMemberEmailRow = { email: string };
type ExistingUserRow = { id: string; email: string; name: string | null };

type ActorRow = {
  id: string;
  role: string;
  group: {
    ownerId: string;
    name: string;
    trip: {
      title: string;
    };
  };
};

type DbClient = {
  expenseGroupMember: {
    findMany: (args: unknown) => Promise<GroupMemberRow[] | ExistingMemberEmailRow[]>;
    findFirst: (args: unknown) => Promise<ActorRow | null>;
    createMany: (args: unknown) => Promise<unknown>;
  };
  user: {
    findMany: (args: unknown) => Promise<ExistingUserRow[]>;
  };
  notification: {
    createMany: (args: unknown) => Promise<unknown>;
  };
};

const db = prisma as unknown as DbClient;

const inviteMembersSchema = z.object({
  members: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(80).optional(),
        role: z.enum(["member", "admin"]).optional(),
      })
    )
    .min(1)
    .max(25),
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

    const members = (await db.expenseGroupMember.findMany({
      where: { groupId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        joinedAt: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    })) as GroupMemberRow[];

    return NextResponse.json({ success: true, members }, { status: 200 });
  } catch (error) {
    console.error("Get group members error:", error);
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

    const actor = await db.expenseGroupMember.findFirst({
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
            name: true,
            trip: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!actor) {
      return NextResponse.json({ success: false, message: "Group not found" }, { status: 404 });
    }

    const isOwner = actor.group.ownerId === userId;
    const canInvite = isOwner || actor.role === "admin";

    if (!canInvite) {
      return NextResponse.json(
        { success: false, message: "Only owner/admin can invite members" },
        { status: 403 }
      );
    }

    const parsed = inviteMembersSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalized = parsed.data.members.map((member) => ({
      email: member.email.trim().toLowerCase(),
      name: member.name?.trim() || member.email.split("@")[0],
      role: member.role || "member",
    }));

    const uniqueByEmail = Array.from(new Map(normalized.map((item) => [item.email, item])).values());
    const emails = uniqueByEmail.map((item) => item.email);

    const [existingMembers, existingUsers] = await Promise.all([
      db.expenseGroupMember.findMany({
        where: {
          groupId,
          email: { in: emails },
        },
        select: { email: true },
      }),
      db.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true, name: true },
      }),
    ]);

    const existingMemberEmails = existingMembers as ExistingMemberEmailRow[];

    const existingEmailSet = new Set(existingMemberEmails.map((member: ExistingMemberEmailRow) => member.email));
    const userByEmail = new Map(
      existingUsers.map((user: ExistingUserRow) => [user.email.toLowerCase(), user])
    );

    const recordsToCreate = uniqueByEmail
      .filter((item) => !existingEmailSet.has(item.email))
      .map((item) => {
        const user = userByEmail.get(item.email);
        return {
          groupId,
          userId: user?.id,
          email: item.email,
          name: user?.name?.trim() || item.name,
          role: item.role,
          status: user ? "accepted" : "pending",
          invitedById: userId,
          joinedAt: user ? new Date() : null,
        };
      });

    if (recordsToCreate.length === 0) {
      return NextResponse.json(
        { success: false, message: "All provided emails are already members" },
        { status: 409 }
      );
    }

    await db.expenseGroupMember.createMany({ data: recordsToCreate });

    const createdMembers = (await db.expenseGroupMember.findMany({
      where: {
        groupId,
        email: { in: recordsToCreate.map((record) => record.email) },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        joinedAt: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
    })) as GroupMemberRow[];

    const memberByEmail = new Map(createdMembers.map((member) => [member.email, member]));

    const acceptedUsers = recordsToCreate.filter((member) => member.userId);

    if (acceptedUsers.length > 0) {
      await db.notification.createMany({
        data: acceptedUsers.map((member) => ({
          userId: String(member.userId),
          type: "expense",
          title: `You were added to ${actor.group.name}`,
          message: `You can now collaborate on expenses for ${actor.group.trip.title}.`,
          link: `/expenses?groupId=${groupId}`,
        })),
      });
    }

    const inviterName = session.user.name || session.user.email || "A group admin";
    recordsToCreate.forEach((member) => {
      const createdMember = memberByEmail.get(member.email);
      const baseUrl = process.env.NEXTAUTH_URL || "";
      const invitePath = createdMember ? `/expenses?inviteId=${createdMember.id}` : "/expenses";
      const inviteUrl = baseUrl ? `${baseUrl}${invitePath}` : invitePath;

      sendGroupInviteEmail(
        member.email,
        inviterName,
        actor.group.name,
        actor.group.trip.title,
        inviteUrl
      ).catch((err) => {
        console.error(`Failed to send invite email to ${member.email}:`, err);
      });
    });

    const members = (await db.expenseGroupMember.findMany({
      where: { groupId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        joinedAt: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    })) as GroupMemberRow[];

    return NextResponse.json(
      {
        success: true,
        message: "Members invited successfully",
        members,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite members error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
