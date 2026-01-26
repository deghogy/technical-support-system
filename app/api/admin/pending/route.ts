import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'

export async function GET(request: NextRequest) {
  let supabase
  try {
    supabase = await createSupabaseRouteClient()
  } catch (err: any) {
    console.error('Failed to create Supabase route client:', err?.message ?? err)
    return NextResponse.json({ message: 'Supabase configuration missing' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'pending')

  if (error) {
    console.error('SUPABASE ERROR:', error)
    return NextResponse.json([], { status: 500 })
  }

  return NextResponse.json(data)
}
