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
            <div key={req.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'start' }}>
                {/* Left Content */}
                <div>
                  {/* Requester Info */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        {req.requester_name}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#64748B',
                        background: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>
                        {req.requester_email}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                        Location
                      </p>
                      <p style={{ margin: 0, fontSize: '15px', color: '#0F172A', fontWeight: 500 }}>
                        {req.site_location}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                        Requested Date
                      </p>
                      <p style={{ margin: 0, fontSize: '15px', color: '#0F172A', fontWeight: 500 }}>
                        {formatDateOnlyGMT7(req.requested_date)}
                      </p>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Problem Description
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                      {req.problem_desc}
                    </p>
                  </div>
                </div>

                {/* Actions - Right Side */}
                <div style={{ minWidth: '200px', paddingLeft: '24px', borderLeft: '1px solid #E2E8F0' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Actions
                  </p>
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
