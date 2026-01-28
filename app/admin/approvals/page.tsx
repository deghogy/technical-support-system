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

  if (!['admin','approver'].includes(profile?.role ?? '')) {
    redirect('/')
  }

  const { data: requests } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Pending Approvals
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Review and approve site visit requests
        </p>
      </div>

      {requests?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ color: '#64748B', margin: 0, fontSize: '15px' }}>
            No pending requests at this time
          </p>
          <p style={{ color: '#94A3B8', margin: '8px 0 0 0', fontSize: '13px' }}>
            All requests have been processed
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests?.map((req) => (
            <div key={req.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* Requester Info */}
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px 0' }}>
                      {req.requester_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      {req.requester_email}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Location
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>
                        {req.site_location}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Requested Date
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>
                        {formatDateOnlyGMT7(req.requested_date)}
                      </p>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Problem Description
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                      {req.problem_desc}
                    </p>
                  </div>

                  {/* Estimated Hours */}
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#64748B' }}>
                        Estimated Hours
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>
                        {req.estimated_hours}h
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ minWidth: '180px' }}>
                  <ApprovalActions id={req.id} requestedDate={req.requested_date} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
