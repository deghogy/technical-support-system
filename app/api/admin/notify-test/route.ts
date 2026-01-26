import { NextResponse, type NextRequest } from 'next/server'
import { sendApprovalNotificationEmail } from '@/lib/emailService'
import logger from '@/lib/logger'

/**
 * Test endpoint to verify email notification system is working
 * Usage: POST /api/admin/notify-test with body { email: "test@example.com" }
 * Or: GET /api/admin/notify-test?email=test@example.com
 */

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { message: 'Missing email parameter. Use: ?email=test@example.com' },
      { status: 400 }
    )
  }

  try {
    logger.info({ email }, 'Sending test notification email')

    await sendApprovalNotificationEmail({
      adminEmail: email,
      requesterName: 'Test User',
      requesterEmail: 'test-requester@example.com',
      siteLocation: 'Test Location - Jakarta HQ',
      problemDesc: 'This is a test notification. If you received this email, the email service is working correctly.',
      requestedDate: new Date().toLocaleDateString(),
      estimatedHours: 2,
      requestId: 'test-' + Date.now(),
    })

    logger.info({ email }, 'Test email sent successfully')

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      note: 'Check your inbox (may take 1-2 minutes) or Resend dashboard for delivery status',
    })
  } catch (error) {
    logger.error({ error, email }, 'Failed to send test email')

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Verify RESEND_API_KEY is set in .env.local',
          'Check that Resend account is active and API key is valid',
          'Ensure email address is valid',
          'Check server logs for detailed error message',
        ],
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email

    if (!email) {
      return NextResponse.json(
        { message: 'Missing email in request body' },
        { status: 400 }
      )
    }

    logger.info({ email }, 'Sending test notification email via POST')

    await sendApprovalNotificationEmail({
      adminEmail: email,
      requesterName: 'Test User',
      requesterEmail: 'test-requester@example.com',
      siteLocation: 'Test Location - Jakarta HQ',
      problemDesc: 'This is a test notification. If you received this email, the email service is working correctly.',
      requestedDate: new Date().toLocaleDateString(),
      estimatedHours: 2,
      requestId: 'test-' + Date.now(),
    })

    logger.info({ email }, 'Test email sent successfully')

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      note: 'Check your inbox (may take 1-2 minutes) or Resend dashboard for delivery status',
    })
  } catch (error) {
    logger.error({ error }, 'Failed to send test email')

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Verify RESEND_API_KEY is set in .env.local',
          'Check that Resend account is active and API key is valid',
          'Ensure email address is valid',
          'Check server logs for detailed error message',
        ],
      },
      { status: 500 }
    )
  }
}
