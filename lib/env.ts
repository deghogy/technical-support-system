/**
 * Environment variable validation and helpers
 * Ensures critical env vars are set with fallbacks and type safety
 */

export function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  
  if (!baseUrl) {
    console.warn(
      'NEXT_PUBLIC_BASE_URL not set, using fallback. Set this in .env.local for production.'
    )
    return 'http://localhost:3000'
  }
  
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
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
