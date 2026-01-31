import { Resend } from 'resend'
import ApprovalNotificationEmail from '@/components/ApprovalNotificationEmail'
import logger from './logger'
import { createSupabaseRouteClient } from './supabaseRoute'
import { getBaseUrl } from './env'

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

/**
 * Send confirmation email to customer when they submit a new request
 * No admin links included - purely customer-focused
 */
export async function sendCustomerRequestConfirmation({
  requesterName,
  requesterEmail,
  siteLocation,
  problemDesc,
  requestedDate,
  estimatedHours,
  requestId,
  supportType = 'onsite',
}: {
  requesterName: string
  requesterEmail: string
  siteLocation: string
  problemDesc: string
  requestedDate: string
  estimatedHours: number
  requestId: string
  supportType?: 'remote' | 'onsite'
}) {
  const trackingLink = `${getBaseUrl()}/track-request`
  const visitTypeText = supportType === 'remote' ? 'Remote Support' : 'Site Visit'
  const locationLabel = supportType === 'remote' ? 'Location/Remote Area' : 'Site Location'

  try {
    const resend = getResendClient()

    const result = await resend.emails.send({
      from: 'support@boccard-tsns.id',
      to: requesterEmail,
      subject: `Boccard ${visitTypeText} Request Received - ${siteLocation}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your ${visitTypeText} Request Has Been Received</h2>
          <p>Hi ${requesterName},</p>
          <p>Thank you for submitting your request. We have received your ${visitTypeText.toLowerCase()} request and our team will review it shortly.</p>

          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>${locationLabel}:</strong> ${siteLocation}</p>
            <p><strong>Problem Description:</strong> ${problemDesc}</p>
            <p><strong>Requested Date:</strong> ${requestedDate}</p>
            <p><strong>Estimated Hours:</strong> ${estimatedHours}h</p>
          </div>

          <p>You can track the status of your request using the link below:</p>
          <p>
            <a href="${trackingLink}" style="background-color: #1e90ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
              Track Your Request
            </a>
          </p>

          <p style="color: #666; margin-top: 24px;">
            We will notify you once your request has been reviewed and scheduled.
          </p>

          <p style="color: #999; font-size: 12px;">
            This is an automated message from Boccard-ID Technical Support System
          </p>
        </div>
      `,
    })
    logger.info(
      { result: result.data?.id || 'sent', customerEmail: requesterEmail, requestId },
      'Customer request confirmation email sent'
    )
    return { success: true, result }
  } catch (err) {
    logger.error(
      { error: err, customerEmail: requesterEmail, requestId },
      'Failed to send customer request confirmation email'
    )
    return { success: false, error: err }
  }
}

/**
 * Send notification email to admins when a new request is submitted
 * Contains approval link - admin only
 */
