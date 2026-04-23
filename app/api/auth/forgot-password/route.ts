import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/backend/config/db";
import User from "@/backend/models/User";
import { sendOTPEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Check email service config eagerly before doing any DB work
  if (!process.env.RESEND_API_KEY) {
    console.error("[forgot-password] Missing env var: RESEND_API_KEY");
    return NextResponse.json(
      { success: false, message: "Email service is not configured. Contact support." },
      { status: 500 }
    );
  }

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

    try {
      await sendOTPEmail(user.email, otp);
      console.log(`[forgot-password] OTP email sent successfully to: ${user.email}`);
    } catch (mailError) {
      const mailMsg = mailError instanceof Error ? mailError.message : String(mailError);
      console.error(`[forgot-password] SMTP error for ${user.email}:`, mailMsg);
      return NextResponse.json(
        { success: false, message: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "OTP sent to your email address." },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[forgot-password] DB/server error:", message);
    return NextResponse.json(
      { success: false, message: "A server error occurred. Please try again." },
      { status: 500 }
    );
  }
}
