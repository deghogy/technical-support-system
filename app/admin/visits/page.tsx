import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import VisitRecorder from '@/components/VisitRecorder'
import QRCode from '@/components/QRCode'

export default async function VisitsPage() {
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

  if (!['admin', 'approver'].includes(profile?.role ?? '')) {
    redirect('/')
  }

  // Get scheduled visits that haven't been recorded yet
  const { data: scheduledVisits, error: scheduledError } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .neq('scheduled_date', null)
    .is('actual_start_time', null)
    .order('scheduled_date', { ascending: true })

  // Get visits that have been recorded but not yet confirmed by customer
  const { data: recordedVisits, error: recordedError } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .neq('actual_start_time', null)
    .is('customer_confirmed_at', null)
    .order('actual_start_time', { ascending: false })

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1>Site Visit Tracking</h1>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: '18px', marginTop: 0 }}>Scheduled Visits (Pending Recording)</h2>
        {!scheduledVisits || scheduledVisits.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No scheduled visits</p>
        ) : (
          scheduledVisits.map((visit) => (
            <div key={visit.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>
                    <b>{visit.requester_name}</b> <small style={{ color: 'var(--muted)' }}>({visit.requester_email})</small>
                  </p>
                  <p style={{ margin: '6px 0' }}>📍 {visit.site_location}</p>
                  <p style={{ margin: '6px 0', fontSize: '14px' }}>{visit.problem_desc}</p>
                  <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: '14px' }}>
                    📅 {formatDateOnlyGMT7(visit.scheduled_date)} • ⏱ {visit.duration_hours}h
                  </p>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                    Visit ID: <code style={{ background: 'var(--card)', padding: '2px 6px', borderRadius: '4px' }}>
                      {visit.id}
                    </code>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', minWidth: '220px' }}>
                  <QRCode url={`${process.env.NEXT_PUBLIC_BASE_URL}/admin/visits?id=${visit.id}`} />
                  <VisitRecorder id={visit.id} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <h2 style={{ fontSize: '18px', marginTop: 0 }}>Recorded Visits (Awaiting Customer Confirmation)</h2>
        {!recordedVisits || recordedVisits.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No recorded visits pending confirmation</p>
        ) : (
          recordedVisits.map((visit) => (
            <div key={visit.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>
                    <b>{visit.requester_name}</b> <small style={{ color: 'var(--muted)' }}>({visit.requester_email})</small>
                  </p>
                  <p style={{ margin: '6px 0' }}>📍 {visit.site_location}</p>
                  <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: '14px' }}>
                    🕐 Started: {formatDateGMT7(visit.actual_start_time)}
                  </p>
                  <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: '14px' }}>
                    🕑 Ended: {formatDateGMT7(visit.actual_end_time)}
                  </p>
                  {visit.technician_notes && (
                    <p style={{ margin: '8px 0', padding: '8px', backgroundColor: 'var(--card)', borderRadius: '4px', fontSize: '14px' }}>
                      📝 {visit.technician_notes}
                    </p>
                  )}
                  <p style={{ margin: '8px 0', color: 'var(--accent)' }}>
                    ⏳ Waiting for customer confirmation...
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--muted)' }}>
                    Link: <code style={{ background: 'var(--card)', padding: '2px 6px', borderRadius: '4px' }}>
                      {process.env.NEXT_PUBLIC_BASE_URL}/confirm-visit/{visit.id}
                    </code>
                  </p>
                </div>
                <div style={{ textAlign: 'center', minWidth: '220px' }}>
                  <QRCode url={`${process.env.NEXT_PUBLIC_BASE_URL}/confirm-visit/${visit.id}`} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
