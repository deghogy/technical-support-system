import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { sendApprovalNotificationEmail } from '@/lib/emailService'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, adminEmails } = body

    if (!requestId || !Array.isArray(adminEmails) || adminEmails.length === 0) {
      logger.warn({ requestId, adminEmailCount: adminEmails?.length }, 'Invalid notification request')
      return NextResponse.json(
        { message: 'Invalid request data', errors: ['requestId and non-empty adminEmails array are required'] },
        { status: 400 }
      )
    }

    // Validate email format
    const validEmails = adminEmails.filter(
      (email: any) => typeof email === 'string' && email.includes('@')
    )
    if (validEmails.length !== adminEmails.length) {
      logger.warn({ requestId, total: adminEmails.length, valid: validEmails.length }, 'Some invalid email addresses provided')
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

    // Send to all admin emails in parallel
    const emailPromises = validEmails.map((email: string) =>
      sendApprovalNotificationEmail({
        adminEmail: email,
        requesterName: requestData.requester_name,
        requesterEmail: requestData.requester_email,
        siteLocation: requestData.site_location,
        problemDesc: requestData.problem_desc,
        requestedDate: new Date(requestData.requested_date).toLocaleDateString(),
        estimatedHours: requestData.estimated_hours,
        requestId,
      }).catch(err => {
        logger.error({ error: err, email, requestId }, 'Failed to send email to admin')
        // Continue even if one email fails
        return null
      })
    )

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r !== null).length

    logger.info(
      { requestId, totalEmails: validEmails.length, successCount },
      'Notification emails processed'
    )

    return NextResponse.json({ success: true, successCount, totalEmails: validEmails.length })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in notification route')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
