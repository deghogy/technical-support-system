import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { sendVisitCompletionEmail } from '@/lib/emailService'
import { visitRecordingSchema } from '@/lib/schemas'
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

    let supabase
    try {
      supabase = await createSupabaseRouteClient()
    } catch (err: any) {
      logger.error({ error: err?.message ?? err }, 'Failed to create Supabase route client')
      return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
    }

    const formData = await request.formData()
    const actual_start_time = formData.get('actual_start_time')
    const actual_end_time = formData.get('actual_end_time')
    const technician_notes = formData.get('technician_notes')

    // Validate visit recording data
    const validationResult = visitRecordingSchema.safeParse({
      actual_start_time,
      actual_end_time,
      technician_notes,
    })

    if (!validationResult.success) {
      logger.info({ errors: validationResult.error.errors, id }, 'Visit recording validation failed')
      return NextResponse.json(
        { message: 'Invalid visit recording data', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    const updatePayload = {
      actual_start_time: validationResult.data.actual_start_time,
      actual_end_time: validationResult.data.actual_end_time,
      technician_notes: validationResult.data.technician_notes || null,
      visit_status: 'visit-completed',
    }

    const { error } = await supabase
      .from('site_visit_requests')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      logger.error({ error, id }, 'Database update error during visit recording')
      return NextResponse.json(
        { message: 'Failed to record visit', details: error.message },
        { status: 500 }
      )
    }

    logger.info({ id, visitStatus: 'visit-completed' }, 'Visit recording saved')

    // Send completion email to customer
    try {
      const { data: requestData } = await supabase
        .from('site_visit_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (requestData) {
        const confirmationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm-visit/${id}`
        await sendVisitCompletionEmail({
          customerEmail: requestData.requester_email,
          requesterName: requestData.requester_name,
          siteLocation: requestData.site_location,
          confirmationLink,
        })

        logger.info({ id, email: requestData.requester_email }, 'Visit completion email sent')
      }
    } catch (emailError) {
      logger.error({ error: emailError, id }, 'Failed to send visit completion email')
      // Don't fail the visit recording if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in visit recording route')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
