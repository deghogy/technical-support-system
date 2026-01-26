export default function ApprovalNotificationEmail({
  requesterName,
  requesterEmail,
  siteLocation,
  problemDesc,
  requestedDate,
  estimatedHours,
  approvalLink,
}: {
  requesterName: string
  requesterEmail: string
  siteLocation: string
  problemDesc: string
  requestedDate: string
  estimatedHours: number
  approvalLink: string
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2>New Site Visit Request Pending Approval</h2>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', margin: '16px 0' }}>
        <p><strong>Requester:</strong> {requesterName} ({requesterEmail})</p>
        <p><strong>Site Location:</strong> {siteLocation}</p>
        <p><strong>Problem:</strong> {problemDesc}</p>
        <p><strong>Requested Date:</strong> {requestedDate}</p>
        <p><strong>Estimated Hours:</strong> {estimatedHours}h</p>
      </div>

      <p>
        <a
          href={approvalLink}
          style={{
            backgroundColor: '#1e90ff',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            fontWeight: 'bold',
          }}
        >
          Review & Approve Request
        </a>
      </p>

      <p style={{ color: '#999', fontSize: '12px' }}>
        This is an automated message from Boccard-ID Technical Support System
      </p>
    </div>
  )
}
