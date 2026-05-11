import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

type TripSummary = {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
};

type GroupMemberSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type GroupExpenseAmount = {
  id: string;
  amount: number;
};

type GroupListItem = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  currency: string;
  ownerId: string;
  trip: TripSummary;
  members: GroupMemberSummary[];
  expenses: GroupExpenseAmount[];
  createdAt: Date;
  updatedAt: Date;
};

type GroupCreateResult = {
  id: string;
  tripId: string;
  ownerId: string;
  name: string;
  description: string | null;
  currency: string;
  members: GroupMemberSummary[];
  createdAt: Date;
  updatedAt: Date;
};

type DbClient = {
  expenseGroup: {
    findMany: (args: unknown) => Promise<GroupListItem[]>;
    create: (args: unknown) => Promise<GroupCreateResult>;
  };
  trip: {
    findFirst: (args: unknown) => Promise<{ id: string; title: string } | null>;
  };
  user: {
    findUnique: (args: unknown) => Promise<{ id: string; email: string; name: string | null } | null>;
  };
};

const db = prisma as unknown as DbClient;

const createGroupSchema = z.object({
  tripId: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().or(z.literal("")),
  currency: z.string().length(3).optional(),
});

function toApiErrorResponse(error: unknown, fallbackPrefix: string) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed. Check DATABASE_URL and DB availability.",
      },
      { status: 500 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A group with this name already exists for the selected trip",
        },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return NextResponse.json(
        {
          success: false,
          message: "Database schema is out of sync. Run Prisma migrations.",
        },
        { status: 500 }
      );
    }
  }

  console.error(`${fallbackPrefix}:`, error);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = String(session.user.id);

    const groups = await db.expenseGroup.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                status: "accepted",
              },
            },
          },
        ],
      },
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
            name: true,
            email: true,
            role: true,
            status: true,
          },
          orderBy: { createdAt: "asc" },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const payload = groups.map((group) => ({
      id: group.id,
      tripId: group.tripId,
      name: group.name,
      description: group.description,
      currency: group.currency,
      ownerId: group.ownerId,
      trip: group.trip,
      members: group.members,
      memberCount: group.members.length,
      totalExpense: group.expenses.reduce(
        (sum: number, expense: { amount: number }) => sum + expense.amount,
        0
      ),
      expenseCount: group.expenses.length,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));

    return NextResponse.json({ success: true, groups: payload }, { status: 200 });
  } catch (error) {
    return toApiErrorResponse(error, "Get expense groups error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const parsed = createGroupSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid payload", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tripId, name, description, currency } = parsed.data;
    const userId = String(session.user.id);

    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    const ownerUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!ownerUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const group = await db.expenseGroup.create({
      data: {
        tripId,
        ownerId: userId,
        name: name.trim(),
        description: description?.trim() || null,
        currency: (currency || "INR").toUpperCase(),
        members: {
          create: {
            userId: ownerUser.id,
            email: ownerUser.email.toLowerCase(),
            name: ownerUser.name?.trim() || ownerUser.email,
            role: "owner",
            status: "accepted",
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense group created",
        group,
      },
      { status: 201 }
    );
  } catch (error) {
    return toApiErrorResponse(error, "Create expense group error");
  }
}
