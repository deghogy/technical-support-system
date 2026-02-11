import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { z } from 'zod'
import logger from '@/lib/logger'
import { checkRateLimit } from '@/lib/rateLimit'
import { getBaseUrl } from '@/lib/env'

// New schema for authenticated requests
const createRequestSchema = z.object({
  site_location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(500, 'Location must not exceed 500 characters'),
  problem_desc: z
    .string()
    .trim()
    .min(10, 'Problem description must be at least 10 characters')
    .max(2000, 'Problem description must not exceed 2000 characters'),
  requested_date: z
    .string()
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !isNaN(parsed.getTime()) && parsed >= today
    }, 'Requested date must be today or later'),
  support_type: z
    .enum(['remote', 'onsite'], {
      errorMap: () => ({ message: 'Support type must be remote or onsite' }),
    }),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized attempt to submit request')
      return NextResponse.json(
        { message: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Rate limit: 10 requests per minute per IP
    const rateLimit = await checkRateLimit(`request-submit:${clientIp}`, 10, 60 * 1000)
    if (!rateLimit.success) {
      logger.warn({ ip: clientIp, userId: user.id }, 'Rate limit exceeded for request submission')
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request schema
    const validationResult = createRequestSchema.safeParse(body)
    if (!validationResult.success) {
      logger.info({ errors: validationResult.error.errors, userId: user.id }, 'Request validation failed')
      return NextResponse.json(
        { message: 'Invalid request', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Get user's profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single()

    // Verify user is a customer
    if (profile?.role !== 'customer') {
      logger.warn({ userId: user.id, role: profile?.role }, 'Non-customer attempted to submit request')
      return NextResponse.json(
        { message: 'Only customers can submit service requests' },
        { status: 403 }
      )
    }

    // Verify the location belongs to this customer (skip for remote support)
    if (validatedData.support_type !== 'remote') {
      const { data: locationData } = await supabase
        .from('customer_locations')
        .select('id')
        .eq('customer_id', user.id)
        .eq('location_name', validatedData.site_location)
        .single()

      if (!locationData) {
        logger.warn({ userId: user.id, location: validatedData.site_location }, 'Invalid location submitted')
        return NextResponse.json(
          { message: 'Invalid location - Please select from your saved locations' },
          { status: 400 }
        )
      }
    }

    // Check quota before allowing request
    const { data: quotaData } = await supabase
      .from('customer_quotas')
      .select('total_hours, used_hours')
      .eq('customer_email', user.email)
      .single()

    if (!quotaData) {
      return NextResponse.json(
        { message: 'No quota found for your account. Please contact support.' },
        { status: 400 }
      )
    }

    const availableHours = quotaData.total_hours - quotaData.used_hours
    if (availableHours <= 0) {
      return NextResponse.json(
        { message: 'You have no available quota. Please contact support.' },
        { status: 400 }
      )
    }

    // Insert the request with customer_id
    const { data: insertedData, error } = await supabase
      .from('site_visit_requests')
      .insert([
        {
          customer_id: user.id,
          requester_name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
          requester_email: user.email,
          site_location: validatedData.site_location,
          problem_desc: validatedData.problem_desc,
          requested_date: validatedData.requested_date,
          estimated_hours: 0,
          support_type: validatedData.support_type,
          status: 'pending',
          visit_status: 'pending',
        },
      ])
      .select('id')

    if (error) {
      logger.error({ error, userId: user.id }, 'Database insert failed')
      return NextResponse.json(
        { message: 'Database insert failed' },
        { status: 500 }
      )
    }

    logger.info({ requestId: insertedData?.[0]?.id, userId: user.id }, 'New request created')

    // Get admin emails to notify them
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'approver'])

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || []

    if (adminEmails.length === 0) {
      logger.warn('No admin emails found in profiles table - notification will not be sent')
    }

    // Send notifications to all admins (async, don't wait)
    if (adminEmails.length > 0 && insertedData?.[0]?.id) {
      try {
        // Use absolute URL for internal API call
        const baseUrl = getBaseUrl()
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
