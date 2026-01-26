import { Resend } from 'resend'
import ApprovalNotificationEmail from '@/components/ApprovalNotificationEmail'
import logger from './logger'

// Fallback email for admin notifications if no admins exist
const FALLBACK_ADMIN_EMAIL = process.env.FALLBACK_ADMIN_EMAIL || 'suboccardindonesia@gmail.com'

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
  adminEmail,
  requesterName,
  requesterEmail,
  siteLocation,
  problemDesc,
  requestedDate,
  estimatedHours,
  requestId,
}: {
  adminEmail: string
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
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: adminEmail,
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
      { result: result.id, adminEmail, requestId },
      'Approval notification email sent successfully'
    )
    return result
  } catch (error) {
    logger.error(
      { error, adminEmail, requestId },
      'Failed to send approval notification email'
    )
    throw error
  }
}

export async function sendScheduleConfirmationEmail({
  customerEmail,
  requesterName,
  siteLocation,
  scheduledDate,
  durationHours,
  trackingLink,
}: {
  customerEmail: string
  requesterName: string
  siteLocation: string
  scheduledDate: string
  durationHours: number
  trackingLink: string
}) {
  try {
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: customerEmail,
      subject: `Boccard Visit Scheduled: ${siteLocation}`,
      html: `
        <h2>A Visit Has Been Scheduled</h2>
        <p>Hi ${requesterName},</p>
        <p>A site visit request has been approved and scheduled!</p>
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Location:</strong> ${siteLocation}</p>
          <p><strong>Scheduled Date:</strong> ${scheduledDate}</p>
          <p><strong>Expected Duration:</strong> ${durationHours} hours</p>
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
      { result: result.id, email: customerEmail },
      'Schedule confirmation email sent'
    )
    return result
  } catch (error) {
    logger.error(
      { error, email: customerEmail },
      'Failed to send schedule confirmation email'
    )
    throw error
  }
}

export async function sendVisitCompletionEmail({
  customerEmail,
  requesterName,
  siteLocation,
  confirmationLink,
}: {
  customerEmail: string
  requesterName: string
  siteLocation: string
  confirmationLink: string
}) {
  try {
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: customerEmail,
      subject: `Visit Complete: Please Confirm - ${siteLocation}`,
      html: `
        <h2>Site Visit Completed</h2>
        <p>Hi ${requesterName},</p>
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
      { result: result.id, email: customerEmail },
      'Visit completion email sent'
    )
    return result
  } catch (error) {
    logger.error(
      { error, email: customerEmail },
      'Failed to send visit completion email'
    )
    throw error
  }
}
