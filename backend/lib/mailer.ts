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
    subject: "TripYojana - Your Password Reset Code",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 24px; background: #eef4ff; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 32px rgba(2, 6, 23, 0.14);">
                <tr>
                  <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0f766e 100%); padding: 28px 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 0.3px;">TripYojana</h1>
                    <p style="margin: 8px 0 0; color: #d1fae5; font-size: 13px;">Password reset verification</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 34px 32px 20px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #0f172a; font-size: 22px; font-weight: 700;">Use this OTP to reset your password</p>
                    <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">This code is valid for 10 minutes. Please do not share it with anyone.</p>

                    <div style="display: inline-block; background: #ecfeff; border: 2px dashed #0891b2; border-radius: 12px; padding: 20px 24px; margin: 0 0 20px;">
                      <span style="font-size: 40px; letter-spacing: 12px; font-weight: 800; color: #0e7490;">${otp}</span>
                    </div>

                    <div style="background: #f8fafc; border-radius: 10px; padding: 14px 16px; margin: 0 auto 20px; max-width: 430px; text-align: left;">
                      <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6;">
                        If you did not request a password reset, you can safely ignore this email.
                      </p>
                    </div>

                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">Template version: OTP-V2</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 24px; border-top: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} TripYojana</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error(`[Mailer] Failed to send OTP email to ${email}:`, error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
  
  console.log(`[Mailer] OTP email sent successfully to: ${email}`, data ? `(ID: ${data.id})` : '');
}

export async function sendPasswordResetSuccessEmail(email: string, name: string): Promise<void> {
  const displayName = name?.trim() || "Traveler";
  
  console.log(`[Mailer] Attempting to send password reset success email to: ${email}`);

  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "TripYojana - Password Reset Successful ✓",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- Logo Header -->
                <tr>
                  <td style="background-color: #ffffff; padding: 30px 40px 20px; text-align: center; border-bottom: 3px solid #0891b2;">
                    <h2 style="margin: 0; color: #0891b2; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">TripYojana</h2>
                    <p style="margin: 8px 0 0; color: #64748b; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Travel Planning Made Easy</p>
                  </td>
                </tr>

                <!-- Hero Section with Animation -->
                <tr>
                  <td style="background: linear-gradient(180deg, #ffffff 0%, #f0fdff 100%); padding: 40px 40px 32px; text-align: center;">
                    <h1 style="color: #111827; font-size: 32px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.5px; line-height: 1.2;">Your Next Adventure<br/>Awaits!</h1>
                    <div style="margin: 32px 0;">
                      <img src="https://cdn.templates.unlayer.com/assets/1698215331967-Stay-Tuned2.gif" alt="Travel Adventure" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 12px;" />
                    </div>
                  </td>
                </tr>

                <!-- Success Message -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; padding: 28px 32px; text-align: center; margin-bottom: 32px;">
                      <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.25); border-radius: 50%; margin: 0 auto 16px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">Password Reset Successful</h2>
                    </div>

                    <p style="color: #111827; font-size: 16px; line-height: 1.7; margin: 0 0 12px; text-align: center;">
                      Hi <strong>${displayName}</strong>,
                    </p>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 12px; text-align: center;">
                      Your TripYojana password has been successfully reset. You can now log in with your new password.
                    </p>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0 0 32px; text-align: center;">
                      Get ready to plan amazing adventures and explore new destinations!
                    </p>

                    <!-- Security Warning -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 20px 24px; margin: 0 0 32px;">
                      <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.7; text-align: center;">
                        <strong style="font-size: 20px; vertical-align: middle;">🔒</strong> 
                        <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 0 0 24px;">
                          <a href="${APP_URL}/auth" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 18px 48px; border-radius: 12px; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(8, 145, 178, 0.4); text-transform: uppercase;">Login to Your Account →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
                    <!-- Social Media Icons -->
                    <div style="margin-bottom: 20px;">
                      <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #1877f2; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: bold;">f</span>
                      </a>
                      <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #1da1f2; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: bold;">𝕏</span>
                      </a>
                      <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #0077b5; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: bold;">in</span>
                      </a>
                      <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #e4405f; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: bold;">📷</span>
                      </a>
                    </div>

                    <!-- Footer Links -->
                    <div style="margin-bottom: 16px;">
                      <a href="${APP_URL}/unsubscribe" style="color: #e9d5ff; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Unsubscribe</a>
                      <span style="color: #e9d5ff; font-size: 12px;">|</span>
                      <a href="${APP_URL}/privacy" style="color: #e9d5ff; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Privacy Policy</a>
                      <span style="color: #e9d5ff; font-size: 12px;">|</span>
                      <a href="${APP_URL}" style="color: #e9d5ff; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Website</a>
                    </div>

                    <p style="color: #f3e8ff; font-size: 13px; margin: 0 0 4px; line-height: 1.6;">
                      Need help? Contact us anytime at support@tripyojana.com
                    </p>
                    <p style="color: #e9d5ff; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} TripYojana. Happy Travels! ✈️
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
