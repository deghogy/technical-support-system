import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import { redirect } from 'next/navigation'

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

  // Get upcoming scheduled visits
  const { data: upcomingVisits } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .neq('scheduled_date', null)
    .is('customer_confirmed_at', null)
    .order('scheduled_date', { ascending: true })
    .limit(5)

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

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto' }}>
      <h1>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted)' }}>Pending</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: 700 }}>{pending ?? 0}</p>
        </div>

        <div className="card" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted)' }}>Approved</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: 700 }}>{approved ?? 0}</p>
        </div>

        <div className="card" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted)' }}>Confirmed</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: 700 }}>{confirmed ?? 0}</p>
        </div>

        <div className="card" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted)' }}>Rejected</h3>
          <p style={{ fontSize: 32, margin: 0, fontWeight: 700 }}>{rejected ?? 0}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Upcoming Scheduled Visits</h2>
          {!upcomingVisits || upcomingVisits.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No upcoming visits scheduled</p>
          ) : (
            upcomingVisits.map((visit) => (
              <div key={visit.id} className="card" style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0 }}>
                  <b>{visit.requester_name}</b> <small style={{ color: 'var(--muted)' }}>({visit.requester_email})</small>
                </p>
                <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '14px' }}>📍 {visit.site_location}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  📅 {formatDateOnlyGMT7(visit.scheduled_date)} • ⏱ {visit.duration_hours}h
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Conducted Hours by Location</h2>
          {conductedByLocationArray.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No conducted visits yet</p>
          ) : (
            (() => {
              const maxHours = Math.max(...conductedByLocationArray.map(x => x.hours), 20)
              return conductedByLocationArray.map((item) => (
                <div key={item.location} className="card" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>📍 {item.location}</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>{item.hours}h</p>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '24px',
                    background: 'rgba(30, 144, 255, 0.1)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(30, 144, 255, 0.2)',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(item.hours / maxHours) * 100}%`,
                      background: 'linear-gradient(90deg, var(--accent), rgba(30, 144, 255, 0.6))',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                      minWidth: item.hours > 0 ? '30px' : '0',
                    }}>
                      {item.hours > 2 && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{item.hours}h</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            })()
          )}
        </div>
      </div>
    </main>
  )
}
