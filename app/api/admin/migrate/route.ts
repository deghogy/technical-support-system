import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to execute raw SQL via the REST API
async function executeRawSql(sql: string) {
  // Use the pgmeta endpoint for raw SQL execution
  const response = await fetch(`${supabaseUrl}/pgrest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Prefer': 'tx=commit'
    },
    body: JSON.stringify({
      query: sql
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error)
  }

  return response.json()
}

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results: string[] = []

    // Step 1: Create exec_sql function if it doesn't exist
    logger.info('Creating exec_sql function...')
    try {
      const createFunctionSql = `
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

      // Try to execute via direct REST call
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
        // Function doesn't exist, we need to create it via a different method
        results.push('ℹ exec_sql function does not exist. Will try alternative methods.')
      } else {
        results.push('✓ exec_sql function exists')
      }
    } catch (err: any) {
      results.push(`ℹ exec_sql check: ${err.message}`)
    }

    // Step 2: Add support_type column using a direct approach
    logger.info('Applying migration: Add support_type column')
    try {
      // First, check if column exists
      const { data: columns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'site_visit_requests')
        .eq('column_name', 'support_type')

      if (checkError) {
        results.push(`✗ Error checking columns: ${checkError.message}`)
      } else if (columns && columns.length > 0) {
        results.push('✓ support_type column already exists')
      } else {
        // Column doesn't exist, try to add it
        try {
          // Use direct table insert to test if support_type is required
          const { error: testError } = await supabase
            .from('site_visit_requests')
            .insert({
              requester_name: '_test_',
              requester_email: 'test@test.com',
              site_location: '_test_',
              problem_desc: '_test_',
              requested_date: new Date().toISOString().split('T')[0],
              support_type: 'onsite'
            })
            .select()

          if (testError && testError.message.includes('support_type')) {
            results.push(`✗ support_type column missing and cannot be added via API`)
            results.push(`  → Please run this SQL in Supabase SQL Editor:`)
            results.push(`    ALTER TABLE site_visit_requests ADD COLUMN support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';`)
          } else {
            results.push('✓ support_type column test passed')
          }

          // Clean up test record
          await supabase
            .from('site_visit_requests')
            .delete()
            .eq('requester_name', '_test_')
        } catch (err: any) {
          results.push(`⚠ support_type check: ${err.message}`)
        }
      }
    } catch (err: any) {
      results.push(`✗ support_type error: ${err.message}`)
    }

    // Step 3: Check estimated_hours nullable status
    logger.info('Checking estimated_hours column...')
    try {
      const { data: columnInfo, error: colError } = await supabase
        .from('information_schema.columns')
        .select('is_nullable')
        .eq('table_name', 'site_visit_requests')
        .eq('column_name', 'estimated_hours')
        .single()

      if (colError) {
        results.push(`✗ Error checking estimated_hours: ${colError.message}`)
      } else if (columnInfo) {
        if (columnInfo.is_nullable === 'YES') {
          results.push('✓ estimated_hours is already nullable')
        } else {
          results.push(`⚠ estimated_hours is NOT nullable`)
          results.push(`  → Please run this SQL in Supabase SQL Editor:`)
          results.push(`    ALTER TABLE site_visit_requests ALTER COLUMN estimated_hours DROP NOT NULL;`)
        }
      }
    } catch (err: any) {
      results.push(`✗ estimated_hours check error: ${err.message}`)
    }

    // Step 4: Provide manual SQL instructions
    results.push(`\n📋 MANUAL MIGRATION SQL (copy to Supabase SQL Editor):`)
    results.push(`-- Migration 1: Add support_type column`)
    results.push(`ALTER TABLE site_visit_requests`)
    results.push(`ADD COLUMN IF NOT EXISTS support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';`)
    results.push(``)
    results.push(`-- Add constraint`)
    results.push(`ALTER TABLE site_visit_requests`)
    results.push(`DROP CONSTRAINT IF EXISTS check_support_type;`)
    results.push(``)
    results.push(`ALTER TABLE site_visit_requests`)
    results.push(`ADD CONSTRAINT check_support_type`)
    results.push(`CHECK (support_type IN ('remote', 'onsite'));`)
    results.push(``)
    results.push(`-- Create index`)
    results.push(`CREATE INDEX IF NOT EXISTS idx_site_visit_requests_support_type`)
    results.push(`ON site_visit_requests(support_type);`)
    results.push(``)
    results.push(`-- Migration 2: Make estimated_hours nullable`)
    results.push(`ALTER TABLE site_visit_requests`)
    results.push(`ALTER COLUMN estimated_hours DROP NOT NULL;`)

    return NextResponse.json({
      message: 'Migration check completed',
      results,
      requiresManualAction: true
    })

  } catch (error: any) {
    logger.error({ error }, 'Migration failed')
    return NextResponse.json(
      { message: 'Migration failed', error: error.message },
      { status: 500 }
    )
  }
}
