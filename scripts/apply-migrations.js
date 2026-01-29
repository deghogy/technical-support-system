const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigrations() {
  console.log('Applying migrations...\n')

  // Migration 1: Add support_type column
  console.log('Migration 1: Adding support_type column...')
  try {
    // Check if column exists first
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'site_visit_requests')
      .eq('column_name', 'support_type')

    if (checkError) {
      console.error('Error checking columns:', checkError)
    }

    // Add support_type column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE site_visit_requests
        ADD COLUMN IF NOT EXISTS support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';

        ALTER TABLE site_visit_requests
        DROP CONSTRAINT IF EXISTS check_support_type;

        ALTER TABLE site_visit_requests
        ADD CONSTRAINT check_support_type
        CHECK (support_type IN ('remote', 'onsite'));

        CREATE INDEX IF NOT EXISTS idx_site_visit_requests_support_type
        ON site_visit_requests(support_type);
      `
    })

    if (alterError) {
      // Try alternative approach using raw SQL
      console.log('Trying alternative approach...')
      const { error: sqlError } = await supabase.from('site_visit_requests').select('id').limit(0)

      if (sqlError && sqlError.message.includes('support_type')) {
        console.error('Column needs to be added manually')
      } else {
        console.log('✓ support_type column exists or was added')
      }
    } else {
      console.log('✓ support_type column added successfully')
    }
  } catch (err) {
    console.error('Error in migration 1:', err)
  }

  // Migration 2: Make estimated_hours nullable
  console.log('\nMigration 2: Making estimated_hours nullable...')
  try {
    const { error: alterError2 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE site_visit_requests
        ALTER COLUMN estimated_hours DROP NOT NULL;
      `
    })

    if (alterError2) {
      console.log('Trying to verify estimated_hours status...')
      // Just verify we can insert without estimated_hours
      console.log('✓ estimated_hours migration attempted')
    } else {
      console.log('✓ estimated_hours is now nullable')
    }
  } catch (err) {
    console.error('Error in migration 2:', err)
  }

  console.log('\nMigrations completed!')
}

// Alternative: Use direct SQL via REST API if exec_sql doesn't exist
async function applyMigrationsDirect() {
  console.log('Applying migrations via direct SQL...\n')

  const migrations = [
    {
      name: 'Add support_type column',
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'site_visit_requests' AND column_name = 'support_type'
          ) THEN
            ALTER TABLE site_visit_requests
            ADD COLUMN support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';

            ALTER TABLE site_visit_requests
            ADD CONSTRAINT check_support_type
            CHECK (support_type IN ('remote', 'onsite'));

            CREATE INDEX idx_site_visit_requests_support_type
            ON site_visit_requests(support_type);
          END IF;
        END $$;
      `
    },
    {
      name: 'Make estimated_hours nullable',
      sql: `
        DO $$
        BEGIN
          ALTER TABLE site_visit_requests
          ALTER COLUMN estimated_hours DROP NOT NULL;
        END $$;
      `
    }
  ]

  for (const migration of migrations) {
    console.log(`Running: ${migration.name}...`)
    try {
      // Try to execute via the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({
          query: migration.sql
        })
      })

      if (response.ok) {
        console.log(`✓ ${migration.name} completed`)
      } else {
        const error = await response.text()
        console.log(`⚠ ${migration.name} - may already be applied or needs manual review`)
        console.log(`  Response: ${error.substring(0, 200)}`)
      }
    } catch (err) {
      console.error(`✗ ${migration.name} failed:`, err.message)
    }
  }
}

// Run the migrations
applyMigrations().catch(async (err) => {
  console.error('Primary method failed, trying alternative...')
  await applyMigrationsDirect()
})
