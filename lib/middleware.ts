import { createSupabaseRouteClient } from './supabaseRoute'
import logger from './logger'

/**
 * Verifies that the user has one of the required roles
 * Returns null if valid, or an error response if not
 */
export async function requireRole(allowedRoles: string[]) {
  const supabase = await createSupabaseRouteClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    logger.warn('Authentication failed in role check')
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    logger.error({ userId: user.id, error: profileError }, 'Failed to fetch user profile')
    return { error: 'Forbidden', status: 403 }
  }

  if (!allowedRoles.includes(profile.role)) {
    logger.warn(
      { userId: user.id, userRole: profile.role, requiredRoles: allowedRoles },
      'User attempted access without required role'
    )
    return { error: 'Forbidden', status: 403 }
  }

  return { user, profile, error: null }
}
