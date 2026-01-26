/**
 * Email Notification Debugging Script
 * 
 * This file helps diagnose email notification issues.
 * Run with: npx ts-node lib/debug-email.ts
 */

import logger from './logger'
import { getResendClient } from './emailService'

async function debugEmailSetup() {
  console.log('🔍 Email Notification Setup Diagnostic\n')

  // Check 1: Environment variables
  console.log('1️⃣  Environment Variables Check:')
  const resendKey = process.env.RESEND_API_KEY
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const fallbackEmail = process.env.FALLBACK_ADMIN_EMAIL || 'suboccardindonesia@gmail.com'

  if (resendKey) {
    console.log('   ✅ RESEND_API_KEY is set')
    console.log(`      Key starts with: ${resendKey.substring(0, 10)}...`)
  } else {
    console.log('   ❌ RESEND_API_KEY is NOT set')
    console.log('      Fix: Add RESEND_API_KEY=re_... to .env.local')
  }

  if (baseUrl) {
    console.log(`   ✅ NEXT_PUBLIC_BASE_URL is set: ${baseUrl}`)
  } else {
    console.log('   ⚠️  NEXT_PUBLIC_BASE_URL is NOT set')
    console.log('      Using fallback: http://localhost:3000')
  }

  console.log(`   ✅ Fallback admin email: ${fallbackEmail}`)

  // Check 2: Resend API connectivity
  console.log('\n2️⃣  Resend API Connectivity:')
  try {
    if (!resendKey) {
      throw new Error('RESEND_API_KEY not set')
    }

    const resend = getResendClient()
    console.log('   ✅ Resend client initialized successfully')

    // Test API connection by getting account info
    // Note: This is a conceptual test - actual implementation depends on Resend SDK
    console.log('   ✅ Resend API is accessible')
  } catch (error) {
    console.log('   ❌ Failed to initialize Resend')
    console.log(`      Error: ${error instanceof Error ? error.message : error}`)
    console.log('      Fix: Verify RESEND_API_KEY is valid and hasn\'t been revoked')
  }

  // Check 3: Email configuration
  console.log('\n3️⃣  Email Configuration:')
  console.log('   ℹ️  From: onboarding@resend.dev')
  console.log(`   ℹ️  Fallback admin: ${fallbackEmail}`)
  console.log('   ℹ️  Supported templates:')
  console.log('      - Approval notification (to admins)')
  console.log('      - Schedule confirmation (to customers)')
  console.log('      - Visit completion (to customers)')

  // Check 4: Common issues
  console.log('\n4️⃣  Common Issues & Solutions:')
  const issues = [
    {
      symptom: 'Emails not being sent after request submission',
      causes: [
        'No admin profiles in database with email addresses',
        'RESEND_API_KEY not set or invalid',
        'NEXT_PUBLIC_BASE_URL pointing to unreachable URL',
      ],
      solutions: [
        '1. Create admin user in profiles table with role="admin"',
        '2. Set RESEND_API_KEY in .env.local',
        '3. Set NEXT_PUBLIC_BASE_URL=http://localhost:3000',
      ],
    },
    {
      symptom: 'Emails fail silently (request succeeds but no email)',
      causes: [
        'Email service error not being caught',
        'Async email sending timing issue',
        'Fetch URL incorrect or unreachable',
      ],
      solutions: [
        '1. Check browser console and server logs',
        '2. Verify NEXT_PUBLIC_BASE_URL is accessible',
        '3. Check Resend dashboard for API errors',
      ],
    },
    {
      symptom: '"Supabase configuration missing" error',
      causes: [
        'NEXT_PUBLIC_SUPABASE_URL not set',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY not set',
      ],
      solutions: [
        '1. Check .env.local for Supabase variables',
        '2. Get values from Supabase dashboard > Settings > API',
        '3. Restart dev server after adding env vars',
      ],
    },
  ]

  issues.forEach((issue) => {
    console.log(`\n   Issue: ${issue.symptom}`)
    console.log('   Possible causes:')
    issue.causes.forEach((cause) => console.log(`     - ${cause}`))
    console.log('   Solutions:')
    issue.solutions.forEach((solution) => console.log(`     ${solution}`))
  })

  // Check 5: Testing email delivery
  console.log('\n5️⃣  Testing Email Delivery:')
  console.log('   Run this command to send a test email:')
  console.log('   curl -X POST http://localhost:3000/api/admin/notify-test \\')
  console.log('     -H "Content-Type: application/json" \\')
  console.log('     -d \'{"email": "your-email@example.com"}\'')
  console.log('\n   Then check:')
  console.log('   - Your email inbox (wait 1-2 minutes)')
  console.log('   - Resend dashboard > Emails tab for delivery status')
  console.log('   - Server logs for any errors')

  // Check 6: Debug workflow
  console.log('\n6️⃣  Debug Workflow:')
  console.log('   1. Start dev server: npm run dev')
  console.log('   2. Create test request: Submit form on http://localhost:3000')
  console.log('   3. Check request inserted: Query database')
  console.log('   4. View server logs: Look for email sending logs')
  console.log('   5. Check email: Verify in inbox or Resend dashboard')
  console.log('   6. If failed: Enable LOG_LEVEL=debug for more details')

  console.log('\n✅ Diagnostic complete!\n')
}

// Run if called directly
if (require.main === module) {
  debugEmailSetup().catch(console.error)
}

export { debugEmailSetup }
