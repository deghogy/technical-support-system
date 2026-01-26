import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { createSiteVisitRequestSchema } from '@/lib/schemas'
import logger from '@/lib/logger'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Rate limit: 10 requests per minute per IP
    const rateLimit = await checkRateLimit(`request-submit:${clientIp}`, 10, 60 * 1000)
    if (!rateLimit.success) {
      logger.warn({ ip: clientIp }, 'Rate limit exceeded for request submission')
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate request schema
    const validationResult = createSiteVisitRequestSchema.safeParse(body)
    if (!validationResult.success) {
      logger.info({ errors: validationResult.error.errors }, 'Request validation failed')
      return NextResponse.json(
        { message: 'Invalid request', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    let supabase
    try {
      supabase = await createSupabaseRouteClient()
    } catch (err: any) {
      logger.error({ error: err?.message ?? err }, 'Failed to create Supabase route client')
      return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
    }

    const { data: insertedData, error } = await supabase
      .from('site_visit_requests')
      .insert([
        {
          requester_name: validatedData.requester_name,
          requester_email: validatedData.requester_email,
          site_location: validatedData.site_location,
          problem_desc: validatedData.problem_desc,
          requested_date: validatedData.requested_date,
          estimated_hours: validatedData.estimated_hours,
        },
      ])
      .select('id')

    if (error) {
      logger.error({ error, data: validatedData }, 'Database insert failed')
      return NextResponse.json(
        { message: 'Database insert failed' },
        { status: 500 }
      )
    }

    logger.info({ requestId: insertedData?.[0]?.id }, 'New request created')

    // Get admin emails to notify them
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || []

    if (adminEmails.length === 0) {
      logger.warn('No admin emails found in profiles table - notification will not be sent')
    }

    // Send notifications to all admins (async, don't wait)
    if (adminEmails.length > 0 && insertedData?.[0]?.id) {
      try {
        // Use absolute URL for internal API call
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/request/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: insertedData[0].id,
            adminEmails,
          }),
        })
        logger.info({ requestId: insertedData[0].id, adminCount: adminEmails.length }, 'Notification email sent')
      } catch (emailError) {
        logger.error({ error: emailError, requestId: insertedData[0].id }, 'Failed to send admin notifications')
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { message: 'Request saved successfully' },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, 'Unexpected error in POST /api/request')
    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 }
    )
  }
}
