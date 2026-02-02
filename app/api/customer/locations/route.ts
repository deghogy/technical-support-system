import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import logger from '@/lib/logger'

const MAX_LOCATIONS = 2

// GET - Fetch customer's locations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized access attempt to customer locations')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'customer') {
      logger.warn({ userId: user.id, role: profile?.role }, 'Non-customer attempted to access customer locations')
      return NextResponse.json(
        { message: 'Forbidden - Customers only' },
        { status: 403 }
      )
    }

    // Fetch locations
    const { data: locations, error } = await supabase
      .from('customer_locations')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error({ error, userId: user.id }, 'Failed to fetch customer locations')
      return NextResponse.json(
        { message: 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ locations: locations || [] }, { status: 200 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/customer/locations')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add a new location
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized attempt to add location')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'customer') {
      logger.warn({ userId: user.id, role: profile?.role }, 'Non-customer attempted to add location')
      return NextResponse.json(
        { message: 'Forbidden - Customers only' },
        { status: 403 }
      )
    }

    // Check current location count
    const { count, error: countError } = await supabase
      .from('customer_locations')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', user.id)

    if (countError) {
      logger.error({ error: countError, userId: user.id }, 'Failed to count customer locations')
      return NextResponse.json(
        { message: 'Failed to check location limit' },
        { status: 500 }
      )
    }

    if (count && count >= MAX_LOCATIONS) {
      return NextResponse.json(
        { message: `Maximum ${MAX_LOCATIONS} locations allowed` },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { location_name } = body

    if (!location_name || typeof location_name !== 'string' || location_name.trim().length === 0) {
      return NextResponse.json(
        { message: 'Location name is required' },
        { status: 400 }
      )
    }

    if (location_name.trim().length > 100) {
      return NextResponse.json(
        { message: 'Location name must not exceed 100 characters' },
        { status: 400 }
      )
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('customer_locations')
      .select('id')
      .eq('customer_id', user.id)
      .eq('location_name', location_name.trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Location with this name already exists' },
        { status: 400 }
      )
    }

    // Insert new location
    const { data: newLocation, error: insertError } = await supabase
      .from('customer_locations')
      .insert([
        {
          customer_id: user.id,
          location_name: location_name.trim(),
        },
      ])
      .select()
      .single()

    if (insertError) {
      logger.error({ error: insertError, userId: user.id }, 'Failed to insert new location')
      return NextResponse.json(
        { message: 'Failed to add location' },
        { status: 500 }
      )
    }

    logger.info({ userId: user.id, locationId: newLocation.id }, 'New location added')
    return NextResponse.json(
      { message: 'Location added successfully', location: newLocation },
      { status: 201 }
    )
  } catch (error) {
    logger.error({ error }, 'Unexpected error in POST /api/customer/locations')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a location
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Location ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseRouteClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized attempt to delete location')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'customer') {
      logger.warn({ userId: user.id, role: profile?.role }, 'Non-customer attempted to delete location')
      return NextResponse.json(
        { message: 'Forbidden - Customers only' },
        { status: 403 }
      )
    }

    // Verify the location belongs to this customer
    const { data: location } = await supabase
      .from('customer_locations')
      .select('id')
      .eq('id', id)
      .eq('customer_id', user.id)
      .single()

    if (!location) {
      return NextResponse.json(
        { message: 'Location not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the location
    const { error: deleteError } = await supabase
      .from('customer_locations')
      .delete()
      .eq('id', id)
      .eq('customer_id', user.id)

    if (deleteError) {
      logger.error({ error: deleteError, userId: user.id, locationId: id }, 'Failed to delete location')
      return NextResponse.json(
        { message: 'Failed to delete location' },
        { status: 500 }
      )
    }

    logger.info({ userId: user.id, locationId: id }, 'Location deleted')
    return NextResponse.json(
      { message: 'Location deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, 'Unexpected error in DELETE /api/customer/locations')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
