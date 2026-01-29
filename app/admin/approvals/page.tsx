import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import ApprovalActions from '@/components/ApprovalActions'

function isRemoteVisit(location: string): boolean {
  return location?.includes('Automation - Boccard Indonesia') || false
}

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
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1000px' }}>
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
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <p style={{ color: '#64748B', margin: 0, fontSize: '15px' }}>
            No pending requests at this time
          </p>
          <p style={{ color: '#94A3B8', margin: '8px 0 0 0', fontSize: '13px' }}>
            All requests have been processed
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests?.map((req) => {
            const isRemote = isRemoteVisit(req.site_location)

            return (
              <div
                key={req.id}
                className="card"
                style={{
                  padding: '20px',
                  borderLeft: isRemote ? '4px solid #8B5CF6' : '4px solid #0077C8',
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {/* Type Indicator */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '12px',
                    background: isRemote ? '#F3E8FF' : '#EAF3FB',
                    borderRadius: '8px',
                    minWidth: '70px',
                  }}>
                    <span style={{ fontSize: '24px' }}>{isRemote ? '💻' : '📍'}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: isRemote ? '#7C3AED' : '#0077C8',
                      textTransform: 'uppercase',
                    }}>
                      {isRemote ? 'Remote' : 'On-site'}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Requester Info */}
                    <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                          {req.requester_name}
                        </h3>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#64748B',
                          background: '#F1F5F9',
                          padding: '3px 10px',
                          borderRadius: '4px',
                        }}>
                          {req.requester_email}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                          Location
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>
                          {req.site_location}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 3px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                          Requested Date
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>
                          {formatDateOnlyGMT7(req.requested_date)}
                        </p>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                        Problem Description
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                        {req.problem_desc}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ minWidth: '180px', paddingLeft: '20px', borderLeft: '1px solid #E2E8F0' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Actions
                    </p>
                    <ApprovalActions id={req.id} requestedDate={req.requested_date} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
