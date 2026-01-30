import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { sendScheduleConfirmationEmail, getAdminEmails } from '@/lib/emailService'
import { approvalSchema } from '@/lib/schemas'
import logger from '@/lib/logger'
import { requireRole } from '@/lib/middleware'
import { getTimezone } from '@/lib/timezone'
import { getBaseUrl } from '@/lib/env'

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

    const formData = await request.formData()
    const status = formData.get('status')
    const scheduled_date = formData.get('scheduled_date')
    const duration_hours = formData.get('duration_hours')

    // Validate approval data
    const validationResult = approvalSchema.safeParse({
      status,
      scheduled_date,
      duration_hours: duration_hours ? parseInt(duration_hours as string) : undefined,
    })

    if (!validationResult.success) {
      logger.info({ errors: validationResult.error.errors, id }, 'Approval validation failed')
      return NextResponse.json(
        { message: 'Invalid approval data', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Get the request details for email
    const { data: requestData } = await supabase
      .from('site_visit_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (!requestData) {
      logger.warn({ id }, 'Request not found for approval')
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    }

    const updatePayload: any = {
      status: validatedData.status,
      approved_by: user.email,
      approved_at: new Date().toISOString(),
    }

    if (validatedData.status === 'approved') {
      updatePayload.visit_status = 'scheduled'
    }

    if (validatedData.scheduled_date) updatePayload.scheduled_date = validatedData.scheduled_date
    if (validatedData.duration_hours) updatePayload.duration_hours = validatedData.duration_hours

    const { error } = await supabase
      .from('site_visit_requests')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      logger.error({ error, id, userId: user.id }, 'Database update error')
      return NextResponse.json(
        { message: 'Failed to update request', details: error.message },
        { status: 500 }
      )
    }

    logger.info({ id, status: validatedData.status, approvedBy: user.email }, 'Request approval updated')

    // Note: Quota is NO LONGER deducted at approval time.
    // Quota will be deducted when the technician records actual visit hours.
    // The duration_hours field is kept for scheduling reference only.

    // Send email to all admins if approved and scheduled
    if (validatedData.status === 'approved' && validatedData.scheduled_date) {
      try {
        const timezone = getTimezone()
        const formattedDate = new Date(validatedData.scheduled_date as string).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        })

        // Send to customer as main recipient, admins in CC
        const adminEmails = await getAdminEmails()
        await sendScheduleConfirmationEmail({
          adminEmails,
          requesterEmail: requestData.requester_email,
          requesterName: requestData.requester_name,
          siteLocation: requestData.site_location,
          scheduledDate: formattedDate,
          durationHours: validatedData.duration_hours ? Number(validatedData.duration_hours) : undefined,
          trackingLink: `${getBaseUrl()}/track-request`,
        })

        logger.info({ id, email: requestData.requester_email }, 'Schedule confirmation email sent')
      } catch (emailError) {
        logger.error({ error: emailError, id }, 'Failed to send confirmation email')
        // Don't fail the approval if email fails
      }
    }

    return NextResponse.redirect(new URL('/admin/approvals', request.url))
  } catch (error) {
    logger.error({ error }, 'Unexpected error in approval route')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