export async function sendAdminNewRequestNotification({
  adminEmails,
  requesterName,
  requesterEmail,
  siteLocation,
  problemDesc,
  requestedDate,
  estimatedHours,
  requestId,
  supportType = 'onsite',
}: {
  adminEmails: string[]
  requesterName: string
  requesterEmail: string
  siteLocation: string
  problemDesc: string
  requestedDate: string
  estimatedHours: number
  requestId: string
  supportType?: 'remote' | 'onsite'
}) {
  const approvalLink = `${getBaseUrl()}/admin/approvals`
  const visitTypeText = supportType === 'remote' ? 'Remote Support' : 'Site Visit'
  const locationLabel = supportType === 'remote' ? 'Location/Remote Area' : 'Site Location'

  try {
    const resend = getResendClient()

    // Send to all admins
    const emailPromises = adminEmails.map(async (email) => {
      try {
        const result = await resend.emails.send({
          from: 'support@boccard-tsns.id',
          to: email,
          subject: `[Action Required] New ${visitTypeText} Request - ${siteLocation}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New ${visitTypeText} Request Pending Approval</h2>
              <p>A new ${visitTypeText.toLowerCase()} request has been submitted and requires your review.</p>

              <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Requester:</strong> ${requesterName} (${requesterEmail})</p>
                <p><strong>${locationLabel}:</strong> ${siteLocation}</p>
                <p><strong>Problem:</strong> ${problemDesc}</p>
                <p><strong>Requested Date:</strong> ${requestedDate}</p>
                <p><strong>Estimated Hours:</strong> ${estimatedHours}h</p>
              </div>

              <p>
                <a href="${approvalLink}" style="background-color: #1e90ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  Review & Approve Request
                </a>
              </p>

              <p style="color: #999; font-size: 12px;">
                This is an automated message from Boccard-ID Technical Support System
              </p>
            </div>
          `,
        })
        logger.info(
          { result: result.data?.id || 'sent', adminEmail: email, requestId },
          'Admin notification email sent'
        )
        return { email, success: true, result }
      } catch (err) {
        logger.error(
          { error: err, adminEmail: email, requestId },
          'Failed to send admin notification email'
        )
        return { email, success: false, error: err }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    logger.info(
      { requestId, totalEmails: adminEmails.length, successCount },
      'All admin notification emails processed'
    )

    return { successCount, totalCount: adminEmails.length, results }
  } catch (error) {
    logger.error(
      { error, adminEmails, requestId },
      'Failed to send admin notification emails'
    )
    throw error
  }
}

/**
 * @deprecated Use sendCustomerRequestConfirmation and sendAdminNewRequestNotification instead
 */
export async function sendApprovalNotificationEmail({
  adminEmails,
  requesterName,
  requesterEmail,
  siteLocation,
  problemDesc,
  requestedDate,
  estimatedHours,
  requestId,
  supportType = 'onsite',
}: {
  adminEmails: string[]
  requesterName: string
  requesterEmail: string
  siteLocation: string
  problemDesc: string
  requestedDate: string
  estimatedHours: number
  requestId: string
  supportType?: 'remote' | 'onsite'
}) {
  const approvalLink = `${getBaseUrl()}/admin/approvals`
  const visitTypeText = supportType === 'remote' ? 'Remote Support' : 'Site Visit'

  try {
    const resend = getResendClient()

    // Send to customer as main recipient, admins in CC
    const ccEmails = adminEmails.filter(email => email !== requesterEmail)

    try {
      const result = await resend.emails.send({
        from: 'support@boccard-tsns.id',
        to: requesterEmail,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: `Boccard ${visitTypeText} Request Received - ${siteLocation}`,
        react: ApprovalNotificationEmail({
          requesterName,
          requesterEmail,
          siteLocation,
          problemDesc,
          requestedDate,
          estimatedHours,
          approvalLink,
          supportType,
        }) as React.ReactElement,
      })
      logger.info(
        { result: result.data?.id || 'sent', customerEmail: requesterEmail, ccCount: ccEmails.length, requestId },
        'Approval notification email sent successfully'
      )
      return { successCount: 1, totalCount: 1, results: [{ email: requesterEmail, success: true, result }] }
    } catch (err) {
      logger.error(
        { error: err, customerEmail: requesterEmail, requestId },
        'Failed to send approval notification email'
      )
      return { successCount: 0, totalCount: 1, results: [{ email: requesterEmail, success: false, error: err }] }
    }
  } catch (error) {
    logger.error(
      { error, requestId },
      'Failed to send approval notification emails'
    )
    throw error
  }
}

export async function sendScheduleConfirmationEmail({
  adminEmails,
  requesterEmail,
  requesterName,
  siteLocation,
  scheduledDate,
  durationHours,
  trackingLink,
  supportType = 'onsite',
}: {
  adminEmails: string[]
  requesterEmail: string
  requesterName: string
  siteLocation: string
  scheduledDate: string
  durationHours?: number
  trackingLink: string
  supportType?: 'remote' | 'onsite'
}) {
  try {
    const resend = getResendClient()
    const durationText = durationHours ? `<p><strong>Expected Duration:</strong> ${durationHours} hours</p>` : ''
    const visitTypeText = supportType === 'remote' ? 'Remote Support' : 'Site Visit'
    const greetingText = supportType === 'remote'
      ? `Your remote support session has been approved and scheduled!`
      : `Your site visit has been approved and scheduled!`

    // Send to customer as main recipient, admins in CC
    const ccEmails = adminEmails.filter(email => email !== requesterEmail)

    try {
      const result = await resend.emails.send({
        from: 'support@boccard-tsns.id',
        to: requesterEmail,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: `Boccard ${visitTypeText} Scheduled - ${siteLocation}`,
        html: `
          <h2>Your ${visitTypeText} Has Been Scheduled</h2>
          <p>Hi ${requesterName},</p>
          <p>${greetingText}</p>
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
        { result: result.data?.id || 'sent', customerEmail: requesterEmail, ccCount: ccEmails.length },
        'Schedule confirmation email sent'
      )
      return { successCount: 1, totalCount: 1, results: [{ email: requesterEmail, success: true, result }] }
    } catch (err) {
      logger.error(
        { error: err, customerEmail: requesterEmail },
        'Failed to send schedule confirmation email'
      )
      return { successCount: 0, totalCount: 1, results: [{ email: requesterEmail, success: false, error: err }] }
    }
  } catch (error) {
    logger.error(
      { error },
      'Failed to send schedule confirmation emails'
    )
    throw error
  }
}

export async function sendVisitCompletionEmail({
  adminEmails,
  requesterEmail,
  requesterName,
  siteLocation,
  confirmationLink,
  technicianNotes,
  customerNotes,
  documentUrl,
  supportType = 'onsite',
}: {
  adminEmails: string[]
  requesterEmail: string
  requesterName: string
  siteLocation: string
  confirmationLink: string
  technicianNotes?: string | null
  customerNotes?: string | null
  documentUrl?: string | null
  supportType?: 'remote' | 'onsite'
}) {
  try {
    const resend = getResendClient()

    // Build email body with notes and document
    const technicianNotesHtml = technicianNotes
      ? `<div style="background-color: #EAF3FB; padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 3px solid #0077C8;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #0077C8;">📝 Technician Notes:</p>
          <p style="margin: 0; color: #475569;">${technicianNotes}</p>
        </div>`
      : ''

    const customerNotesHtml = customerNotes
      ? `<div style="background-color: #F0FDF4; padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 3px solid #22C55E;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #166534;">💬 Customer Notes:</p>
          <p style="margin: 0; color: #475569;">${customerNotes}</p>
        </div>`
      : ''

    const documentHtml = documentUrl
      ? `<div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; margin: 12px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold;">📎 Attached Document:</p>
          <a href="${documentUrl}" style="background-color: #0077C8; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; display: inline-block; font-size: 14px;">
            Download Document
          </a>
        </div>`
      : ''

    // Determine visit type text
    const visitTypeText = supportType === 'remote' ? 'Remote Support' : 'Site Visit'
    const completedText = supportType === 'remote'
      ? `Your remote support session for <strong>${siteLocation}</strong> has been completed by our technician.`
      : `Your site visit at <strong>${siteLocation}</strong> has been completed by our technician.`

    // Send to customer as main recipient, admins in CC
    const ccEmails = adminEmails.filter(email => email !== requesterEmail)

    try {
      const result = await resend.emails.send({
        from: 'support@boccard-tsns.id',
        to: requesterEmail,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        subject: `Boccard ${visitTypeText} Completed - ${siteLocation}`,
        html: `
          <h2>${visitTypeText} Completed</h2>
          <p>Hi ${requesterName},</p>
          <p>${completedText}</p>
          ${technicianNotesHtml}
          ${customerNotesHtml}
          ${documentHtml}
          <p>Please review the visit details and confirm that the work was completed to your satisfaction.</p>
          <p>
            <a href="${confirmationLink}" style="background-color: #1e90ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
              Confirm ${visitTypeText} Completion
            </a>
          </p>
          <p style="color: #999; font-size: 12px;">
            This is an automated message from Boccard-ID Technical Support System
          </p>
        `,
      })
      logger.info(
        { result: result.data?.id || 'sent', customerEmail: requesterEmail, ccCount: ccEmails.length },
        'Visit completion email sent'
      )
      return { successCount: 1, totalCount: 1, results: [{ email: requesterEmail, success: true, result }] }
    } catch (err) {
      logger.error(
        { error: err, customerEmail: requesterEmail },
        'Failed to send visit completion email'
      )
      return { successCount: 0, totalCount: 1, results: [{ email: requesterEmail, success: false, error: err }] }
    }
  } catch (error) {
    logger.error(
      { error },
      'Failed to send visit completion emails'
    )
    throw error
  }
}
