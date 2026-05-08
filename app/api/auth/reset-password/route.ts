import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/config/prisma";
import { sendPasswordResetSuccessEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.resetOTP || !user.resetOTPExpiry) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (new Date() > user.resetOTPExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOTP: null,
          resetOTPExpiry: null,
        },
      });
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (user.resetOTP !== String(otp).trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOTP: null,
        resetOTPExpiry: null,
      },
    });

    // Send password reset success email (non-blocking)
    try {
      sendPasswordResetSuccessEmail(user.email, user.name || "").catch((err) =>
        console.error("Password reset success email error:", err)
      );
    } catch (emailErr) {
      console.error("Password reset success email setup error:", emailErr);
    }

    return NextResponse.json(
      { success: true, message: "Password reset successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
