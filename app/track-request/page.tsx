'use client'

import { useState } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'

type SortOption = 'newest' | 'oldest' | 'location' | 'status'

export default function TrackRequestPage() {
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [quota, setQuota] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setRequests([])
    setQuota(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/customer/track?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        if (data.requests.length === 0) {
          setError('No requests found for this email address')
        }
      } else {
        setError('Failed to load requests')
      }

      // Load quota
      const quotaRes = await fetch(`/api/customer/quota?email=${encodeURIComponent(email)}`)
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return 'var(--accent)'
    if (status === 'rejected') return '#ef4444'
    if (status === 'approved') return '#8b5cf6'
    return 'var(--muted)'
  }

  const getStatusLabel = (status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return '✅ Completed & Confirmed'
    if (visitStatus === 'visit-completed') return '⏳ Awaiting Your Confirmation'
    if (status === 'rejected') return '❌ Rejected'
    if (status === 'approved') return '✓ Approved'
    return '⏳ Pending Review'
  }

  // Sort requests
  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy === 'location') {
      return (a.site_location || '').localeCompare(b.site_location || '')
    } else if (sortBy === 'status') {
      const statusOrder = { rejected: 0, pending: 1, approved: 2, scheduled: 3, confirmed: 4 }
      const getStatusKey = (r: any) => {
        if (r.status === 'rejected') return 'rejected'
        if (r.visit_status === 'confirmed') return 'confirmed'
        if (r.scheduled_date && r.status === 'approved') return 'scheduled'
        if (r.status === 'approved') return 'approved'
        return 'pending'
      }
      return (statusOrder[getStatusKey(a) as keyof typeof statusOrder] || 0) -
             (statusOrder[getStatusKey(b) as keyof typeof statusOrder] || 0)
    }
    return 0
  })

  return (
    <main style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1>Track Your Site Visit Request</h1>
        <p style={{ color: 'var(--muted)', margin: '8px 0 0 0' }}>
          Enter your email address to check the status of your request
        </p>
      </div>

      <form onSubmit={handleSearch} className="card request-form">
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Track Request'}
        </button>
      </form>

      {error && searched && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {searched && quota && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--card)' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--muted)' }}>
            <b>Your Hour Quota:</b>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                background: 'rgba(30, 144, 255, 0.1)',
                height: '24px',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: 'var(--accent)',
                  height: '100%',
                  width: `${quota.totalHours === 0 ? 0 : (quota.usedHours / quota.totalHours) * 100}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
              {quota.usedHours}/{quota.totalHours}h
            </span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
            {quota.totalHours === 0 
              ? '⚠️ No quota allocated'
              : `${quota.usedHours}h used, ${quota.availableHours}h available`
            }
          </p>
        </div>
      )}

      {/* Sort Options */}
      {requests.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 500 }}>Sort by:</label>
          <button
            onClick={() => setSortBy('newest')}
            style={{
              background: sortBy === 'newest' ? 'var(--accent)' : 'transparent',
              color: sortBy === 'newest' ? '#fff' : 'var(--muted)',
              border: sortBy === 'newest' ? 'none' : '1px solid rgba(255,255,255,0.04)',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            style={{
              background: sortBy === 'oldest' ? 'var(--accent)' : 'transparent',
              color: sortBy === 'oldest' ? '#fff' : 'var(--muted)',
              border: sortBy === 'oldest' ? 'none' : '1px solid rgba(255,255,255,0.04)',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Oldest
          </button>
          <button
            onClick={() => setSortBy('location')}
            style={{
              background: sortBy === 'location' ? 'var(--accent)' : 'transparent',
              color: sortBy === 'location' ? '#fff' : 'var(--muted)',
              border: sortBy === 'location' ? 'none' : '1px solid rgba(255,255,255,0.04)',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Location
          </button>
          <button
            onClick={() => setSortBy('status')}
            style={{
              background: sortBy === 'status' ? 'var(--accent)' : 'transparent',
              color: sortBy === 'status' ? '#fff' : 'var(--muted)',
              border: sortBy === 'status' ? 'none' : '1px solid rgba(255,255,255,0.04)',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Status
          </button>
        </div>
      )}

      {searched && requests.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No requests found for this email address</p>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {sortedRequests.map((req) => {
            const isExpanded = expandedId === req.id
            const statusColor = getStatusColor(req.status, req.visit_status)
            const statusLabel = getStatusLabel(req.status, req.visit_status)

            return (
              <div
                key={req.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                  borderLeft: `4px solid ${statusColor}`,
                }}
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                {/* Header Section - Always Visible */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: isExpanded ? 12 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, marginBottom: 4 }}>
                      <b>📍 {req.site_location}</b>
                    </p>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px', lineHeight: 1.4 }}>
                      {req.problem_desc}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 16 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    {/* Request ID & Dates */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--muted)' }}>Request ID</p>
                      <code style={{
                        background: 'var(--card)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'var(--text)',
                      }}>
                        {req.id}
                      </code>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                        Requested: {formatDateOnlyGMT7(req.requested_date)}
                      </p>
                    </div>

                    {/* Estimated Hours */}
                    {req.estimated_hours && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--muted)' }}>Estimated Duration</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                          {req.estimated_hours} hour{req.estimated_hours !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Timeline Section */}
                    <div style={{
                      backgroundColor: 'var(--card)',
                      padding: 12,
                      borderRadius: '4px',
                      marginBottom: 12,
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Timeline</p>

                      {req.approved_at && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                          ✓ Approved: {formatDateGMT7(req.approved_at)}
                        </p>
                      )}

                      {req.scheduled_date && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                          📅 Scheduled: {formatDateOnlyGMT7(req.scheduled_date)} ({req.duration_hours}h)
                        </p>
                      )}

                      {req.actual_start_time && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                          🕐 Started: {formatDateGMT7(req.actual_start_time)}
                        </p>
                      )}

                      {req.actual_end_time && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                          🕑 Ended: {formatDateGMT7(req.actual_end_time)}
                        </p>
                      )}

                      {req.customer_confirmed_at && (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent)' }}>
                          ✓ Confirmed: {formatDateGMT7(req.customer_confirmed_at)}
                        </p>
                      )}
                    </div>

                    {/* Technician Notes */}
                    {req.technician_notes && (
                      <div style={{ marginBottom: 12, padding: '12px', background: 'rgba(30, 144, 255, 0.05)', borderRadius: '4px', borderLeft: '3px solid var(--accent)' }}>
                        <p style={{ margin: '0 0 6px 0', color: 'var(--accent)', fontWeight: 600, fontSize: '12px' }}>
                          📝 Technician Notes
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                          {req.technician_notes}
                        </p>
                      </div>
                    )}

                    {/* Confirmation CTA */}
                    {req.visit_status === 'visit-completed' && !req.customer_confirmed_at && (
                      <div style={{
                        marginBottom: 12,
                        padding: '12px',
                        background: 'rgba(30, 144, 255, 0.1)',
                        borderRadius: '4px',
                        border: '1px solid rgba(30, 144, 255, 0.2)',
                      }}>
                        <p style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontWeight: 600, fontSize: '12px' }}>
                          ⏳ Awaiting Your Confirmation
                        </p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--muted)' }}>
                          The technician has completed the visit. Please confirm that the work was done to your satisfaction.
                        </p>
                        <a
                          href={`/confirm-visit/${req.id}`}
                          style={{
                            display: 'inline-block',
                            background: 'var(--accent)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          Confirm Visit Completion
                        </a>
                      </div>
                    )}

                    {/* Expand Indicator */}
                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                      ▲ Click to collapse
                    </p>
                  </div>
                )}

                {/* Collapse Indicator */}
                {!isExpanded && (
                  <p style={{ margin: '0', fontSize: '12px', color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
                    ▼ Click to expand details
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
