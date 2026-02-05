/**
 * Query Performance Analyzer
 *
 * Run this script to analyze slow queries in your Supabase database:
 * npx tsx scripts/analyze-queries.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function analyzeQueryPerformance() {
  console.log('🔍 Analyzing query performance...\n')

  // Test 1: Track request query (by email)
  console.log('Test 1: Track request query (by email)')
  const start1 = Date.now()
  const { data: trackData, error: trackError } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('requester_email', 'test@example.com')
    .order('created_at', { ascending: false })
  const duration1 = Date.now() - start1
  console.log(`  Duration: ${duration1}ms`)
  console.log(`  Rows returned: ${trackData?.length || 0}`)
  console.log(`  Status: ${trackError ? '❌ ERROR' : '✅ OK'}\n`)

  // Test 2: Dashboard stats query
  console.log('Test 2: Dashboard stats (status counts)')
  const start2 = Date.now()
  const [{ count: pending }, { count: approved }, { count: confirmed }] = await Promise.all([
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'approved'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('visit_status', 'confirmed'),
  ])
  const duration2 = Date.now() - start2
  console.log(`  Duration: ${duration2}ms`)
  console.log(`  Pending: ${pending}, Approved: ${approved}, Confirmed: ${confirmed}`)
  console.log(`  Status: ✅ OK\n`)

  // Test 3: Scheduled visits query
  console.log('Test 3: Scheduled visits (admin dashboard)')
  const start3 = Date.now()
  const { data: scheduledData, error: scheduledError } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .not('scheduled_date', 'is', null)
    .is('actual_start_time', null)
    .order('scheduled_date', { ascending: true })
  const duration3 = Date.now() - start3
  console.log(`  Duration: ${duration3}ms`)
  console.log(`  Rows returned: ${scheduledData?.length || 0}`)
  console.log(`  Status: ${scheduledError ? '❌ ERROR' : '✅ OK'}\n`)

  // Test 4: Quota lookup
  console.log('Test 4: Quota lookup (by email)')
  const start4 = Date.now()
  const { data: quotaData, error: quotaError } = await supabase
    .from('customer_quotas')
    .select('*')
    .eq('customer_email', 'test@example.com')
    .single()
  const duration4 = Date.now() - start4
  console.log(`  Duration: ${duration4}ms`)
  console.log(`  Status: ${quotaError && quotaError.code !== 'PGRST116' ? '❌ ERROR' : '✅ OK'}\n`)

  // Test 5: Profile lookup by ID
  console.log('Test 5: Profile lookup (by ID)')
  const start5 = Date.now()
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .maybeSingle()
  const duration5 = Date.now() - start5
  console.log(`  Duration: ${duration5}ms`)
  console.log(`  Status: ${profileError ? '❌ ERROR' : '✅ OK'}\n`)

  // Summary
  console.log('📊 Summary:')
  console.log('-----------')
  const slowQueries = []
  if (duration1 > 100) slowQueries.push(`Track request query: ${duration1}ms`)
  if (duration2 > 100) slowQueries.push(`Dashboard stats: ${duration2}ms`)
  if (duration3 > 100) slowQueries.push(`Scheduled visits: ${duration3}ms`)
  if (duration4 > 100) slowQueries.push(`Quota lookup: ${duration4}ms`)
  if (duration5 > 100) slowQueries.push(`Profile lookup: ${duration5}ms`)

  if (slowQueries.length > 0) {
    console.log('⚠️  Slow queries detected (>100ms):')
    slowQueries.forEach(q => console.log(`   - ${q}`))
    console.log('\n💡 Run the migration to add performance indexes:')
    console.log('   20260205000000_add_performance_indexes.sql')
  } else {
    console.log('✅ All queries are fast (<100ms)')
  }
}

analyzeQueryPerformance().catch(console.error)
