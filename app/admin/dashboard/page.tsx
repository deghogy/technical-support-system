'use client'

import { useEffect, useState } from 'react'
import { formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardIssues from './DashboardIssues'

interface Quota {
  id: string
  email: string
  location: string
  total: number
  used: number
  available: number
  percentage: number
}

interface ScheduledVisit {
  id: string
  requester_name: string
  requester_email: string
  site_location: string
  problem_desc: string
  scheduled_date: string
}

interface DashboardData {
  pending: number
  approved: number
  confirmed: number
  quotaList: Quota[]
  quotaSummary: { total: number; used: number }
  scheduledVisits: ScheduledVisit[]
  issues: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [visitsExpanded, setVisitsExpanded] = useState(false)

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto refresh every 10 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
      router.refresh()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, router])

  if (loading || !data) {
    return (
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1200px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#64748B', margin: 0 }}>Loading dashboard...</p>
        </div>
      </main>
    )
  }

  const { pending, approved, confirmed, quotaList, quotaSummary, scheduledVisits, issues } = data

  // Get top 3 quotas by usage percentage
  const topQuotas = quotaList.slice(0, 3)

  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1200px' }}>

      {/* ========== SECTION 1: SERVICE CONTRACT ACTIVE ========== */}
      <section style={{ marginBottom: '48px' }}>
        {/* Section Header with Auto-Refresh Toggle */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
              Service Contract Active
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              Technical support operations overview and scheduled visits
            </p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${autoRefresh ? '#22C55E' : '#D0D7E2'}`,
              background: autoRefresh ? '#F0FDF4' : '#FFFFFF',
              color: autoRefresh ? '#166534' : '#475569',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={autoRefresh ? 'Auto-refresh every 10 seconds (ON)' : 'Auto-refresh every 10 seconds (OFF)'}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: autoRefresh ? '#22C55E' : '#94A3B8',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none',
            }} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
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
          {/* Left Column - Scheduled Visits - Collapsible */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header - Always Visible */}
            <div
              onClick={() => setVisitsExpanded(!visitsExpanded)}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: visitsExpanded ? '#F8FAFC' : 'transparent',
                borderBottom: visitsExpanded ? '1px solid #E2E8F0' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Upcoming Scheduled Visits</span>
                {scheduledVisits && scheduledVisits.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    color: '#64748B',
                    background: '#F1F5F9',
                    padding: '2px 10px',
                    borderRadius: '12px'
                  }}>
                    {scheduledVisits.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {!visitsExpanded && scheduledVisits.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Next: {formatDateOnlyGMT7(scheduledVisits[0].scheduled_date)}
                  </span>
                )}
                <span style={{
                  fontSize: '14px',
                  color: '#64748B',
                  transform: visitsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>▼</span>
              </div>
            </div>

            {/* Expandable Content */}
            {visitsExpanded && (
              <div style={{ padding: '16px 20px' }}>
                {!scheduledVisits || scheduledVisits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 24px' }}>
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
                  }}
                  >
                    {scheduledVisits.map((visit) => (
                      <div key={visit.id} style={{
                        padding: '16px',
                        background: '#FAFBFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        flexShrink: 0
                      }}>
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
        )}

          {/* Right Column - Quota by Location (Top 3 Only) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Quota by Location
              </h2>
              {quotaList.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Top 3 • {quotaSummary.used}h / {quotaSummary.total}h
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
                gap: '8px'
              }}>
                {(() => {
                  const maxTotal = Math.max(...topQuotas.map(q => q.total), 20)
                  return topQuotas.map((q) => (
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

      {/* Pulse Animation for Auto-refresh Indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  )
}
