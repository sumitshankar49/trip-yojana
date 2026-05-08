# Email Service Troubleshooting Guide

## Current Issue: Emails Not Being Received

### Configuration Status
- **Email Service**: Resend
- **API Key**: Set in `.env.local` as `RESEND_API_KEY`
- **FROM Address**: `onboarding@resend.dev` (Resend test email)
- **Package Version**: resend ^6.12.2

### Quick Diagnostic Steps

#### 1. Verify API Key
The current API key is: `re_W2JU3RkR_4yv58pD5VoyWtxP76yPvS5tE`

**Action Required:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Check if this API key is valid and active
3. If it's a test key, replace it with your production key

#### 2. Test Email Sending
Use the test endpoint I just created:

```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Or use this from your browser console on the app:
```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com' })
}).then(r => r.json()).then(console.log);
```

#### 3. Check Server Logs
After attempting to send an email (registration, forgot password, etc.), check the terminal output for:
- `[Mailer] Attempting to send...` - Confirms the function is being called
- `[Mailer] ... email sent successfully` - Confirms successful send
- `[Mailer] Failed to send...` - Shows the specific error

#### 4. Common Issues & Solutions

**Issue: "Missing env var: RESEND_API_KEY"**
- Solution: Check that `.env.local` exists and contains `RESEND_API_KEY=your_key`
- Restart the dev server after adding/changing env vars

**Issue: "Failed to send email: Invalid API key"**
- Solution: Your API key is invalid or expired
- Generate a new one from [Resend Dashboard](https://resend.com/api-keys)

**Issue: "Failed to send email: Domain not verified"**
- Solution: With the free Resend plan, you can only send from:
  - `onboarding@resend.dev` (test emails)
  - Your verified domain
- If using a custom domain (e.g., `noreply@yourdomain.com`), you must verify it in Resend first

**Issue: Emails go to spam**
- With `onboarding@resend.dev`, emails often go to spam
- Solution: Set up your own domain and verify it in Resend

#### 5. Environment Variables Checklist

Check your `.env.local` file has:
```env
RESEND_API_KEY=re_YourActualAPIKey
RESEND_FROM=onboarding@resend.dev
NEXTAUTH_URL=http://localhost:3001
```

#### 6. Getting a Valid Resend API Key

1. Sign up at [Resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Give it "Sending access" permission
5. Copy the key and update `.env.local`
6. Restart the server

### Testing Each Email Type

#### Welcome Email (Registration)
```bash
# Register a new user via the UI or API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

#### OTP Email (Forgot Password)
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### Password Reset Success Email
```bash
# After receiving OTP, reset password
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "newpassword123"
  }'
```

#### Expense Member Invite Email
1. Create a trip
2. Add an expense with an email in the `splitWith` field
3. Check logs for email sending confirmation

### Enhanced Logging

I've added comprehensive logging to all email functions. When an email is sent (or fails), you'll see:

```
[Mailer] Attempting to send welcome email to: user@example.com
[Mailer] FROM_ADDRESS: onboarding@resend.dev
[Mailer] RESEND_API_KEY exists: true
[Mailer] Welcome email sent successfully to: user@example.com (ID: abc123)
```

Or if it fails:
```
[Mailer] Failed to send welcome email to user@example.com: Invalid API key
```

### Next Steps

1. **Test the endpoint**: Run the test email endpoint to see if basic sending works
2. **Check logs**: Look for `[Mailer]` logs in your terminal
3. **Verify API key**: Make sure your Resend API key is valid
4. **Check spam folder**: Emails from `onboarding@resend.dev` often go to spam
5. **Verify email addresses**: Make sure you're using valid, reachable email addresses

### Production Recommendations

For production, you should:
1. Use your own domain (e.g., `noreply@yourdomain.com`)
2. Verify the domain in Resend
3. Set up SPF, DKIM, and DMARC records
4. Use a production API key (not the test one)

### Support

If issues persist:
1. Check [Resend Status](https://resend.com/status)
2. Review [Resend Docs](https://resend.com/docs)
3. Check [Resend Logs](https://resend.com/emails) in your dashboard
