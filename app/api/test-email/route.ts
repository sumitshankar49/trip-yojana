import { NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/backend/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    console.log(`[test-email] Testing email send to: ${email}`);
    
    // Send a test OTP email
    await sendOTPEmail(email, "123456");

    return NextResponse.json(
      { 
        success: true, 
        message: "Test email sent successfully! Check your inbox and spam folder.",
        details: {
          to: email,
          from: process.env.RESEND_FROM || "onboarding@resend.dev",
          apiKeyExists: !!process.env.RESEND_API_KEY
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[test-email] Error:", message, error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to send test email: ${message}`,
        error: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
