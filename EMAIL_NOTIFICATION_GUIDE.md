# Email Notification System: Complete Diagnosis & Fixes

## Summary of Email Notification Issues & Solutions

### The Problem You Were Experiencing

Email notifications weren't working due to **multiple layered issues**:

1. **Missing RESEND_API_KEY Environment Variable**
   - Without this, the Resend client couldn't initialize
   - Silent failures because errors weren't logged

2. **Potential Base URL Issues**
   - `NEXT_PUBLIC_BASE_URL` might be undefined or incorrect
   - The internal fetch call to `/api/request/notify` could fail silently

3. **Silent Failure Handling**
   - Email errors were caught but only logged to console
   - No structured logging to track failures
   - Requests would succeed even if emails completely failed

4. **No Admin Email Fallback**
   - If no admins existed in profiles table, notification request would succeed but do nothing
   - No warning to indicate the issue

---

## What Was Fixed

### Fix #1: Structured Logging ✅

**Before:**
```typescript
console.error('Failed to send admin notifications:', emailError)
// → Lost in console output, hard to trace
```

**After:**
```typescript
logger.error({ error, requestId }, 'Failed to send admin notifications')
// → Structured JSON logs, easy to query and alert on
```

### Fix #2: Explicit Error Tracking ✅

**Before:**
```typescript
await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/request/notify`, {
  // ... fetch call
}).catch(err => console.error('Failed:', err))
// → Errors logged but not tracked
```

**After:**
```typescript
try {
  await fetch(`${baseUrl}/api/request/notify`, {
    // ... fetch call
  })
  logger.info({ requestId, adminCount }, 'Notification email sent')
} catch (emailError) {
  logger.error({ error: emailError, requestId }, 'Failed to send notifications')
}
```

### Fix #3: Admin Email Fallback Handling ✅

**Before:**
```typescript
const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || []
if (adminEmails.length === 0) {
  // Silently continues with empty array
}
```

**After:**
```typescript
if (adminEmails.length === 0) {
  logger.warn('No admin emails found in profiles table - notification will not be sent')
  // Now you get a warning!
}
```

### Fix #4: Base URL Validation ✅

**Before:**
```typescript
await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/request/notify`, ...)
// Could be undefined, causing wrong URL
```

**After:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
await fetch(`${baseUrl}/api/request/notify`, ...)
// Always has a value
```

### Fix #5: Resend Initialization Logging ✅

**Before:**
```typescript
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}
```

**After:**
```typescript
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error('RESEND_API_KEY environment variable is not set')
    logger.error({ error }, 'Resend API key is missing')
    throw error
  }
  return new Resend(process.env.RESEND_API_KEY)
}
```

---

## How to Verify Email Notifications Are Working

### Step 1: Set Environment Variables

Create or update `.env.local`:

```env
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key

# Required for Resend email
RESEND_API_KEY=re_...your-key

# Application URL (critical for email links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional but helpful
TIMEZONE=Asia/Bangkok
LOG_LEVEL=debug
```

### Step 2: Ensure Admin Exists in Database

```sql
-- Check if admin profile exists
SELECT id, email, role FROM profiles WHERE role = 'admin' LIMIT 1;

-- If not, create one (assuming user exists with id=user-id)
INSERT INTO profiles (id, role, email)
VALUES ('user-id', 'admin', 'suboccardindonesia@gmail.com')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Step 3: Start Dev Server with Logging

```bash
npm install  # Install new dependencies (zod, pino, etc.)
npm run dev  # Start with LOG_LEVEL=debug to see detailed logs
```

### Step 4: Test Email Delivery

**Option A: Send Test Email via HTTP**

```bash
# GET request
curl "http://localhost:3000/api/admin/notify-test?email=your-email@example.com"

# OR POST request
curl -X POST http://localhost:3000/api/admin/notify-test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

**Option B: Submit Actual Request**

1. Go to `http://localhost:3000`
2. Fill out the form with:
   - Name: Test User
   - Email: your-email@example.com
   - Location: Test Location
   - Problem: This is a test
   - Date: Tomorrow
   - Hours: 2
3. Click Submit
4. Watch server logs for email delivery logs

### Step 5: Verify Email Sent

Check in this order:

1. **Server Logs** (look for):
   ```
   Approval notification email sent successfully: {result: "..."
   // or
   Failed to send approval notification email: ...
   ```

2. **Browser Console** (if error):
   ```
   Check DevTools → Console for any fetch errors
   ```

3. **Your Email Inbox**
   - Wait 1-2 minutes
   - Check spam folder
   - Look for email from `onboarding@resend.dev`

4. **Resend Dashboard**
   - Go to https://resend.com
   - Click "Emails" tab
   - Search for your email address
   - Check delivery status

---

## Email Flow Diagram

```
1. User submits request
   ↓
2. POST /api/request
   ↓
3. Insert into Supabase
   ↓
4. Query for admin emails
   ↓
5. Fetch POST /api/request/notify
   ↓
6. POST /api/request/notify
   ↓
7. For each admin email:
   ├─ Call sendApprovalNotificationEmail()
   ├─ Initialize Resend client
   ├─ Send email via Resend API
   ├─ Log result (success or error)
   └─ Continue to next email (even if one fails)
   ↓
8. Admin receives email with "Review & Approve Request" link
```

