import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

// GET /api/notifications - Get all notifications for the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get filter from query params
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    const where = {
      userId: session.user.id,
      ...(filter === "unread" ? { isRead: false } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
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
    const { type, title, message, link } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "Type, title, and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type,
        title,
        message,
        link: link || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
