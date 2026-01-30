import { Resend } from 'resend'
import ApprovalNotificationEmail from '@/components/ApprovalNotificationEmail'
import logger from './logger'
import { createSupabaseRouteClient } from './supabaseRoute'

// Fallback email for admin notifications if no admins exist
const FALLBACK_ADMIN_EMAIL = process.env.FALLBACK_ADMIN_EMAIL || 'suboccardindonesia@gmail.com'

/**
 * Fetch all admin and approver email addresses from the database
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const supabase = await createSupabaseRouteClient()

    const { data: admins, error } = await supabase
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'approver'])

    if (error) {
      logger.error({ error }, 'Failed to fetch admin emails from database')
      return [FALLBACK_ADMIN_EMAIL]
    }

    const emails = admins?.map(a => a.email).filter(Boolean) || []

    if (emails.length === 0) {
      logger.warn('No admins found in database, using fallback email')
      return [FALLBACK_ADMIN_EMAIL]
    }

    logger.info({ adminCount: emails.length }, 'Fetched admin emails')
    return emails
  } catch (error) {
    logger.error({ error }, 'Error fetching admin emails')
    return [FALLBACK_ADMIN_EMAIL]
  }
}

// Lazily initialize Resend to avoid build-time errors when API key is missing
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error('RESEND_API_KEY environment variable is not set')
    logger.error({ error }, 'Resend API key is missing')
    throw error
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export { getResendClient }

export async function sendApprovalNotificationEmail({
  adminEmails,
  requesterName,
  requesterEmail,
  siteLocation,
  problemDesc,
  requestedDate,
  estimatedHours,
  requestId,
}: {
  adminEmails: string[]
  requesterName: string
  requesterEmail: string
  siteLocation: string
  problemDesc: string
  requestedDate: string
  estimatedHours: number
  requestId: string
}) {
  const approvalLink = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/approvals`

  try {
    const resend = getResendClient()

    // Send to all admins in parallel
    const emailPromises = adminEmails.map(async (email) => {
      try {
        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: `New Request: ${siteLocation} - Approval Needed`,
          react: ApprovalNotificationEmail({
            requesterName,
            requesterEmail,
            siteLocation,
            problemDesc,
            requestedDate,
            estimatedHours,
            approvalLink,
          }) as React.ReactElement,
        })
        logger.info(
          { result: result.data?.id || 'sent', adminEmail: email, requestId },
          'Approval notification email sent successfully'
        )
        return { email, success: true, result }
      } catch (err) {
        logger.error(
          { error: err, adminEmail: email, requestId },
          'Failed to send approval notification email to admin'
        )
        return { email, success: false, error: err }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    logger.info(
      { requestId, totalEmails: adminEmails.length, successCount },
      'All approval notification emails processed'
    )

    return { successCount, totalCount: adminEmails.length, results }
  } catch (error) {
    logger.error(
      { error, adminEmails, requestId },
      'Failed to send approval notification emails'
    )
    throw error
  }
}

export async function sendScheduleConfirmationEmail({
  adminEmails,
  requesterName,
  siteLocation,
  scheduledDate,
  durationHours,
  trackingLink,
}: {
  adminEmails: string[]
  requesterName: string
  siteLocation: string
  scheduledDate: string
  durationHours?: number
  trackingLink: string
}) {
  try {
    const resend = getResendClient()
    const durationText = durationHours ? `<p><strong>Expected Duration:</strong> ${durationHours} hours</p>` : ''

    // Send to all admins in parallel
    const emailPromises = adminEmails.map(async (email) => {
      try {
        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Boccard Visit Scheduled',
          html: `
            <h2>A Visit Has Been Scheduled</h2>
            <p>Hi Boccard Admin,</p>
            <p>A site visit request has been approved and scheduled!</p>
            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Location:</strong> ${siteLocation}</p>
              <p><strong>Scheduled Date:</strong> ${scheduledDate}</p>
              ${durationText}
            </div>
            <p>
              <a href="${trackingLink}" style="background-color: #1e90ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                Track Your Request
              </a>
            </p>
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Boccard-ID Technical Support System
            </p>
          `,
        })
        logger.info(
          { result: result.data?.id || 'sent', email },
          'Schedule confirmation email sent'
        )
        return { email, success: true, result }
      } catch (err) {
        logger.error(
          { error: err, email },
          'Failed to send schedule confirmation email to admin'
        )
        return { email, success: false, error: err }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    logger.info(
      { totalEmails: adminEmails.length, successCount },
      'All schedule confirmation emails processed'
    )

    return { successCount, totalCount: adminEmails.length, results }
  } catch (error) {
    logger.error(
      { error, adminEmails },
      'Failed to send schedule confirmation emails'
    )
    throw error
  }
}

export async function sendVisitCompletionEmail({
  adminEmails,
  requesterName,
  siteLocation,
  confirmationLink,
}: {
  adminEmails: string[]
  requesterName: string
  siteLocation: string
  confirmationLink: string
}) {
  try {
    const resend = getResendClient()

    // Send to all admins in parallel
    const emailPromises = adminEmails.map(async (email) => {
      try {
        const result = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Boccard Visit Confirmed',
          html: `
            <h2>Site Visit Completed</h2>
            <p>Hi Boccard Admin,</p>
            <p>Your scheduled site visit at <strong>${siteLocation}</strong> has been completed by our technician.</p>
            <p>Please review the visit details and confirm that the work was completed to your satisfaction.</p>
            <p>
              <a href="${confirmationLink}" style="background-color: #1e90ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                Confirm Visit Completion
              </a>
            </p>
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Boccard-ID Technical Support System
            </p>
          `,
        })
        logger.info(
          { result: result.data?.id || 'sent', email },
          'Visit completion email sent'
        )
        return { email, success: true, result }
      } catch (err) {
        logger.error(
          { error: err, email },
          'Failed to send visit completion email to admin'
        )
        return { email, success: false, error: err }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    logger.info(
      { totalEmails: adminEmails.length, successCount },
      'All visit completion emails processed'
    )

    return { successCount, totalCount: adminEmails.length, results }
  } catch (error) {
    logger.error(
      { error, adminEmails },
      'Failed to send visit completion emails'
    )
    throw error
  }
}
