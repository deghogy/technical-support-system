import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { message: 'Email is required' },
      { status: 400 }
    )
  }

  let supabase
  try {
    supabase = await createSupabaseRouteClient()
  } catch (err: any) {
    console.error('Failed to create Supabase route client:', err?.message ?? err)
    return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
  }

  const { data: requests, error } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('requester_email', email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database query error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch requests', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ requests: requests || [] })
}
