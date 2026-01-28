'use client'

import { useState, useEffect } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'

type SortOption = 'newest' | 'oldest' | 'location' | 'status'

export default function HistoryPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'scheduled' | 'confirmed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/admin/history')
        if (res.ok) {
          const data = await res.json()
          setRequests(data.requests || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()

    // Auto-refresh history every 5 seconds to show new completed visits
    const interval = setInterval(loadHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredRequests = requests.filter((r) => {
    // Apply status filter
    if (filter === 'all') {
      // Pass through
    } else if (filter === 'approved') {
      if (!(r.status === 'approved' && !r.scheduled_date && r.visit_status !== 'confirmed')) return false
    } else if (filter === 'rejected') {
      if (r.status !== 'rejected') return false
    } else if (filter === 'scheduled') {
      if (!(r.status === 'approved' && r.scheduled_date && r.visit_status !== 'confirmed')) return false
    } else if (filter === 'confirmed') {
      if (r.visit_status !== 'confirmed') return false
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        r.requester_name?.toLowerCase().includes(term) ||
        r.requester_email?.toLowerCase().includes(term) ||
        r.site_location?.toLowerCase().includes(term) ||
        r.id?.toLowerCase().includes(term)
      if (!matchesSearch) return false
    }

    return true
  })

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy === 'location') {
      return (a.site_location || '').localeCompare(b.site_location || '')
    } else if (sortBy === 'status') {
      const statusOrder = { rejected: 0, approved: 1, scheduled: 2, confirmed: 3 }
      const getStatusKey = (r: any) => {
        if (r.status === 'rejected') return 'rejected'
        if (r.visit_status === 'confirmed') return 'confirmed'
        if (r.scheduled_date && r.status === 'approved') return 'scheduled'
        return 'approved'
      }
      return (statusOrder[getStatusKey(a) as keyof typeof statusOrder] || 0) -
             (statusOrder[getStatusKey(b) as keyof typeof statusOrder] || 0)
    }
    return 0
  })

  const getStatusBadge = (r: any) => {
    if (r.status === 'rejected') {
      return { label: '❌ Rejected', color: '#ef4444' }
    }
    if (r.visit_status === 'confirmed') {
      return { label: '✅ Confirmed', color: 'var(--accent)' }
    }
    if (r.scheduled_date && r.status === 'approved') {
      return { label: '📅 Scheduled', color: '#3b82f6' }
    }
    if (r.status === 'approved') {
      return { label: '✓ Approved', color: '#8b5cf6' }
    }
    return { label: r.status || 'Pending', color: 'var(--muted)' }
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto' }}>
      <h1>Request History</h1>

      {/* Search Bar */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name, email, location, or visit ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--card)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '6px',
            color: 'var(--text)',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? 'var(--accent)' : 'transparent',
            color: filter === 'all' ? '#fff' : 'var(--muted)',
            border: filter === 'all' ? 'none' : '1px solid rgba(255,255,255,0.04)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={{
            background: filter === 'approved' ? 'var(--accent)' : 'transparent',
            color: filter === 'approved' ? '#fff' : 'var(--muted)',
            border: filter === 'approved' ? 'none' : '1px solid rgba(255,255,255,0.04)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Approved ({requests.filter(r => r.status === 'approved' && !r.scheduled_date && r.visit_status !== 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          style={{
            background: filter === 'scheduled' ? 'var(--accent)' : 'transparent',
            color: filter === 'scheduled' ? '#fff' : 'var(--muted)',
            border: filter === 'scheduled' ? 'none' : '1px solid rgba(255,255,255,0.04)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Scheduled ({requests.filter(r => r.status === 'approved' && r.scheduled_date && r.visit_status !== 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          style={{
            background: filter === 'confirmed' ? 'var(--accent)' : 'transparent',
            color: filter === 'confirmed' ? '#fff' : 'var(--muted)',
            border: filter === 'confirmed' ? 'none' : '1px solid rgba(255,255,255,0.04)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Confirmed ({requests.filter(r => r.visit_status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          style={{
            background: filter === 'rejected' ? 'var(--accent)' : 'transparent',
            color: filter === 'rejected' ? '#fff' : 'var(--muted)',
            border: filter === 'rejected' ? 'none' : '1px solid rgba(255,255,255,0.04)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {/* Sort Options */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
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

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading history...</p>
      ) : sortedRequests.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No requests found for this filter</p>
      ) : (
        sortedRequests.map(r => {
          const statusBadge = getStatusBadge(r)
          const isExpanded = expandedId === r.id

          return (
            <div
              key={r.id}
              className="card"
              style={{
                cursor: 'pointer',
                marginBottom: 16,
                transition: 'all 0.2s ease',
                borderLeft: `4px solid ${statusBadge.color}`,
              }}
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
            >
              {/* Header Section - Always Visible */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: isExpanded ? 12 : 0 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, marginBottom: 4 }}>
                    <b>{r.requester_name}</b>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', marginLeft: 8 }}>
                      ({r.requester_email})
                    </span>
                  </p>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>📍 {r.site_location}</p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: `${statusBadge.color}20`,
                      color: statusBadge.color,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {statusBadge.label}
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
                  {/* Request ID & Date */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--muted)' }}>Visit ID</p>
                    <code style={{
                      background: 'var(--card)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'var(--text)',
                    }}>
                      {r.id}
                    </code>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Requested: {formatDateGMT7(r.created_at)}
                    </p>
                  </div>

                  {/* Problem Description */}
                  {r.problem_desc && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--muted)' }}>Problem</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                        {r.problem_desc}
                      </p>
                    </div>
                  )}

                  {/* Estimated Hours */}
                  {r.estimated_hours && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--muted)' }}>Estimated Duration</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                        {r.estimated_hours} hour{r.estimated_hours !== 1 ? 's' : ''}
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

                    {r.approved_at && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                        ✓ Approved: {formatDateGMT7(r.approved_at)}
                      </p>
                    )}

                    {r.scheduled_date && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                        📅 Scheduled: {formatDateOnlyGMT7(r.scheduled_date)}
                      </p>
                    )}

                    {r.actual_start_time && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                        🕐 Started: {formatDateGMT7(r.actual_start_time)}
                      </p>
                    )}

                    {r.actual_end_time && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text)' }}>
                        🕑 Ended: {formatDateGMT7(r.actual_end_time)}
                      </p>
                    )}

                    {r.customer_confirmed_at && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent)' }}>
                        ✓ Customer confirmed: {formatDateGMT7(r.customer_confirmed_at)}
                      </p>
                    )}
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {r.rejection_reason && (
                    <div style={{
                      backgroundColor: '#ef444420',
                      padding: 12,
                      borderRadius: '4px',
                      borderLeft: '3px solid #ef4444',
                    }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>Rejection Reason</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                        {r.rejection_reason}
                      </p>
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
        })
      )}
    </main>
  )
}
