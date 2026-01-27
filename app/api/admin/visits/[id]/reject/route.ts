import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import logger from '@/lib/logger'
import { requireRole } from '@/lib/middleware'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    // ✅ CRITICAL: Verify user has admin or approver role
    const roleCheck = await requireRole(['admin', 'approver'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const user = roleCheck.user!

    let supabase
    try {
      supabase = await createSupabaseRouteClient()
    } catch (err: any) {
      logger.error({ error: err?.message ?? err }, 'Failed to create Supabase route client')
      return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
    }

    const body = await request.json()
    const { reason } = body

    const { error } = await supabase
      .from('site_visit_requests')
      .update({
        status: 'rejected',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        technician_notes: reason || null,
      })
      .eq('id', id)

    if (error) {
      logger.error({ error, id }, 'Database update error during visit rejection')
      return NextResponse.json(
        { message: 'Failed to reject visit', details: error.message },
        { status: 500 }
      )
    }

    logger.info({ id, rejectedBy: user.email, reason }, 'Visit rejected by technician')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in visit rejection route')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
