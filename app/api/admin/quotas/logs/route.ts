import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { requireRole } from '@/lib/middleware'
import logger from '@/lib/logger'

/**
 * GET /api/admin/quotas/logs - See quota usage history
 */

export async function GET(req: NextRequest) {
  try {
    const roleCheck = await requireRole(['admin'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const supabase = await createSupabaseRouteClient()

    const { data: logs, error } = await supabase
      .from('quota_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ error }, 'Failed to fetch quota logs')
      return NextResponse.json(
        { message: 'Failed to fetch quota logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        customerEmail: log.customer_email,
        hoursDeducted: log.hours_deducted,
        reason: log.reason,
        createdAt: log.created_at,
      })),
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in quota logs')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
