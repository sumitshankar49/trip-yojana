# TripYojana Email Notification System

## Overview
Your TripYojana application now has a comprehensive email notification system that keeps users informed throughout their journey. All emails are sent using Resend API.

## 📧 Email Features Implemented

### 1. **Welcome Email (Onboarding)** ✅
**Trigger:** When a user successfully signs up/registers

**Location:** `app/api/auth/register/route.ts`

**Features:**
- Professional welcome message with branding
- Overview of TripYojana features
- Call-to-action button to start planning
- Sent automatically after successful registration
- Non-blocking (doesn't delay the signup response)

**What the user receives:**
```
Subject: Welcome to TripYojana! 🌍
- Personalized greeting
- Feature highlights (itineraries, budget tracking, maps, etc.)
- "Start Planning Your Trip" button linking to dashboard
```

---

### 2. **Password Reset OTP Email** ✅
**Trigger:** When a user requests to reset their password

**Location:** `app/api/auth/forgot-password/route.ts`

**Features:**
- Secure 6-digit OTP code
- 10-minute expiration time
- Professional formatting with clear instructions
- Security reminder if request wasn't made by user

**What the user receives:**
```
Subject: TripYojana - Password Reset OTP
- Large, easy-to-read 6-digit OTP
- Clear expiration notice (10 minutes)
- Security instructions
```

---

### 3. **Password Reset Success Confirmation** ✅
**Trigger:** After user successfully resets their password

**Location:** `app/api/auth/reset-password/route.ts`

**Features:**
- Confirmation that password was changed
- Security alert with contact information
- Login button for immediate access
- Non-blocking (doesn't delay the reset response)

**What the user receives:**
```
Subject: TripYojana - Password Reset Successful ✓
- Success confirmation
- Security warning if change wasn't made by user
- "Login to Your Account" button
```

---

### 4. **Expense Member Invitation Email** ✅
**Trigger:** When a member is added to an expense (via email)

**Location:** 
- `app/api/expenses/route.ts` (on creation)
- `app/api/expenses/[id]/route.ts` (on update)

**Features:**
- Notifies members when added to split an expense
- Shows complete expense details
- Includes trip name and inviter information
- Only sends to valid email addresses
- Non-blocking (doesn't delay expense creation/update)

**What the user receives:**
```
Subject: You've been added to an expense for [Trip Name]
- Who added them
- Trip name
- Expense details:
  * Title
  * Amount (formatted in INR)
  * Category
  * Date
- Call-to-action to view and settle
- Sign-up link for non-members
```

---

## 🔧 Technical Implementation

### Email Service Configuration

**Provider:** Resend (https://resend.com)

**Required Environment Variables:**
```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM=your-email@yourdomain.com
NEXTAUTH_URL=http://localhost:3000
```

### Email Templates Location
All email functions are centralized in: `/backend/lib/mailer.ts`

**Available Functions:**
1. `sendWelcomeEmail(email, name)` - Onboarding
2. `sendOTPEmail(email, otp)` - Password reset OTP
3. `sendPasswordResetSuccessEmail(email, name)` - Password change confirmation
4. `sendExpenseMemberInviteEmail(email, inviterName, tripTitle, expenseDetails)` - Expense notifications

---

## 🎨 Email Design Features

All emails include:
- ✅ Responsive design (mobile-friendly)
- ✅ Professional TripYojana branding
- ✅ Gradient headers with cyan/teal theme
- ✅ Clear call-to-action buttons
- ✅ Consistent footer with copyright
- ✅ Travel-themed emojis (✈️ 🌍 💰 📍)
- ✅ Proper typography and spacing
- ✅ Formatted amounts in Indian Rupees (₹)

---

## 🚀 How To Use

### For Expense Member Invitations

When creating or updating an expense, simply include email addresses in the `splitWith` array:

```javascript
// Example API call
POST /api/expenses
{
  "tripId": 1,
  "title": "Hotel Booking",
  "amount": 5000,
  "category": "accommodation",
  "splitWith": [
    "member1@example.com",
    "member2@example.com",
    "John Doe"  // Non-email entries are skipped
  ],
  "date": "2026-05-10",
  "notes": "Three nights at resort"
}
```

**Email Sending Logic:**
- ✅ Only valid email addresses receive invitations
- ✅ Names/usernames without @ are skipped automatically
- ✅ When updating, only **newly added** members receive emails
- ✅ Existing members don't get duplicate notifications
- ✅ All email sending is asynchronous (non-blocking)

---

## 🔒 Security & Best Practices

1. **Non-Blocking Emails:** All email sending is asynchronous. If email fails, the main operation still succeeds
2. **Error Handling:** Email failures are logged but don't break the user experience
3. **Privacy:** OTP emails don't reveal if a user exists (security best practice)
4. **Validation:** All email addresses are validated before sending
5. **Rate Limiting:** Respects Resend's rate limits
6. **Timeout:** OTPs expire after 10 minutes for security

---

## 📊 Email Sending Flow

```
User Action → API Endpoint → Database Operation → Email Queue → Resend API
                                     ↓
                              Return Success Response
                              (Don't wait for email)
```

---

## 🧪 Testing

### Test Welcome Email
1. Register a new user with your email
2. Check inbox for welcome email

### Test Password Reset
1. Click "Forgot Password"
2. Enter your email
3. Check inbox for OTP
4. Complete reset
5. Check inbox for success confirmation

### Test Expense Invitation
1. Create a trip
2. Add an expense
3. Include valid email addresses in "Split With"
4. Those emails receive invitation

---

## 🎯 Future Enhancements (Ideas)

- [ ] Trip invitation emails
- [ ] Itinerary change notifications
- [ ] Budget limit alerts
- [ ] Weekly trip summary emails
- [ ] Expense settlement reminders
- [ ] Trip starting soon reminders

---

## 🆘 Troubleshooting

### Email Not Sending?

1. **Check Environment Variables:**
   ```bash
   # Verify in .env.local
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM=onboarding@yourdomain.com
   ```

2. **Check Resend Dashboard:**
   - Log into Resend dashboard
   - Check email logs
   - Verify domain/sender configuration

3. **Check Application Logs:**
   ```bash
   # Look for error messages like:
   "Welcome email error:"
   "Password reset success email error:"
   "Failed to send expense invite email to"
   ```

4. **Verify Email Format:**
   - Must be valid email format
   - Must pass regex validation

---

## 📝 Notes

- All emails use HTML templates for professional appearance
- Emails are optimized for both desktop and mobile viewing
- Indian Rupee (₹) formatting for all monetary values
- Consistent branding across all email types
- All timestamps and dates are properly formatted

---

## 🔗 Related Files

- Email templates: `/backend/lib/mailer.ts`
- Registration: `/app/api/auth/register/route.ts`
- Password reset: `/app/api/auth/forgot-password/route.ts`
- Password reset success: `/app/api/auth/reset-password/route.ts`
- Expense creation: `/app/api/expenses/route.ts`
- Expense updates: `/app/api/expenses/[id]/route.ts`

---

**Last Updated:** May 8, 2026
**Version:** 1.0.0
