import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { sendVisitCompletionEmail, getAdminEmails } from '@/lib/emailService'
import { visitRecordingSchema } from '@/lib/schemas'
import logger from '@/lib/logger'
import { requireRole } from '@/lib/middleware'
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
    const actual_start_time = formData.get('actual_start_time')
    const actual_end_time = formData.get('actual_end_time')
    const technician_notes = formData.get('technician_notes')
    const document = formData.get('document') as File | null

    // Validate visit recording data
    const validationResult = visitRecordingSchema.safeParse({
      actual_start_time,
      actual_end_time,
      technician_notes,
    })

    if (!validationResult.success) {
      logger.info({ errors: validationResult.error.errors, id }, 'Visit recording validation failed')

      // Format validation errors into user-friendly messages
      const errorMessages = validationResult.error.errors.map(err => {
        const path = err.path.join('.')
        if (path === 'actual_start_time') {
          return '• Start time: ' + (err.message.includes('Invalid') ? 'Please enter a valid start date and time' : err.message)
        }
        if (path === 'actual_end_time') {
          return '• End time: ' + (err.message.includes('Invalid') ? 'Please enter a valid end date and time' : err.message)
        }
        return `• ${err.message}`
      }).join('\n')

      return NextResponse.json(
        {
          message: 'Please fix the following issues:',
          details: errorMessages,
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Get the request details early (needed for quota deduction and email)
    const { data: requestData, error: requestError } = await supabase
      .from('site_visit_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError || !requestData) {
      logger.warn({ id, error: requestError }, 'Request not found for visit recording')
      return NextResponse.json({ message: 'Request not found' }, { status: 404 })
    }

    const updatePayload: any = {
      actual_start_time: validatedData.actual_start_time,
      actual_end_time: validatedData.actual_end_time,
      technician_notes: validatedData.technician_notes || null,
      visit_status: 'visit-completed',
    }

    // Handle document upload if provided
    if (document) {
      try {
        const buffer = await document.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)
        
        // Generate unique filename
        const timestamp = Date.now()
        const filename = `${id}/${timestamp}-${document.name}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('visit-documents')
          .upload(filename, uint8Array, {
            contentType: document.type,
            upsert: false,
          })

        if (uploadError) {
          logger.error({ error: uploadError, id }, 'Failed to upload document')
          return NextResponse.json(
            { message: 'Failed to upload document', details: uploadError.message },
            { status: 500 }
          )
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('visit-documents')
          .getPublicUrl(filename)

        updatePayload.document_url = urlData?.publicUrl

        logger.info({ id, filename }, 'Document uploaded successfully')
      } catch (uploadError) {
        logger.error({ error: uploadError, id }, 'Document upload error')
        return NextResponse.json(
          { message: 'Failed to upload document' },
          { status: 500 }
        )
      }
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

    // Calculate actual hours and deduct from customer quota
    try {
      const startTime = new Date(validatedData.actual_start_time)
      const endTime = new Date(validatedData.actual_end_time)
      const actualHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))

      if (actualHours > 0) {
        // Get customer quota
        const { data: quota } = await supabase
          .from('customer_quotas')
          .select('*')
          .eq('customer_email', requestData.requester_email.toLowerCase())
          .single()

        if (quota) {
          // Check if sufficient quota is available
          const availableHours = quota.total_hours - quota.used_hours
          if (actualHours > availableHours) {
            logger.warn({
              email: requestData.requester_email,
              actualHours,
              availableHours,
              requestId: id
            }, 'Insufficient quota for actual hours')
            return NextResponse.json(
              { message: `Insufficient quota. Actual hours (${actualHours}) exceed available hours (${availableHours})` },
              { status: 400 }
            )
          }

          // Deduct actual hours from quota
          const newUsedHours = quota.used_hours + actualHours
          await supabase
            .from('customer_quotas')
            .update({ used_hours: newUsedHours })
            .eq('customer_email', requestData.requester_email.toLowerCase())

          // Log the quota deduction with actual hours
          await supabase
            .from('quota_logs')
            .insert({
              customer_email: requestData.requester_email.toLowerCase(),
              hours_deducted: actualHours,
              reason: `Visit completed - ${requestData.site_location} (Actual: ${actualHours}h)`,
            })

          logger.info({
            email: requestData.requester_email,
            actualHours,
            newUsedHours,
            requestId: id
          }, 'Quota deducted based on actual hours')
        }
      }
    } catch (quotaError) {
      logger.error({ error: quotaError, id }, 'Failed to deduct quota based on actual hours')
      // Don't fail the visit recording if quota deduction fails - we still want to record the visit
    }

    // Send completion email to customer with admins in CC
    try {
      if (requestData.status === 'approved') {
        const confirmationLink = `${getBaseUrl()}/confirm-visit/${id}`
        const adminEmails = await getAdminEmails()

        // Fetch customer notes if available
        const { data: visitData } = await supabase
          .from('site_visit_requests')
          .select('customer_notes')
          .eq('id', id)
          .single()

        await sendVisitCompletionEmail({
          adminEmails,
          requesterEmail: requestData.requester_email,
          requesterName: requestData.requester_name,
          siteLocation: requestData.site_location,
          confirmationLink,
          technicianNotes: validatedData.technician_notes,
          customerNotes: visitData?.customer_notes,
          documentUrl: updatePayload.document_url,
        })

        logger.info({ id, email: requestData.requester_email }, 'Visit completion email sent to customer')
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
