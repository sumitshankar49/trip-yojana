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

  console.log(`[Mailer] Attempting to send welcome email to: ${email}`);
  console.log(`[Mailer] FROM_ADDRESS: ${FROM_ADDRESS}`);
  console.log(`[Mailer] RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);

  const { data, error } = await getResend().emails.send({
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
    console.error(`[Mailer] Failed to send welcome email to ${email}:`, error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
  
  console.log(`[Mailer] Welcome email sent successfully to: ${email}`, data ? `(ID: ${data.id})` : '');
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  console.log(`[Mailer] Attempting to send OTP email to: ${email}`);
  console.log(`[Mailer] FROM_ADDRESS: ${FROM_ADDRESS}`);
  console.log(`[Mailer] RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
  
  const { data, error } = await getResend().emails.send({
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
    console.error(`[Mailer] Failed to send OTP email to ${email}:`, error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
  
  console.log(`[Mailer] OTP email sent successfully to: ${email}`, data ? `(ID: ${data.id})` : '');
}

export async function sendPasswordResetSuccessEmail(email: string, name: string): Promise<void> {
  const displayName = name?.trim() || "User";
  
  console.log(`[Mailer] Attempting to send password reset success email to: ${email}`);

  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "TripYojana - Password Reset Successful ✓",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 28px 32px 20px; text-align: center;">
          <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">✓</span>
          </div>
          <h1 style="color:#ffffff;font-size:24px;font-weight:bold;margin:0 0 10px;">Password Reset Successful</h1>
        </div>
        <div style="padding: 36px 32px;">
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Hi ${displayName},
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Your TripYojana password has been successfully reset. You can now log in with your new password.
          </p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
            <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.6;">
              🔒 If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
          <div style="text-align: center; margin: 0 0 20px;">
            <a href="${APP_URL}/auth" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.5px;">Login to Your Account →</a>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 18px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} TripYojana. Happy Travels! ✈️</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error(`[Mailer] Failed to send password reset success email to ${email}:`, error);
    throw new Error(`Failed to send password reset success email: ${error.message}`);
  }
  
  console.log(`[Mailer] Password reset success email sent to: ${email}`, data ? `(ID: ${data.id})` : '');
}

export async function sendExpenseMemberInviteEmail(
  memberEmail: string,
  inviterName: string,
  tripTitle: string,
  expenseDetails: {
    title: string;
    amount: number;
    category: string;
    date: Date;
  },
  tripDetails?: {
    destination: string;
    source?: string;
    startDate: Date;
    endDate: Date;
  }
): Promise<void> {
  console.log(`[Mailer] Attempting to send expense invite email to: ${memberEmail}`);
  
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(expenseDetails.amount);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(expenseDetails.date));

  // Format trip dates and calculate duration
  let tripDatesHtml = '';
  if (tripDetails) {
    const tripStartDate = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(tripDetails.startDate));

    const tripEndDate = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(tripDetails.endDate));

    const durationMs = new Date(tripDetails.endDate).getTime() - new Date(tripDetails.startDate).getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;
    const durationText = durationDays === 1 ? '1 day' : `${durationDays} days`;

    tripDatesHtml = `
          <div style="background: #f0f9ff; border-radius: 12px; padding: 24px; margin: 0 0 24px; border: 1px solid #bae6fd;">
            <h3 style="color: #0369a1; font-size: 16px; margin: 0 0 16px; font-weight: bold;">🗓️ Trip Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${tripDetails.source ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #dbeafe;">From:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #dbeafe;">${tripDetails.source}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #dbeafe;">Destination:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #dbeafe;">${tripDetails.destination}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #dbeafe;">Start Date:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #dbeafe;">${tripStartDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #dbeafe;">End Date:</td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #dbeafe;">${tripEndDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Duration:</td>
                <td style="padding: 8px 0; color: #0891b2; font-size: 14px; font-weight: bold; text-align: right;">${durationText}</td>
              </tr>
            </table>
          </div>
    `;
  }

  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: memberEmail,
    subject: `You've been added to an expense for ${tripTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 32px 32px 24px; text-align: center;">
          <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 12px;">TripYojana</h1>
          <p style="color: #cffafe; font-size: 15px; margin: 0;">Expense Notification</p>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #0891b2; font-size: 22px; margin: 0 0 16px;">You've Been Added to an Expense! 💰</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            <strong>${inviterName}</strong> has added you as a member to split an expense for the trip: <strong>${tripTitle}</strong>
          </p>
          
          ${tripDatesHtml}
          
          <div style="background: #f0fdff; border-radius: 12px; padding: 24px; margin: 0 0 28px; border: 1px solid #cffafe;">
            <h3 style="color: #0e7490; font-size: 16px; margin: 0 0 16px; font-weight: bold;">Expense Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e0f2fe;">Title:</td>
                <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e0f2fe;">${expenseDetails.title}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e0f2fe;">Amount:</td>
                <td style="padding: 10px 0; color: #0891b2; font-size: 18px; font-weight: bold; text-align: right; border-bottom: 1px solid #e0f2fe;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e0f2fe;">Category:</td>
                <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e0f2fe;">${expenseDetails.category}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Date:</td>
                <td style="padding: 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 0 0 28px;">
            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
              💡 <strong>Action Required:</strong> Log in to your TripYojana account to view full details and settle your share of this expense.
            </p>
          </div>

          <div style="text-align: center; margin: 0 0 20px;">
            <a href="${APP_URL}/expenses" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.5px;">View Expense Details →</a>
          </div>
          
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
            Not a member yet? <a href="${APP_URL}/auth" style="color: #0891b2; text-decoration: none; font-weight: 600;">Sign up</a> to join this trip and manage expenses together!
          </p>
        </div>
        <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} TripYojana. Happy Travels! ✈️</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error(`[Mailer] Failed to send expense invite email to ${memberEmail}:`, error);
    throw new Error(`Failed to send expense member invite email: ${error.message}`);
  }
  
  console.log(`[Mailer] Expense invite email sent to: ${memberEmail}`, data ? `(ID: ${data.id})` : '');
}
