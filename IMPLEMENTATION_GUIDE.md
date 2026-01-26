# Implementation Guide: Security & Production-Readiness Updates

This guide documents all the security fixes and improvements implemented in this version.

## Overview of Changes

### Phase 1: Critical Security Fixes ✅

#### 1. Role-Based Access Control (RBAC)

**Issue:** Admin endpoints didn't verify user roles, allowing any authenticated user to approve requests.

**Solution:** Added `requireRole()` middleware in [lib/middleware.ts](lib/middleware.ts)

**Updated Routes:**
- `POST /api/admin/approvals/[id]` - Now requires `admin` or `approver` role
- `POST /api/admin/visits/[id]` - Now requires `admin` or `approver` role

**Usage:**
```typescript
const roleCheck = await requireRole(['admin', 'approver'])
if (roleCheck.error) {
  return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
}
const user = roleCheck.user!
```

#### 2. Server-Side Input Validation

**Issue:** Request submission accepted invalid data (empty strings, negative hours, malformed emails).

**Solution:** Added Zod schemas in [lib/schemas.ts](lib/schemas.ts)

**Schemas:**
- `createSiteVisitRequestSchema` - Validates new request submissions
- `approvalSchema` - Validates admin approvals
- `visitRecordingSchema` - Validates visit completions
- `visitConfirmationSchema` - Validates customer confirmations

**Usage in API Routes:**
```typescript
const validationResult = createSiteVisitRequestSchema.safeParse(body)
if (!validationResult.success) {
  return NextResponse.json(
    { message: 'Invalid request', errors: validationResult.error.errors },
    { status: 400 }
  )
}
```

#### 3. Email Notification Fixes

**Issue #1:** Email notifications failed silently if no admins existed in database

**Solution:** Added logging and warning when admin emails are empty

**Issue #2:** Email fetch used undefined `NEXT_PUBLIC_BASE_URL`

**Solution:** Added fallback URL construction and validation

**Issue #3:** No error tracking for email failures

**Solution:** All email operations now logged to structured logger

---

### Phase 2: Logging & Observability ✅

#### Structured Logging with Pino

Created [lib/logger.ts](lib/logger.ts) with:
- JSON logging in production
- Pretty-printed output in development
- Configurable log levels via `LOG_LEVEL` env var

**Usage:**
```typescript
import logger from '@/lib/logger'

logger.info({ requestId, status }, 'Request approved')
logger.warn({ userId, requiredRoles }, 'Unauthorized access attempt')
logger.error({ error, context }, 'Critical error occurred')
```

**Benefits:**
- Structured logs for better debugging
- Easy integration with log aggregation services (DataDog, Sentry, etc.)
- Production-grade observability

---

### Phase 3: Rate Limiting ✅

#### In-Memory Rate Limiter

Created [lib/rateLimit.ts](lib/rateLimit.ts) with:
- Per-IP rate limiting
- Configurable limits and time windows
- Automatic cleanup of expired entries

**Applied to:**
- `POST /api/request` - 10 requests per minute per IP

**Usage:**
```typescript
const rateLimit = await checkRateLimit(`request-submit:${clientIp}`, 10, 60 * 1000)
if (!rateLimit.success) {
  return NextResponse.json(
    { message: 'Too many requests' },
    { status: 429 }
  )
}
```

**Future Enhancement:**
For production at scale, replace with Redis-backed Upstash:
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(10, "1 m"),
})
```

---

### Phase 4: Configuration Management ✅

#### Configurable Timezone

Created [lib/timezone.ts](lib/timezone.ts) to support:
- Environment-based timezone configuration
- Default to `Asia/Bangkok` (Indonesia)
- Easy region expansion

**Usage:**
```typescript
const timezone = getTimezone()
const formattedDate = new Date(dateString).toLocaleDateString('en-US', {
  timeZone: timezone,
  // ...
})
```

**Environment Variable:**
```env
TIMEZONE=Asia/Bangkok  # or America/New_York, Europe/London, etc.
```

---

### Phase 5: CSRF Protection ✅

Created [lib/csrf.ts](lib/csrf.ts) with:
- Token generation using cryptographically secure random bytes
- HTTP-only, SameSite cookies
- Timing-safe token comparison

**Ready for Integration:**
1. Add CSRF token to form hidden fields in client components
2. Verify token in API routes before mutations
3. Examples provided in comments

**Implementation Pattern:**
```typescript
// In Server Component:
const token = await getOrCreateCSRFToken()

