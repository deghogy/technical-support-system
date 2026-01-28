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
    if (visitStatus === 'confirmed') return '#22C55E'
    if (status === 'rejected') return '#EF4444'
    if (status === 'approved') return '#7C3AED'
    return '#64748B'
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
    <main style={{ maxWidth: 1600, margin: '0 auto', padding: '60px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#0F172A', marginTop: 0 }}>Track Your Site Visit Request</h1>
        <p style={{ color: '#475569', margin: '8px 0 0 0' }}>
          Enter your email address to check the status of your request
        </p>
      </div>

      <form onSubmit={handleSearch} className="card request-form" style={{ maxWidth: 600, margin: '0 auto 40px' }}>
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
        <div className="card" style={{ borderColor: '#EF4444', borderLeft: '4px solid #EF4444', maxWidth: 600, margin: '0 auto 20px' }}>
          <p style={{ color: '#EF4444', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {searched && quota && (
        <div className="card" style={{ marginBottom: 20, background: '#FFFFFF', maxWidth: 600, margin: '0 auto 20px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>
            <b>Your Hour Quota:</b>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                background: '#EAF3FB',
                height: '24px',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: '#0077C8',
                  height: '100%',
                  width: `${quota.totalHours === 0 ? 0 : (quota.usedHours / quota.totalHours) * 100}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '80px', textAlign: 'right', color: '#0F172A' }}>
              {quota.usedHours}/{quota.totalHours}h
            </span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569' }}>
            {quota.totalHours === 0 
              ? '⚠️ No quota allocated'
              : `${quota.usedHours}h used, ${quota.availableHours}h available`
            }
          </p>
        </div>
      )}

      {/* Sort Options */}
      {requests.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', maxWidth: 1400, margin: '0 auto 20px' }}>
          <label style={{ color: '#475569', fontSize: '14px', fontWeight: 500 }}>Sort by:</label>
          <button
            onClick={() => setSortBy('newest')}
            style={{
              background: sortBy === 'newest' ? '#0077C8' : '#EAF3FB',
              color: sortBy === 'newest' ? '#fff' : '#0077C8',
              border: sortBy === 'newest' ? 'none' : '1px solid #D0D7E2',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            style={{
              background: sortBy === 'oldest' ? '#0077C8' : '#EAF3FB',
              color: sortBy === 'oldest' ? '#fff' : '#0077C8',
              border: sortBy === 'oldest' ? 'none' : '1px solid #D0D7E2',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            Oldest
          </button>
          <button
            onClick={() => setSortBy('location')}
            style={{
              background: sortBy === 'location' ? '#0077C8' : '#EAF3FB',
              color: sortBy === 'location' ? '#fff' : '#0077C8',
              border: sortBy === 'location' ? 'none' : '1px solid #D0D7E2',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            Location
          </button>
          <button
            onClick={() => setSortBy('status')}
            style={{
              background: sortBy === 'status' ? '#0077C8' : '#EAF3FB',
              color: sortBy === 'status' ? '#fff' : '#0077C8',
              border: sortBy === 'status' ? 'none' : '1px solid #D0D7E2',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            Status
          </button>
        </div>
      )}

      {searched && requests.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <p style={{ color: '#475569', margin: 0 }}>No requests found for this email address</p>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginTop: 20, maxWidth: 1400, margin: '0 auto' }}>
          {sortedRequests.map((req) => {
            const isExpanded = expandedId === req.id
            const statusColor = getStatusColor(req.status, req.visit_status)
            const statusLabel = getStatusLabel(req.status, req.visit_status)

            return (
              <div
                key={req.id}
                style={{
                  cursor: 'pointer',
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                  borderLeft: `4px solid ${statusColor}`,
                  background: '#FFFFFF',
                  border: '1px solid #D0D7E2',
                  borderRadius: '8px',
                  padding: '24px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                {/* Header Section - Always Visible */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: isExpanded ? 12 : 0 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, marginBottom: 4, color: '#0F172A' }}>
                      <b>📍 {req.site_location}</b>
                    </p>
                    <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.4 }}>
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
                        borderRadius: '6px',
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
                    borderTop: '1px solid #D0D7E2',
                  }}>
                    {/* Request ID & Dates */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B' }}>Request ID</p>
                      <code style={{
                        background: '#EAF3FB',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#0F172A',
                      }}>
                        {req.id}
                      </code>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                        Requested: {formatDateOnlyGMT7(req.requested_date)}
                      </p>
                    </div>

                    {/* Estimated Hours */}
                    {req.estimated_hours && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B' }}>Estimated Duration</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0F172A' }}>
                          {req.estimated_hours} hour{req.estimated_hours !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Timeline Section */}
                    <div style={{
                      backgroundColor: '#EAF3FB',
                      padding: 12,
                      borderRadius: '6px',
                      marginBottom: 12,
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#0077C8' }}>Timeline</p>

                      {req.approved_at && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                          ✓ Approved: {formatDateGMT7(req.approved_at)}
                        </p>
                      )}

                      {req.scheduled_date && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                          📅 Scheduled: {formatDateOnlyGMT7(req.scheduled_date)} ({req.duration_hours}h)
                        </p>
                      )}

                      {req.actual_start_time && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                          🕐 Started: {formatDateGMT7(req.actual_start_time)}
                        </p>
                      )}

                      {req.actual_end_time && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                          🕑 Ended: {formatDateGMT7(req.actual_end_time)}
                        </p>
                      )}

                      {req.customer_confirmed_at && (
                        <p style={{ margin: 0, fontSize: '12px', color: '#22C55E' }}>
                          ✓ Confirmed: {formatDateGMT7(req.customer_confirmed_at)}
                        </p>
                      )}
                    </div>

                    {/* Technician Notes */}
                    {req.technician_notes && (
                      <div style={{ marginBottom: 12, padding: '12px', background: '#EAF3FB', borderRadius: '6px', borderLeft: '3px solid #0077C8' }}>
                        <p style={{ margin: '0 0 6px 0', color: '#0077C8', fontWeight: 600, fontSize: '12px' }}>
                          📝 Technician Notes
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#0F172A', lineHeight: 1.4 }}>
                          {req.technician_notes}
                        </p>
                      </div>
                    )}

                    {/* Confirmation CTA */}
                    {req.visit_status === 'visit-completed' && !req.customer_confirmed_at && (
                      <div style={{
                        marginBottom: 12,
                        padding: '12px',
                        background: '#EAF3FB',
                        borderRadius: '6px',
                        border: '1px solid #D0D7E2',
                      }}>
                        <p style={{ margin: '0 0 8px 0', color: '#0077C8', fontWeight: 600, fontSize: '12px' }}>
                          ⏳ Awaiting Your Confirmation
                        </p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#475569' }}>
                          The technician has completed the visit. Please confirm that the work was done to your satisfaction.
                        </p>
                        <a
                          href={`/confirm-visit/${req.id}`}
                          style={{
                            display: 'inline-block',
                            background: '#0077C8',
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
                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                      ▲ Click to collapse
                    </p>
                  </div>
                )}

                {/* Collapse Indicator */}
                {!isExpanded && (
                  <p style={{ margin: '0', fontSize: '12px', color: '#64748B', marginTop: 8, textAlign: 'center' }}>
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
