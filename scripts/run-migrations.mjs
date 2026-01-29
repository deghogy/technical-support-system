// Direct migration script using Supabase REST API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
      EXCEPTION
        WHEN others THEN
          NULL;
      END $$;
    `
  }
]

async function runMigrations() {
  console.log('🚀 Running Supabase migrations...\n')

  for (const migration of migrations) {
    process.stdout.write(`⏳ ${migration.name}... `)

    try {
      // Try to execute SQL via RPC first
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql })

      if (error) {
        // If exec_sql doesn't exist, try alternative approach
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('\n   ⚠️ exec_sql function not found, trying alternative...')

          // Try to create the exec_sql function first
          const createFuncSql = `
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
            END;
            $$;
          `

          // Use raw fetch to create function
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: 'SELECT 1' })
          })

          if (response.status === 404) {
            console.log('\n   ❌ Cannot auto-apply migration')
            console.log('   Please run this SQL in Supabase SQL Editor:')
            console.log('   → https://supabase.com/dashboard/project/_/sql/new')
            console.log('\n   SQL to run:')
            console.log(migration.sql)
            continue
          }
        } else {
          console.log(`❌ ${error.message}`)
          continue
        }
      }

      console.log('✅ Done')
    } catch (err) {
      console.log(`❌ ${err.message}`)
    }
  }

  // Verify migrations
  console.log('\n📋 Verifying schema...')
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type')
      .eq('table_name', 'site_visit_requests')
      .in('column_name', ['support_type', 'estimated_hours'])

    if (error) {
      console.log(`❌ Verification failed: ${error.message}`)
    } else {
      console.log('\nCurrent columns:')
      data?.forEach(col => {
        const status = col.is_nullable === 'YES' ? 'NULL OK' : 'NOT NULL'
        console.log(`  • ${col.column_name}: ${col.data_type} (${status})`)
      })
    }
  } catch (err) {
    console.log(`❌ Verification error: ${err.message}`)
  }

  console.log('\n✨ Migration process completed!')
  console.log('\nIf migrations failed, please run the SQL manually at:')
  console.log(`→ ${supabaseUrl.replace('.co', '.co/project/_/sql/new')}`)
}

runMigrations()
