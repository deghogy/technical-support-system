import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabaseRoute'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'
import { z } from 'zod'

const createCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  quota_hours: z.number().int().min(0).default(40),
})

// GET - List all customers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient()

    // Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'approver'].includes(profile?.role || '')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Get customers with their locations
    const { data: customers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        name,
        created_at,
        customer_locations(location_name)
      `)
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ error }, 'Failed to fetch customers')
      return NextResponse.json({ message: 'Failed to fetch customers' }, { status: 500 })
    }

    return NextResponse.json({ customers }, { status: 200 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error fetching customers')
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient()

    // Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'approver'].includes(profile?.role || '')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = createCustomerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid request', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name, location, quota_hours } = validationResult.data

    // Create user using service role client (requires SUPABASE_SERVICE_ROLE_KEY)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createError) {
      logger.error({ error: createError, email }, 'Failed to create auth user')
      return NextResponse.json(
        { message: createError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    if (!newUser.user) {
      return NextResponse.json({ message: 'Failed to create user' }, { status: 500 })
    }

    const userId = newUser.user.id

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        role: 'customer',
        name,
      })

    if (profileError) {
      logger.error({ error: profileError, userId }, 'Failed to create profile')
      // Don't return error - profile might already exist via trigger
    }

    // Create location
    const { error: locationError } = await supabase
      .from('customer_locations')
      .insert({
        customer_id: userId,
        location_name: location,
      })

    if (locationError) {
      logger.error({ error: locationError, userId }, 'Failed to create location')
    }

    // Create quota
    const { error: quotaError } = await supabase
      .from('customer_quotas')
      .insert({
        email,
        total_hours: quota_hours,
        used_hours: 0,
      })

    if (quotaError) {
      logger.error({ error: quotaError, email }, 'Failed to create quota')
    }

    logger.info({ userId, email, createdBy: user.id }, 'New customer created')

    return NextResponse.json({
      message: 'Customer created successfully',
      user: {
        id: userId,
        email,
        name,
        location,
        quota_hours,
      },
    }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error creating customer')
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
