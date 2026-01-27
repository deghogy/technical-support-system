import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { sendVisitCompletionEmail } from '@/lib/emailService'
import { visitRecordingSchema } from '@/lib/schemas'
import logger from '@/lib/logger'
import { requireRole } from '@/lib/middleware'
import { getBaseUrl } from '@/lib/env'

const FALLBACK_ADMIN_EMAIL = process.env.FALLBACK_ADMIN_EMAIL || 'suboccardindonesia@gmail.com'

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
      return NextResponse.json(
        { message: 'Invalid visit recording data', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

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

    // Send completion email to customer only if already approved by admin
    try {
      const { data: requestData } = await supabase
        .from('site_visit_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (requestData && requestData.status === 'approved') {
        const confirmationLink = `${getBaseUrl()}/confirm-visit/${id}`
        await sendVisitCompletionEmail({
          adminEmail: user.email || FALLBACK_ADMIN_EMAIL,
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
