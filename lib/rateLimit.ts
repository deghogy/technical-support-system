/**
 * Simple in-memory rate limiter
 * For production, use Upstash Redis-backed rate limiter
 * Example: https://upstash.com/docs/redis/features/ratelimiting
 */
const requestLimiters = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000 // 1 minute default
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const limiter = requestLimiters.get(identifier)

  if (!limiter || now > limiter.resetTime) {
    // New window or reset
    requestLimiters.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (limiter.count < maxRequests) {
    limiter.count++
    return { success: true, remaining: maxRequests - limiter.count, resetTime: limiter.resetTime }
  }

  return { success: false, remaining: 0, resetTime: limiter.resetTime }
}

/**
 * Clear old rate limit entries (call periodically from a cron job)
 */
export function cleanupRateLimiters() {
  const now = Date.now()
  for (const [key, limiter] of requestLimiters.entries()) {
    if (now > limiter.resetTime) {
      requestLimiters.delete(key)
    }
  }
}
