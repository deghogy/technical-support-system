import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const body = await request.json()
    const { status } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
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

    const { error } = await supabase
      .from('site_visit_requests')
      .update({
        status,
        approved_by: 'approver@company.com', // 🔒 later from auth
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      return NextResponse.json(
        { message: 'Update failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Status updated' },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Bad request' },
      { status: 400 }
    )
  }
}
