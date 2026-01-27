import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { visitConfirmationSchema } from '@/lib/schemas'
import logger from '@/lib/logger'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  let supabase
  try {
    supabase = await createSupabaseRouteClient()
  } catch (err: any) {
    logger.error({ error: err?.message ?? err }, 'Failed to create Supabase route client')
    return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
  }

  const { data: visit, error } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .not('actual_start_time', 'is', null)
    .is('customer_confirmed_at', null)
    .single()

  if (error || !visit) {
    logger.warn({ id }, 'Visit not found or already confirmed')
    return NextResponse.json(
      { message: 'Visit not found or already confirmed' },
      { status: 404 }
    )
  }

  return NextResponse.json({ visit })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  try {
    const body = await request.json()

    // Validate confirmation data
    const validationResult = visitConfirmationSchema.safeParse({
      customer_notes: body.customer_notes,
    })

    if (!validationResult.success) {
      logger.info({ errors: validationResult.error.errors, id }, 'Visit confirmation validation failed')
      return NextResponse.json(
        { message: 'Invalid confirmation data', errors: validationResult.error.errors },
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

    const { error } = await supabase
      .from('site_visit_requests')
      .update({
        customer_confirmed_at: new Date().toISOString(),
        customer_notes: validatedData.customer_notes || null,
        visit_status: 'confirmed',
      })
      .eq('id', id)
      .eq('status', 'approved')
      .is('customer_confirmed_at', null)

    if (error) {
      logger.error({ error, id }, 'Database update error during visit confirmation')
      return NextResponse.json(
        { message: 'Failed to confirm visit', details: error.message },
        { status: 500 }
      )
    }

    logger.info({ id, visitStatus: 'confirmed' }, 'Visit confirmed by customer')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in visit confirmation route')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