---

## Troubleshooting Checklist

### Symptom: "No emails received"

**Diagnosis Steps:**
- [ ] Check server logs for email error messages
- [ ] Verify `RESEND_API_KEY` is set: `echo $RESEND_API_KEY` (should output `re_...`)
- [ ] Verify `NEXT_PUBLIC_BASE_URL` is correct: `echo $NEXT_PUBLIC_BASE_URL`
- [ ] Restart dev server after changing `.env.local`
- [ ] Check Resend dashboard for API quota/errors
- [ ] Verify admin profile exists with email

**Fix:**
```bash
# 1. Verify env vars
cat .env.local | grep -E "RESEND|BASE_URL|SUPABASE"

# 2. Check database
# In Supabase dashboard, run: SELECT * FROM profiles WHERE role='admin';

# 3. Restart dev server
npm run dev

# 4. Test with debug script
npm run build  # Check for TypeScript errors
```

### Symptom: "Supabase configuration missing"

**Cause:** `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing

**Fix:**
```bash
# Add to .env.local
echo 'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co' >> .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...' >> .env.local

# Restart dev server
npm run dev
```

### Symptom: "RESEND_API_KEY environment variable is not set"

**Cause:** `RESEND_API_KEY` not in environment

**Fix:**
```bash
# Get key from https://resend.com/api-keys
# Add to .env.local
echo 'RESEND_API_KEY=re_your_actual_key' >> .env.local

# Restart dev server
npm run dev
```

### Symptom: "Request succeeds but no email sent, no error logged"

**Cause:** Email sent to admin but no admin profile exists

**Fix:**
```sql
-- In Supabase SQL Editor, check if admin exists
SELECT id, email, role FROM profiles;

-- If empty, check auth users
SELECT id, email FROM auth.users LIMIT 5;

-- Create admin profile for a user
INSERT INTO profiles (id, role, email)
SELECT id, 'admin', email FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;
```

### Symptom: Email received but with broken links

**Cause:** `NEXT_PUBLIC_BASE_URL` incorrect in email

**Fix:**
```bash
# Check what URL was put in email:
grep "NEXT_PUBLIC_BASE_URL" .env.local

# Update if needed:
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Development
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # Production

# Restart and resend test email
npm run dev
curl "http://localhost:3000/api/admin/notify-test?email=test@example.com"
```

---

## Email Configuration Verification

### Resend Setup

1. Sign up at https://resend.com
2. Create API key: https://resend.com/api-keys
3. Key should start with `re_`
4. Add to `.env.local`: `RESEND_API_KEY=re_...`

### From Address

All emails send from: `onboarding@resend.dev`

To use custom domain:
1. Verify domain in Resend dashboard
2. Update `from` in email functions
3. Configure DKIM/SPF records

### Bounce Handling

If emails bounce:
1. Check Resend dashboard for bounce notifications
2. Verify email addresses in database are valid
3. Check spam/junk folder first

---

## Production Deployment

### Before Going Live

1. **Verify Resend Account**
   - [ ] API key is active and not revoked
   - [ ] Account is in good standing
   - [ ] No rate limits set too low

2. **Set Environment Variables in Vercel**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] `RESEND_API_KEY` (as secret)
   - [ ] `NEXT_PUBLIC_BASE_URL=https://yourdomain.com`

3. **Test in Staging**
   - [ ] Deploy to staging environment
   - [ ] Submit test request
   - [ ] Verify email received
   - [ ] Check Resend dashboard

4. **Monitor in Production**
   - [ ] Watch Resend dashboard for delivery issues
   - [ ] Set up alerts for bounced emails
   - [ ] Monitor error logs for email failures

---

## Files Modified for Email Fixes

- **lib/emailService.ts** - Enhanced with structured logging and error handling
- **app/api/request/route.ts** - Added validation, logging, and fallback handling
- **app/api/request/notify/route.ts** - Improved error tracking and parallel email sending
- **app/api/admin/notify-test/route.ts** - New test endpoint for diagnosing email issues
- **lib/logger.ts** - New structured logging system
- **lib/schemas.ts** - Input validation schemas

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Update `.env.local` with RESEND_API_KEY
3. ✅ Verify admin profile exists in database
4. ✅ Start dev server: `npm run dev`
5. ✅ Test email: `curl "http://localhost:3000/api/admin/notify-test?email=you@example.com"`
6. ✅ Monitor logs with `LOG_LEVEL=debug` for debugging

---

## Still Having Issues?

Check the [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) and [ENV_SETUP.md](ENV_SETUP.md) for comprehensive documentation on all systems.

**Pro Tip:** Enable debug logging to see exactly what's happening:

```bash
LOG_LEVEL=debug npm run dev
```

This will show:
- Every API call
- Database queries
- Email sending attempts
- Auth checks
- Validation errors
- Rate limit checks
