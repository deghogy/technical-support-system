import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardIssues from './DashboardIssues'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'approver'].includes(profile?.role ?? '')) redirect('/')

  // Get counts
  const [{ count: pending }, { count: approved }, { count: confirmed }] = await Promise.all([
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'approved'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('visit_status', 'confirmed'),
  ])

  // Get quotas with location names - join with site_visit_requests to get location
  const { data: quotas } = await supabase
    .from('customer_quotas')
    .select('id, customer_email, total_hours, used_hours')
    .order('used_hours', { ascending: false })

  // Get unique locations for each customer from their visit requests
  const { data: customerLocations } = await supabase
    .from('site_visit_requests')
    .select('requester_email, site_location')
    .not('site_location', 'is', null)

  // Build a map of customer email -> primary location (most used)
  const locationMap = new Map<string, string>()
  const locationCount = new Map<string, Map<string, number>>()

  customerLocations?.forEach((visit: any) => {
    const email = visit.requester_email?.toLowerCase()
    const location = visit.site_location
    if (!email || !location) return

    if (!locationCount.has(email)) {
      locationCount.set(email, new Map())
    }
    const counts = locationCount.get(email)!
    counts.set(location, (counts.get(location) || 0) + 1)
  })

  // Get the most frequent location for each customer
  locationCount.forEach((counts, email) => {
    let maxCount = 0
    let primaryLocation = email.split('@')[0] // fallback to email username
    counts.forEach((count, location) => {
      if (count > maxCount) {
        maxCount = count
        primaryLocation = location
      }
    })
    locationMap.set(email, primaryLocation)
  })

  const quotaList = quotas?.map(q => {
    const location = locationMap.get(q.customer_email.toLowerCase()) || q.customer_email.split('@')[0]
    return {
      id: q.id,
      email: q.customer_email,
      location: location,
      total: q.total_hours || 0,
      used: q.used_hours || 0,
      available: (q.total_hours || 0) - (q.used_hours || 0),
      percentage: (q.total_hours || 0) > 0 ? Math.round(((q.used_hours || 0) / q.total_hours) * 100) : 0,
    }
  }) || []

  const quotaSummary = quotas?.reduce((acc, q) => ({
    total: acc.total + (q.total_hours || 0),
    used: acc.used + (q.used_hours || 0),
  }), { total: 0, used: 0 }) || { total: 0, used: 0 }

  // Get scheduled visits that haven't been recorded yet
  const { data: scheduledVisits } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .not('scheduled_date', 'is', null)
    .is('actual_start_time', null)
    .order('scheduled_date', { ascending: true })

  // Fetch issues for the dashboard
  const { data: issues } = await supabase
    .from('issue_log')
    .select('*')
    .order('entry_issue_date', { ascending: false })

  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1200px' }}>

      {/* ========== SECTION 1: SERVICE CONTRACT ACTIVE ========== */}
      <section style={{ marginBottom: '48px' }}>
        {/* Section Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
            Service Contract Active
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Technical support operations overview and scheduled visits
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Pending - Amber/Warning */}
          <div style={{
            padding: '16px',
            background: pending && pending > 0
              ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
              : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: `1px solid ${pending && pending > 0 ? '#FDE68A' : '#BBF7D0'}`,
            borderLeft: `4px solid ${pending && pending > 0 ? '#F59E0B' : '#22C55E'}`,
            borderRadius: '10px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              color: pending && pending > 0 ? '#92400E' : '#166534',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 8px 0'
            }}>
              Pending Requests
            </p>
            {pending && pending > 0 ? (
              <>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#D97706', margin: 0 }}>
                  {pending}
                </p>
                <Link
                  href="/admin/approvals"
                  style={{ fontSize: '12px', color: '#D97706', textDecoration: 'none', marginTop: '6px', display: 'inline-block', fontWeight: 500 }}
                >
                  Review →
                </Link>
              </>
            ) : (
              <>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#16A34A', margin: 0 }}>
                  ✓
                </p>
                <p style={{ fontSize: '12px', color: '#22C55E', margin: '6px 0 0 0' }}>
                  All Good, sir
                </p>
              </>
            )}
          </div>

          {/* Approved - Blue/Info */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            border: '1px solid #BFDBFE',
            borderLeft: '4px solid #3B82F6',
            borderRadius: '10px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
              Approved
            </p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#2563EB', margin: 0 }}>
              {approved ?? 0}
            </p>
            <p style={{ fontSize: '12px', color: '#3B82F6', margin: '6px 0 0 0' }}>
              Scheduled & active
            </p>
          </div>

          {/* Completed - Green/Success */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1px solid #BBF7D0',
            borderLeft: '4px solid #22C55E',
            borderRadius: '10px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
              Completed
            </p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#16A34A', margin: 0 }}>
              {confirmed ?? 0}
            </p>
            <p style={{ fontSize: '12px', color: '#22C55E', margin: '6px 0 0 0' }}>
              Customer confirmed
            </p>
          </div>
        </div>

        {/* Two Column Layout: Visits + Quota */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Left Column - Scheduled Visits */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Upcoming Scheduled Visits
              </h2>
              {scheduledVisits && scheduledVisits.length > 0 && (
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  {scheduledVisits.length} visit{scheduledVisits.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {!scheduledVisits || scheduledVisits.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>
                  No scheduled visits at this time
                </p>
                <Link
                  href="/admin/approvals"
                  style={{ fontSize: '14px', color: '#0077C8', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}
                >
                  Review pending requests →
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '320px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                {scheduledVisits.map((visit: any) => (
                  <div key={visit.id} className="card" style={{ padding: '16px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            {visit.requester_name}
                          </h3>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            ({visit.requester_email})
                          </span>
                        </div>

                        <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#475569' }}>
                          <span style={{ color: '#64748B' }}>Location:</span> {visit.site_location}
                        </p>

                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                          {visit.problem_desc}
                        </p>

                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          <span>
                            <span style={{ color: '#64748B' }}>Scheduled:</span>{' '}
                            <strong>{formatDateOnlyGMT7(visit.scheduled_date)}</strong>
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/admin/visits?id=${visit.id}`}
                        style={{
                          background: '#EAF3FB',
                          color: '#0077C8',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Record Visit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Quota by Location */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Quota by Location
              </h2>
              {quotaList.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {quotaSummary.used}h / {quotaSummary.total}h
                </span>
              )}
            </div>

            {quotaList.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>
                  No quotas configured
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '320px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                {(() => {
                  const maxTotal = Math.max(...quotaList.map(q => q.total), 20)
                  return quotaList.map((q) => (
                    <div key={q.id} className="card" style={{ padding: '12px 14px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '50%'
                        }}>
                          {q.location}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED' }}>
                          {q.available}h <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>avail</span>
                        </span>
                      </div>

                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: '#F3E8FF',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(q.used / maxTotal) * 100}%`,
                          background: q.percentage > 80 ? '#DC2626' : q.percentage > 50 ? '#F59E0B' : '#8B5CF6',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                          {q.used}h used of {q.total}h
                        </p>
                        <p style={{
                          fontSize: '11px',
                          color: q.percentage > 80 ? '#DC2626' : q.percentage > 50 ? '#F59E0B' : '#8B5CF6',
                          margin: 0,
                          fontWeight: 500
                        }}>
                          {q.percentage}%
                        </p>
                      </div>

                      {/* Show email as secondary info */}
                      <p style={{ fontSize: '10px', color: '#94A3B8', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                        {q.email}
                      </p>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: ISSUE LOG OVERVIEW ========== */}
      <section>
        <DashboardIssues initialIssues={issues || []} />
      </section>

    </main>
  )
}
