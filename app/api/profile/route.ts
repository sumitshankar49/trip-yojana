import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import prisma from "@/backend/config/prisma";

// GET - Fetch user profile
export async function GET() {
  try {
    // Resolve session via NextAuth server helper to avoid cookie decode edge cases.
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return NextResponse.json(
        {
          message: "Session expired. Please sign in again.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePhoto: true,
        city: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        name: user.name || "",
        email: user.email,
        phone: user.phone || "",
        profilePhoto: user.profilePhoto || "",
        city: user.city || "",
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return NextResponse.json(
        {
          message: "Session expired. Please sign in again.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, phone, profilePhoto, city } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        profilePhoto: profilePhoto?.trim() || "",
        city: city?.trim() || "",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePhoto: true,
        city: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        profilePhoto: updatedUser.profilePhoto || "",
        city: updatedUser.city || "",
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
