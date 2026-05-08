import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/config/prisma";
import { sendWelcomeEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { email, password, name } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || "",
      },
    });

    // Send welcome email (non-blocking — don't fail registration if email fails)
    try {
      sendWelcomeEmail(newUser.email, newUser.name || "").catch((err) =>
        console.error("Welcome email error:", err)
      );
    } catch (emailErr) {
      console.error("Welcome email setup error:", emailErr);
    }

    // Return success response (exclude password)
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Handle Prisma unique constraint errors
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Handle database connection errors
    if (error && typeof error === "object" && "code" in error && error.code === "P1001") {
      return NextResponse.json(
        { success: false, message: "Database connection error. Please contact support or try again later." },
        { status: 503 }
      );
    }

    // Generic error
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
