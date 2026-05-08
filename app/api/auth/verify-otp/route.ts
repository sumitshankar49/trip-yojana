import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/config/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
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
        { success: false, message: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "OTP verified successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
