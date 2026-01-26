import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = '__csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get or create CSRF token in cookies
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!token) {
    token = generateCSRFToken()
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return token
}

/**
 * Verify CSRF token from header
 */
export async function verifyCSRFToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!cookieToken) return false

  // Use timing-safe comparison to prevent timing attacks
  return constantTimeCompare(headerToken, cookieToken)
}

/**
 * Constant-time string comparison
 */
function constantTimeCompare(a: string, b: string): boolean {
  const aLen = a.length
  const bLen = b.length

  if (aLen !== bLen) return false

  let result = 0
  for (let i = 0; i < aLen; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
