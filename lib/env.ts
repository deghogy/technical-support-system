/**
 * Environment variable validation and helpers
 * Ensures critical env vars are set with fallbacks and type safety
 */

export function getBaseUrl(): string {
  // 1. Hardcoded production domain (uncomment after deployment)
  // return 'https://www.boccard-tsns.id'

  // 2. Check for explicitly set base URL first
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  if (baseUrl) {
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  }

  // 3. Auto-detect Vercel URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 4. Fallback to localhost for development
  console.warn(
    'NEXT_PUBLIC_BASE_URL not set, using localhost fallback. Set this in .env.local for production.'
  )
  return 'http://localhost:3000'
}

export function validateEnvVars(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check critical env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }
  
  // RESEND_API_KEY is checked at email send time, not startup
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
