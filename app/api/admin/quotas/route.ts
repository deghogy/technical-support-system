import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { requireRole } from '@/lib/middleware'
import logger from '@/lib/logger'

/**
 * GET /api/admin/quotas - List all customer quotas
 * POST /api/admin/quotas - Create or update customer quota
 */

export async function GET(req: NextRequest) {
  try {
    const roleCheck = await requireRole(['admin'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const supabase = await createSupabaseRouteClient()

    const { data: quotas, error } = await supabase
      .from('customer_quotas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ error }, 'Failed to fetch quotas')
      return NextResponse.json(
        { message: 'Failed to fetch quotas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      quotas: quotas.map(q => ({
        id: q.id,
        customerEmail: q.customer_email,
        totalHours: q.total_hours,
        usedHours: q.used_hours,
        availableHours: q.total_hours - q.used_hours,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      })),
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in quotas GET')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleCheck = await requireRole(['admin'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const body = await req.json()
    const { customerEmail, totalHours } = body

    if (!customerEmail || totalHours === undefined) {
      return NextResponse.json(
        { message: 'Missing customerEmail or totalHours' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseRouteClient()

    // Check if quota exists
    const { data: existing } = await supabase
      .from('customer_quotas')
      .select('id')
      .eq('customer_email', customerEmail.toLowerCase())
      .single()

    if (existing) {
      // Update existing quota
      const { error } = await supabase
        .from('customer_quotas')
        .update({
          total_hours: totalHours,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_email', customerEmail.toLowerCase())

      if (error) {
        logger.error({ error }, 'Failed to update quota')
        return NextResponse.json(
          { message: 'Failed to update quota' },
          { status: 500 }
        )
      }

      logger.info({ customerEmail, totalHours }, 'Quota updated')
    } else {
      // Create new quota
      const { error } = await supabase
        .from('customer_quotas')
        .insert({
          customer_email: customerEmail.toLowerCase(),
          total_hours: totalHours,
          used_hours: 0,
        })

      if (error) {
        logger.error({ error }, 'Failed to create quota')
        return NextResponse.json(
          { message: 'Failed to create quota' },
          { status: 500 }
        )
      }

      logger.info({ customerEmail, totalHours }, 'Quota created')
    }

    return NextResponse.json({
      success: true,
      message: `Quota for ${customerEmail} set to ${totalHours} hours`,
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in quotas POST')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const roleCheck = await requireRole(['admin'])
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status })
    }

    const body = await req.json()
    const { id, usedHours } = body

    if (!id || usedHours === undefined) {
      return NextResponse.json(
        { message: 'Missing id or usedHours' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseRouteClient()

    // Get current quota to check against total
    const { data: currentQuota, error: fetchError } = await supabase
      .from('customer_quotas')
      .select('total_hours, customer_email')
      .eq('id', id)
      .single()

    if (fetchError || !currentQuota) {
      logger.error({ fetchError }, 'Failed to fetch quota for update')
      return NextResponse.json(
        { message: 'Quota not found' },
        { status: 404 }
      )
    }

    // Validate used hours doesn't exceed total
    if (usedHours > currentQuota.total_hours) {
      return NextResponse.json(
        { message: 'Used hours cannot exceed total hours' },
        { status: 400 }
      )
    }

    // Update used hours
    const { error } = await supabase
      .from('customer_quotas')
      .update({
        used_hours: usedHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error({ error }, 'Failed to update used hours')
      return NextResponse.json(
        { message: 'Failed to update used hours' },
        { status: 500 }
      )
    }

    logger.info({ id, usedHours, customerEmail: currentQuota.customer_email }, 'Used hours updated')

    return NextResponse.json({
      success: true,
      message: 'Used hours updated successfully',
    })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in quotas PATCH')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
