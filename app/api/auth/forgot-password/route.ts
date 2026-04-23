import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/backend/config/db";
import User from "@/backend/models/User";
import { sendOTPEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent user enumeration
    if (!user) {
      console.log(`[forgot-password] No user found for email: ${email.toLowerCase()}`);
      return NextResponse.json(
        { success: true, message: "If this email exists, an OTP has been sent." },
        { status: 200 }
      );
    }

    console.log(`[forgot-password] User found: ${user.email} — sending OTP...`);

    // Generate a 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(user.email, otp);
    console.log(`[forgot-password] OTP email sent successfully to: ${user.email}`);

    return NextResponse.json(
      { success: true, message: "OTP sent to your email address." },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[forgot-password] Error:", message);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