// In API Route:
const token = request.headers.get('x-csrf-token')
if (!await verifyCSRFToken(token)) {
  return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 })
}
```

---

## Updated API Routes

### POST /api/request - Request Submission
**Changes:**
- ✅ Input validation with Zod
- ✅ Rate limiting (10 req/min per IP)
- ✅ Structured logging
- ✅ Admin email fallback handling

### POST /api/admin/approvals/[id] - Approval
**Changes:**
- ✅ Role verification (admin/approver required)
- ✅ Input validation for approval data
- ✅ Configurable timezone for dates
- ✅ Comprehensive error logging

### POST /api/admin/visits/[id] - Visit Recording
**Changes:**
- ✅ Role verification (admin/approver required)
- ✅ Input validation for visit data
- ✅ Better email error handling

### POST /api/confirm-visit/[id] - Visit Confirmation
**Changes:**
- ✅ Input validation for confirmation data
- ✅ Structured error logging

### POST /api/request/notify - Admin Notifications
**Changes:**
- ✅ Request validation
- ✅ Per-email error handling
- ✅ Success/failure tracking
- ✅ Comprehensive logging

---

## Database Security (RLS)

Ensure Supabase Row Level Security (RLS) policies are in place:

### site_visit_requests Table
```sql
-- Allow anonymous to create requests
CREATE POLICY "Allow public to create requests" ON site_visit_requests
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own requests
CREATE POLICY "Users can view own requests" ON site_visit_requests
  FOR SELECT USING (requester_email = auth.jwt() ->> 'email');

-- Allow admins to view all requests
CREATE POLICY "Admins can view all requests" ON site_visit_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'approver')
    )
  );

-- Allow admins to update requests
CREATE POLICY "Admins can update requests" ON site_visit_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'approver')
    )
  );
```

---

## Deployment Checklist

Before deploying to production:

### Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Set `RESEND_API_KEY` in Vercel (secret)
- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Set `TIMEZONE` to your region
- [ ] Set `LOG_LEVEL=info` for production

### Supabase Configuration
- [ ] Enable RLS on all tables
- [ ] Create RLS policies (see above)
- [ ] Configure custom JWT claims for roles
- [ ] Set up admin user with correct role

### Email Service
- [ ] Verify Resend account is active
- [ ] Test email delivery with test endpoint
- [ ] Verify sender email domain
- [ ] Add DKIM/SPF records if using custom domain

### Security
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS if needed
- [ ] Enable rate limiting in middleware
- [ ] Regular security audits

### Monitoring
- [ ] Set up log aggregation (Sentry/DataDog)
- [ ] Create alerts for error rates
- [ ] Monitor email delivery rates
- [ ] Track failed authentications

---

## Testing Locally

### Setup
```bash
# Install dependencies
npm install

# Create .env.local with required variables
cp ENV_SETUP.md  # See file for template

# Start dev server
npm run dev
```

### Test Email Notifications
```bash
# Trigger a test email
curl -X POST http://localhost:3000/api/admin/notify-test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Check Resend dashboard for delivery status
```

### Test Role Verification
```bash
# Try to approve without admin role (should fail)
curl -X POST http://localhost:3000/api/admin/approvals/test-id \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
# Expected: 401 Unauthorized
```

### Test Rate Limiting
```bash
# Submit 11 requests rapidly (should fail on 11th)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/request \
    -H "Content-Type: application/json" \
    -d '{...}'
done
# Expected: 429 Too Many Requests after 10 requests
```

---

## Migration from Old Code

If upgrading from previous version:

### 1. Update Dependencies
```bash
npm install zod pino pino-pretty ratelimit
```

### 2. No Database Migrations Needed
- All changes are app-layer only
- Existing data is compatible

### 3. Test Authentication
- Verify admin accounts have correct roles in `profiles` table
- Check RLS policies are enabled

### 4. Verify Email Service
- Resend API key is correct
- Domain verification completed (if using custom domain)

---

## Production Monitoring

### Key Metrics to Track
1. **Error Rate**: Monitor API error responses
2. **Email Delivery**: Track Resend delivery status
3. **Auth Failures**: Watch for suspicious login attempts
4. **Rate Limit Hits**: Indicates potential abuse or legitimate traffic spike
5. **Response Times**: Ensure email notifications don't block request handling

### Sample Sentry Integration
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.captureException(error, {
  tags: {
    requestId: id,
    userId: user.id,
  },
})
```

---

## Next Steps

1. **Testing**: Run full end-to-end test of all workflows
2. **Staging Deployment**: Deploy to staging environment first
3. **Load Testing**: Verify rate limiting works under load
4. **Email Testing**: Send test emails through production pipeline
5. **Production Deployment**: Deploy with confidence

---

## Support & Troubleshooting

### Common Issues

**"Unauthorized" errors in admin endpoints**
- Check that authenticated user exists in `profiles` table
- Verify user role is set to 'admin' or 'approver'
- Restart dev server

**Emails not sending**
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for API usage/errors
- Verify `NEXT_PUBLIC_BASE_URL` is correct
- Check logs for detailed error messages

**Rate limiting too strict**
- Adjust limits in `lib/rateLimit.ts`
- Consider using IP allowlist for internal traffic

**Timezone issues**
- Set `TIMEZONE` environment variable
- Verify timezone string is valid IANA format

For detailed environment setup, see [ENV_SETUP.md](ENV_SETUP.md)
