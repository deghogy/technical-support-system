import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
  const [{ count: pending }, { count: approved }, { count: rejected }, { count: confirmed }] = await Promise.all([
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'approved'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('status', 'rejected'),
    supabase.from('site_visit_requests').select('id', { count: 'exact' }).eq('visit_status', 'confirmed'),
  ])

  // Get scheduled visits that haven't been recorded yet
  const { data: scheduledVisits } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .not('scheduled_date', 'is', null)
    .is('actual_start_time', null)
    .order('scheduled_date', { ascending: true })

  // Get conducted hours by site location
  const { data: conductedByLocation } = await supabase
    .from('site_visit_requests')
    .select('site_location, duration_hours')
    .eq('visit_status', 'confirmed')

  // Group and sum hours by location
  const hoursMap = new Map<string, number>()
  conductedByLocation?.forEach((item: any) => {
    const location = item.site_location || 'Unknown'
    const hours = item.duration_hours || 0
    hoursMap.set(location, (hoursMap.get(location) || 0) + hours)
  })

  const conductedByLocationArray = Array.from(hoursMap.entries())
    .map(([location, hours]) => ({ location, hours }))
    .sort((a, b) => b.hours - a.hours)

  const totalHours = conductedByLocationArray.reduce((sum, item) => sum + item.hours, 0)

  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Engineering Dashboard
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Technical support operations overview and scheduled visits
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
            Pending Requests
          </p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: pending && pending > 0 ? '#0077C8' : '#0F172A', margin: 0 }}>
            {pending ?? 0}
          </p>
          {pending && pending > 0 && (
            <Link
              href="/admin/approvals"
              style={{ fontSize: '13px', color: '#0077C8', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}
            >
              Review →
            </Link>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
            Approved
          </p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {approved ?? 0}
          </p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '8px 0 0 0' }}>
            Scheduled &amp; active
          </p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
            Completed
          </p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#22C55E', margin: 0 }}>
            {confirmed ?? 0}
          </p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '8px 0 0 0' }}>
            Customer confirmed
          </p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
            Rejected
          </p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {rejected ?? 0}
          </p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '8px 0 0 0' }}>
            Declined requests
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column - Scheduled Visits */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scheduledVisits.map((visit) => (
                <div key={visit.id} className="card" style={{ padding: '16px' }}>
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

                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569' }}>
                        <span>
                          <span style={{ color: '#64748B' }}>Scheduled:</span>{' '}
                          <strong>{formatDateOnlyGMT7(visit.scheduled_date)}</strong>
                        </span>
                        <span>
                          <span style={{ color: '#64748B' }}>Duration:</span>{' '}
                          <strong>{visit.duration_hours}h</strong>
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

        {/* Right Column - Hours by Location */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
              Hours by Location
            </h2>
            {totalHours > 0 && (
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                Total: {totalHours}h
              </span>
            )}
          </div>

          {conductedByLocationArray.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>
                No conducted visits yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const maxHours = Math.max(...conductedByLocationArray.map(x => x.hours), 20)
                return conductedByLocationArray.map((item) => (
                  <div key={item.location} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>
                        {item.location}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0077C8' }}>
                        {item.hours}h
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#EAF3FB',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(item.hours / maxHours) * 100}%`,
                        background: '#0077C8',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>

                    <p style={{ fontSize: '12px', color: '#64748B', margin: '6px 0 0 0' }}>
                      {Math.round((item.hours / totalHours) * 100)}% of total hours
                    </p>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
