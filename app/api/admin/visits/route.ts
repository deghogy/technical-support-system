import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { requireRole } from '@/lib/middleware'
import logger from '@/lib/logger'

export async function GET(request: Request) {
  try {
    // Verify user has admin or approver role
    const roleCheck = await requireRole(['admin', 'approver'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let supabase
    try {
      supabase = await createSupabaseRouteClient()
    } catch (err: any) {
      logger.error({ error: err?.message ?? err }, 'Failed to create Supabase client')
      return NextResponse.json({ message: 'Database error' }, { status: 500 })
    }

    let visits = []

    if (type === 'scheduled') {
      // Get scheduled visits that haven't been recorded yet
      const { data, error } = await supabase
        .from('site_visit_requests')
        .select('*')
        .eq('status', 'approved')
        .not('scheduled_date', 'is', null)
        .is('actual_start_time', null)
        .order('scheduled_date', { ascending: true })

      if (error) {
        logger.error({ error }, 'Error fetching scheduled visits')
        return NextResponse.json({ message: 'Failed to fetch visits' }, { status: 500 })
      }
      visits = data || []
    } else if (type === 'recorded') {
      // Get visits that have been recorded but not yet confirmed by customer
      const { data, error } = await supabase
        .from('site_visit_requests')
        .select('*')
        .eq('status', 'approved')
        .not('actual_start_time', 'is', null)
        .is('customer_confirmed_at', null)
        .order('actual_start_time', { ascending: false })

      if (error) {
        logger.error({ error }, 'Error fetching recorded visits')
        return NextResponse.json({ message: 'Failed to fetch visits' }, { status: 500 })
      }
      visits = data || []
    } else {
      return NextResponse.json({ message: 'Invalid type parameter' }, { status: 400 })
    }

    return NextResponse.json({ visits })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in visits API')
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
