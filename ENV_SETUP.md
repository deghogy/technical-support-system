# Environment Variables Setup Guide

This document explains all required and optional environment variables for the Boccard-ID Technical Support System.

## Required Environment Variables

### Supabase Configuration
These are required for the application to function.

```env
# Supabase URL - Find in Supabase dashboard under Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key - Find in Supabase dashboard under Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Supabase Service Role Key (optional but recommended for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

### Email Service (Resend)
Required to send email notifications.

```env
# Resend API Key - Get from https://resend.com/api-keys
RESEND_API_KEY=re_...your-api-key

# Fallback admin email if no admins exist in database
FALLBACK_ADMIN_EMAIL=suboccardindonesia@gmail.com
```

### Application Configuration
```env
# The public URL of your application (used in email links and redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_BASE_URL=https://boccard-id.vercel.app  # Production
```

## Optional Environment Variables

### Timezone Configuration
```env
# Timezone for scheduling and date display (default: Asia/Bangkok)
TIMEZONE=Asia/Bangkok
# Options: America/New_York, Europe/London, Asia/Tokyo, etc.
```

### Logging Configuration
```env
# Log level (default: info)
# Options: debug, info, warn, error
LOG_LEVEL=info
```

### Node Environment
```env
# Automatically set by Next.js/Vercel
NODE_ENV=development  # or production
```

## Development Setup (.env.local)

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Resend
RESEND_API_KEY=re_...your-api-key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
TIMEZONE=Asia/Bangkok

# Logging
LOG_LEVEL=debug
```

### Local Development with Supabase Emulator

If using Supabase local emulator:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Production Deployment (Vercel)

### Setting Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values
4. Make sure `NEXT_PUBLIC_*` variables are available to browser code

### Production Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
RESEND_API_KEY=re_...your-api-key
NEXT_PUBLIC_BASE_URL=https://boccard-id.vercel.app
TIMEZONE=Asia/Bangkok
LOG_LEVEL=info
```

## GitHub Codespaces Setup

When using GitHub Codespaces:

1. Add secrets to your repository (Settings → Secrets and variables → Codespaces):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`

2. In Codespaces, these will be available as environment variables

3. Create `.env.local` with public variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
NEXT_PUBLIC_BASE_URL=https://your-codespace-url.github.dev
TIMEZONE=Asia/Bangkok
```

## Troubleshooting

### "Supabase configuration missing" error
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is set
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Check that values don't have extra whitespace

### "RESEND_API_KEY is not set" error
- Verify `RESEND_API_KEY` is set in environment variables
- Make sure it starts with `re_`
- Regenerate the key if unsure

### Emails not sending in development
- Check that `NEXT_PUBLIC_BASE_URL` is correctly set
- Verify Resend API key is valid
- Check logs for specific error messages
- Ensure `FALLBACK_ADMIN_EMAIL` is set to receive notifications

### Rate limiting issues in development
- Rate limiting uses in-memory storage per IP
- Clear app restart to reset limits
- In production, consider using Redis with Upstash

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use `NEXT_PUBLIC_` prefix only for browser-safe values**
3. **Service keys should never be `NEXT_PUBLIC_`**
4. **Rotate Resend API keys periodically**
5. **In production, use Vercel's environment variable encryption**
6. **Regular audit of who has access to secrets**

## Environment Variable Priority

Next.js loads environment variables in this order (first match wins):
1. `.env.local` (development only, never committed)
2. `.env` (committed, shared defaults)
3. System environment variables
4. Vercel environment variables (in production)

## Testing Email Delivery

Use the test endpoint to verify email configuration:

```bash
curl -X POST http://localhost:3000/api/admin/notify-test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Check your email inbox or Resend dashboard to verify delivery.
