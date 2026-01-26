import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import ApprovalActions from '@/components/ApprovalActions'

export default async function ApprovalsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // allow either 'admin' or 'approver' to manage approvals
  if (!['admin','approver'].includes(profile?.role ?? '')) {
    redirect('/')
  }

  const { data: requests } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1>Pending Site Visit Requests</h1>

      {requests?.length === 0 && <p>No pending requests</p>}

      {requests?.map((req) => (
        <div key={req.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0 }}><b>{req.requester_name}</b> <small style={{ color: 'var(--muted)' }}>({req.requester_email})</small></p>
              <p style={{ margin: '6px 0' }}>📍 {req.site_location}</p>
              <p style={{ margin: '6px 0' }}>{req.problem_desc}</p>
              <p style={{ margin: '6px 0', color: 'var(--muted)' }}>📅 Requested: {formatDateOnlyGMT7(req.requested_date)}</p>

              {req.scheduled_date && (
                <p style={{ margin: '6px 0', color: 'var(--muted)' }}>📅 Scheduled: {formatDateOnlyGMT7(req.scheduled_date)} • ⏱ {req.duration_hours ?? req.estimated_hours}h</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ApprovalActions id={req.id} requestedDate={req.requested_date} />
            </div>
          </div>
        </div>
      ))}
    </main>
  )
}
