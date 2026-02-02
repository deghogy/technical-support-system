import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import logger from '@/lib/logger'

/**
 * GET /api/customer/quota
 * Returns authenticated customer's quota information
 * Admins can query any customer's quota by providing email param
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

    // Get email from query param or use authenticated user's email
    const { searchParams } = new URL(req.url)
    const emailParam = searchParams.get('email')

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'approver'

    // Determine which email to query:
    // - Admins can query any email (use param if provided, fallback to own email)
    // - Customers can only query their own email
    let queryEmail = user.email
    if (emailParam) {
      if (isAdmin) {
        queryEmail = emailParam
      } else if (emailParam !== user.email) {
        return NextResponse.json(
          { message: 'Forbidden - Can only view your own quota' },
          { status: 403 }
        )
      }
    }

    // Get quota for the specified user
    const { data: quota, error } = await supabase
      .from('customer_quotas')
      .select('*')
      .eq('customer_email', queryEmail)
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
        customerEmail: queryEmail,
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
