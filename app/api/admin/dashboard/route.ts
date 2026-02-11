import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { requireRole } from '@/lib/middleware'

/**
 * GET /api/admin/dashboard - Get all dashboard data
 */

export async function GET() {
  try {
    const roleCheck = await requireRole(['admin', 'approver'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const supabase = await createSupabaseRouteClient()

    // Get counts
    const [{ count: pending }, { count: approved }, { count: confirmed }] = await Promise.all([
      supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('visit_status', 'confirmed'),
    ])

    // Get quotas
    const { data: quotas } = await supabase
      .from('customer_quotas')
      .select('id, customer_email, customer_name, total_hours, used_hours')
      .order('used_hours', { ascending: false })

    // Get unique locations for each customer from their visit requests
    const { data: customerLocations } = await supabase
      .from('site_visit_requests')
      .select('requester_email, site_location')
      .not('site_location', 'is', null)

    // Build a map of customer email -> primary location (most used)
    const locationMap = new Map<string, string>()
    const locationCount = new Map<string, Map<string, number>>()

    customerLocations?.forEach((visit: any) => {
      const email = visit.requester_email?.toLowerCase()
      const location = visit.site_location
      if (!email || !location) return

      if (!locationCount.has(email)) {
        locationCount.set(email, new Map())
      }
      const counts = locationCount.get(email)!
      counts.set(location, (counts.get(location) || 0) + 1)
    })

    // Get the most frequent location for each customer
    locationCount.forEach((counts, email) => {
      let maxCount = 0
      let primaryLocation = email.split('@')[0]
      counts.forEach((count, location) => {
        if (count > maxCount) {
          maxCount = count
          primaryLocation = location
        }
      })
      locationMap.set(email, primaryLocation)
    })

    const quotaList = quotas?.map(q => {
      const location = locationMap.get(q.customer_email.toLowerCase()) || q.customer_email.split('@')[0]
      return {
        id: q.id,
        email: q.customer_email,
        customerName: q.customer_name || location,
        location: location,
        total: q.total_hours || 0,
        used: q.used_hours || 0,
        available: (q.total_hours || 0) - (q.used_hours || 0),
        percentage: (q.total_hours || 0) > 0 ? Math.round(((q.used_hours || 0) / q.total_hours) * 100) : 0,
      }
    }) || []

    const quotaSummary = quotas?.reduce((acc, q) => ({
      total: acc.total + (q.total_hours || 0),
      used: acc.used + (q.used_hours || 0),
    }), { total: 0, used: 0 }) || { total: 0, used: 0 }

    // Get scheduled visits that haven't been recorded yet
    const { data: scheduledVisits } = await supabase
      .from('site_visit_requests')
      .select('*')
      .eq('status', 'approved')
      .not('scheduled_date', 'is', null)
      .is('actual_start_time', null)
      .order('scheduled_date', { ascending: true })

    // Fetch issues for the dashboard
    const { data: issues } = await supabase
      .from('issue_log')
      .select('*')
      .order('entry_issue_date', { ascending: false })

    return NextResponse.json({
      pending: pending || 0,
      approved: approved || 0,
      confirmed: confirmed || 0,
      quotaList,
      quotaSummary,
      scheduledVisits: scheduledVisits || [],
      issues: issues || [],
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
