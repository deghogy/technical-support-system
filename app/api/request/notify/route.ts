import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { sendApprovalNotificationEmail, getAdminEmails } from '@/lib/emailService'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId } = body

    if (!requestId) {
      logger.warn({ requestId }, 'Invalid notification request - missing requestId')
      return NextResponse.json(
        { message: 'Invalid request data', errors: ['requestId is required'] },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = await createSupabaseRouteClient()
    } catch (err: any) {
      logger.error({ error: err?.message ?? err }, 'Failed to create Supabase route client')
      return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
    }

    const { data: requestData } = await supabase
      .from('site_visit_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!requestData) {
      logger.warn({ requestId }, 'Request not found for notification')
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    }

    // Get all admin emails and send notification
    const adminEmails = await getAdminEmails()

    const result = await sendApprovalNotificationEmail({
      adminEmails,
      requesterName: requestData.requester_name,
      requesterEmail: requestData.requester_email,
      siteLocation: requestData.site_location,
      problemDesc: requestData.problem_desc,
      requestedDate: new Date(requestData.requested_date).toLocaleDateString(),
      estimatedHours: requestData.estimated_hours,
      requestId,
      supportType: requestData.support_type || 'onsite',
    })

    logger.info(
      { requestId, totalEmails: result.totalCount, successCount: result.successCount },
      'Notification emails processed'
    )

    return NextResponse.json({ success: true, successCount: result.successCount, totalEmails: result.totalCount })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in notification route')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
