import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import logger from '@/lib/logger'

/**
 * GET /api/customer/quota
 * Returns authenticated customer's quota information
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized attempt to access quota')
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get quota for the authenticated user
    const { data: quota, error } = await supabase
      .from('customer_quotas')
      .select('*')
      .eq('customer_email', user.email)
      .single()

    if (error && error.code !== 'PGRST116') {
      logger.error({ error, userId: user.id }, 'Failed to fetch quota')
      return NextResponse.json(
        { message: 'Failed to fetch quota' },
        { status: 500 }
      )
    }

    // If no quota exists, return default (0 hours available)
    if (!quota) {
      return NextResponse.json({
        customerEmail: user.email,
        totalHours: 0,
        usedHours: 0,
        availableHours: 0,
      })
    }

    return NextResponse.json({
      customerEmail: quota.customer_email,
      totalHours: quota.total_hours,
      usedHours: quota.used_hours,
      availableHours: quota.total_hours - quota.used_hours,
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in quota endpoint')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
