import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
}

const FROM_ADDRESS = process.env.RESEND_FROM ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXTAUTH_URL ?? "";

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const displayName = name?.trim() || "Traveler";

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Welcome to TripYojana! 🌍",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 32px 32px 24px; text-align: center;">
          <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 12px;">TripYojana</h1>
          <p style="color: #cffafe; font-size: 15px; margin: 0;">Travel Planning Made Easy</p>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #0891b2; font-size: 22px; margin: 0 0 16px;">Welcome aboard, ${displayName}! 🎉</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            We're thrilled to have you join the TripYojana family. Your account is all set and ready to go!
          </p>
          <div style="background: #f0fdff; border-left: 4px solid #0891b2; border-radius: 8px; padding: 20px 24px; margin: 0 0 28px;">
            <p style="color: #0e7490; font-weight: bold; margin: 0 0 12px; font-size: 15px;">Here's what you can do with TripYojana:</p>
            <ul style="color: #374151; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
              <li>🗺️ Plan and organize your trips end-to-end</li>
              <li>📅 Build detailed day-by-day itineraries</li>
              <li>💰 Track your travel budget and expenses</li>
              <li>📍 Explore destinations on an interactive map</li>
              <li>🔔 Get smart notifications for your upcoming trips</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 0 0 28px;">
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.5px;">Start Planning Your Trip →</a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
            If you have any questions, feel free to reach out to us.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} TripYojana. Happy Travels! ✈️</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "TripYojana - Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 28px 32px 20px; text-align: center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:bold;margin:0 0 10px;">TripYojana</h1>
          <p style="color: #cffafe; font-size: 14px; margin: 0;">Travel Planning Made Easy</p>
        </div>
        <div style="padding: 36px 32px;">
          <h2 style="color: #0891b2; margin: 0 0 10px; font-size: 20px;">Password Reset Request</h2>
          <p style="color: #374151; margin-bottom: 24px; font-size: 15px; line-height: 1.6;">Use the OTP below to reset your TripYojana password. It expires in <strong>10 minutes</strong>.</p>
          <div style="background: #f0fdff; border: 2px solid #0891b2; border-radius: 10px; text-align: center; padding: 28px 16px; margin-bottom: 24px;">
            <span style="font-size: 44px; font-weight: bold; letter-spacing: 14px; color: #0891b2;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div style="background: #f9fafb; padding: 18px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} TripYojana. Happy Travels! ✈️</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}
