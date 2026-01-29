import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import VisitRecorder from '@/components/VisitRecorder'
import VisitRejector from '@/components/VisitRejector'
import QRCode from '@/components/QRCode'
import { CopyableText } from '@/components/CopyableText'
import { getBaseUrl } from '@/lib/env'

// Calculate duration between two dates in hours
function calculateDurationHours(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diffMs = end - start
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours.toFixed(1)
}

function isRemoteVisit(location: string): boolean {
  return location?.includes('Automation - Boccard Indonesia') || false
}

export default async function VisitsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createSupabaseServerClient()
  const activeTab = searchParams.tab || 'scheduled'

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
  const { data: scheduledVisits } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .not('scheduled_date', 'is', null)
    .is('actual_start_time', null)
    .order('scheduled_date', { ascending: true })

  // Get visits that have been recorded but not yet confirmed by customer
  const { data: recordedVisits } = await supabase
    .from('site_visit_requests')
    .select('*')
    .eq('status', 'approved')
    .not('actual_start_time', 'is', null)
    .is('customer_confirmed_at', null)
    .order('actual_start_time', { ascending: false })

  const scheduledCount = scheduledVisits?.length || 0
  const recordedCount = recordedVisits?.length || 0

  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1000px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Site Visit Tracking
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Record visits and track customer confirmations
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid #E2E8F0' }}>
        <a
          href="/admin/visits?tab=scheduled"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'scheduled' ? '#0077C8' : '#64748B',
            borderBottom: activeTab === 'scheduled' ? '2px solid #0077C8' : 'none',
            marginBottom: '-2px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'scheduled' ? '#F8FAFC' : 'transparent',
            borderRadius: '6px 6px 0 0',
          }}
        >
          Scheduled
          <span style={{
            background: activeTab === 'scheduled' ? '#0077C8' : '#E2E8F0',
            color: activeTab === 'scheduled' ? '#FFFFFF' : '#64748B',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>
            {scheduledCount}
          </span>
        </a>
        <a
          href="/admin/visits?tab=recorded"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'recorded' ? '#0077C8' : '#64748B',
            borderBottom: activeTab === 'recorded' ? '2px solid #0077C8' : 'none',
            marginBottom: '-2px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'recorded' ? '#F8FAFC' : 'transparent',
            borderRadius: '6px 6px 0 0',
          }}
        >
          Recorded
          <span style={{
            background: activeTab === 'recorded' ? '#0077C8' : '#E2E8F0',
            color: activeTab === 'recorded' ? '#FFFFFF' : '#64748B',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>
            {recordedCount}
          </span>
        </a>
      </div>

      {/* Scheduled Visits Tab */}
      {activeTab === 'scheduled' && (
        <div>
          {scheduledCount === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
              <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
                No scheduled visits
              </p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
                All pending visits have been recorded
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {scheduledVisits?.map((visit) => {
                const isRemote = isRemoteVisit(visit.site_location)

                return (
                  <div
                    key={visit.id}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            {visit.requester_name}
                          </h3>
                          <span style={{ fontSize: '13px', color: '#64748B' }}>
                            ({visit.requester_email})
                          </span>
                        </div>

                        <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#475569' }}>
                          <strong>Location:</strong> {visit.site_location}
                        </p>

                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '14px',
                          color: '#64748B',
                          lineHeight: 1.5,
                        }}>
                          {visit.problem_desc}
                        </p>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '10px 14px',
                          background: '#F8FAFC',
                          borderRadius: '6px',
                          marginBottom: '12px',
                        }}>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            📅 <strong>{formatDateOnlyGMT7(visit.scheduled_date)}</strong>
                          </span>
                          <span style={{ color: '#D0D7E2' }}>|</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            ⏱ {visit.duration_hours}h
                          </span>
                        </div>

                        <CopyableText label="Visit ID" value={visit.id} />
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                        <VisitRecorder id={visit.id} />
                        <VisitRejector id={visit.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Recorded Visits Tab */}
      {activeTab === 'recorded' && (
        <div>
          {recordedCount === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
                No recorded visits pending confirmation
              </p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
                All recorded visits have been confirmed by customers
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recordedVisits?.map((visit) => {
                const isRemote = isRemoteVisit(visit.site_location)

                return (
                  <div
                    key={visit.id}
                    className="card"
                    style={{
                      padding: '20px',
                      borderLeft: isRemote ? '4px solid #8B5CF6' : '4px solid #22C55E',
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
                        background: isRemote ? '#F3E8FF' : '#F0FDF4',
                        borderRadius: '8px',
                        minWidth: '70px',
                      }}>
                        <span style={{ fontSize: '24px' }}>{isRemote ? '💻' : '📍'}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: isRemote ? '#7C3AED' : '#16A34A',
                          textTransform: 'uppercase',
                        }}>
                          {isRemote ? 'Remote' : 'On-site'}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            {visit.requester_name}
                          </h3>
                          <span style={{ fontSize: '13px', color: '#64748B' }}>
                            ({visit.requester_email})
                          </span>
                        </div>

                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>
                          <strong>Location:</strong> {visit.site_location}
                        </p>

                        <div style={{
                          background: '#F8FAFC',
                          padding: '14px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid #E2E8F0',
                        }}>
                          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
                            🕐 <strong>Started:</strong> {formatDateGMT7(visit.actual_start_time)}
                          </p>
                          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
                            🕑 <strong>Ended:</strong> {formatDateGMT7(visit.actual_end_time)}
                          </p>
                          {visit.actual_start_time && visit.actual_end_time && (
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>
                              ⏱ Duration: {calculateDurationHours(visit.actual_start_time, visit.actual_end_time)} hours worked
                            </p>
                          )}
                        </div>

                        {visit.technician_notes && (
                          <div style={{
                            marginBottom: '12px',
                            padding: '12px',
                            background: '#EAF3FB',
                            borderRadius: '6px',
                            borderLeft: '3px solid #0077C8',
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#0077C8', fontWeight: 600 }}>
                              📝 Technician Notes
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                              {visit.technician_notes}
                            </p>
                          </div>
                        )}

                        <div style={{
                          padding: '10px 14px',
                          background: '#FFFBEB',
                          borderRadius: '6px',
                          border: '1px solid #FDE68A',
                          marginBottom: '12px',
                        }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                            ⏳ Waiting for customer confirmation...
                          </p>
                        </div>

                        <CopyableText label="Confirmation Link" value={`${getBaseUrl()}/confirm-visit/${visit.id}`} />
                      </div>

                      {/* QR Code */}
                      <div style={{ textAlign: 'center', minWidth: '120px' }}>
                        <QRCode url={`${getBaseUrl()}/confirm-visit/${visit.id}`} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
