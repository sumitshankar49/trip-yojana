import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

const updateInviteSchema = z.object({
  memberId: z.string().min(1),
  action: z.enum(["accept", "decline"]),
});

type InviteRow = {
  id: string;
  groupId: string;
  userId: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  group: {
    id: string;
    name: string;
    trip: {
      id: string;
      title: string;
      destination: string;
    };
  };
};

type DbClient = {
  expenseGroupMember: {
    updateMany: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<InviteRow[]>;
    findFirst: (args: unknown) => Promise<InviteRow | null>;
    update: (args: unknown) => Promise<unknown>;
  };
  notification: {
    findMany: (args: unknown) => Promise<Array<{ link: string | null }>>;
    createMany: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
};

const db = prisma as unknown as DbClient;

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : "";
    const userEmail = session?.user?.email?.trim().toLowerCase() || "";

    if (!userId || !userEmail) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await db.expenseGroupMember.updateMany({
      where: {
        email: userEmail,
        status: "pending",
        userId: null,
      },
      data: {
        userId,
      },
    });

    const invites = await db.expenseGroupMember.findMany({
      where: {
        email: userEmail,
        status: "pending",
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            trip: {
              select: {
                id: true,
                title: true,
                destination: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (invites.length > 0) {
      const links = invites.map((invite) => `/expenses?inviteId=${invite.id}`);
      const existing = await db.notification.findMany({
        where: {
          userId,
          link: { in: links },
        },
        select: { link: true },
      });

      const existingLinks = new Set(existing.map((item) => item.link).filter(Boolean));
      const pendingNotifications = invites
        .filter((invite) => !existingLinks.has(`/expenses?inviteId=${invite.id}`))
        .map((invite) => ({
          userId,
          type: "expense",
          title: `Invite to ${invite.group.name}`,
          message: `You have a pending invite for trip ${invite.group.trip.title}.`,
          link: `/expenses?inviteId=${invite.id}`,
        }));

      if (pendingNotifications.length > 0) {
        await db.notification.createMany({ data: pendingNotifications });
      }
    }

    return NextResponse.json({ success: true, invites }, { status: 200 });
  } catch (error) {
    console.error("Get pending expense invites error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? String(session.user.id) : "";
    const userEmail = session?.user?.email?.trim().toLowerCase() || "";

    if (!userId || !userEmail) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateInviteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { memberId, action } = parsed.data;

    const invite = await db.expenseGroupMember.findFirst({
      where: {
        id: memberId,
        email: userEmail,
        status: "pending",
      },
      include: {
        group: {
          select: {
            id: true,
            ownerId: true,
            name: true,
            trip: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ success: false, message: "Invite not found" }, { status: 404 });
    }

    if (action === "decline") {
      await db.expenseGroupMember.update({
        where: { id: memberId },
        data: {
          status: "declined",
          userId,
        },
      });

      await db.notification.create({
        data: {
          userId: invite.group.ownerId,
          type: "expense",
          title: `Invite declined in ${invite.group.name}`,
          message: `${userEmail} declined the invite for ${invite.group.trip.title}.`,
          link: `/expenses?groupId=${invite.group.id}`,
        },
      });

      return NextResponse.json(
        { success: true, message: "Invite declined", groupId: invite.group.id },
        { status: 200 }
      );
    }

    await db.expenseGroupMember.update({
      where: { id: memberId },
      data: {
        status: "accepted",
        userId,
        joinedAt: new Date(),
      },
    });

    await db.notification.createMany({
      data: [
        {
          userId,
          type: "expense",
          title: `Joined ${invite.group.name}`,
          message: `You are now a member of this expense group for ${invite.group.trip.title}.`,
          link: `/expenses?groupId=${invite.group.id}`,
        },
        {
          userId: invite.group.ownerId,
          type: "expense",
          title: `Member joined ${invite.group.name}`,
          message: `${userEmail} accepted the invite for ${invite.group.trip.title}.`,
          link: `/expenses?groupId=${invite.group.id}`,
        },
      ],
    });

    return NextResponse.json(
      { success: true, message: "Invite accepted", groupId: invite.group.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update expense invite error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}