import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import logger from '@/lib/logger'

/**
 * POST /api/logout
 * Server-side logout that properly clears the session
 */
export async function POST() {
  try {
    const supabase = await createSupabaseRouteClient()

    // Sign out on the server side - this clears the cookie
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error({ error }, 'Server-side logout failed')
      return NextResponse.json(
        { message: 'Logout failed', error: error.message },
        { status: 500 }
      )
    }

    logger.info('User logged out successfully')

    // Create response that clears any auth-related cookies
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear any remaining auth cookies as a safeguard
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error) {
    logger.error({ error }, 'Unexpected error during logout')
    return NextResponse.json(
      { message: 'Logout failed' },
      { status: 500 }
    )
  }
}
