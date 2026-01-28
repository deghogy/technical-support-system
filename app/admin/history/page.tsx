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
      return { label: '❌ Rejected', color: '#EF4444' }
    }
    if (r.visit_status === 'confirmed') {
      return { label: '✅ Confirmed', color: '#22C55E' }
    }
    if (r.scheduled_date && r.status === 'approved') {
      return { label: '📅 Scheduled', color: '#0077C8' }
    }
    if (r.status === 'approved') {
      return { label: '✓ Approved', color: '#7C3AED' }
    }
    return { label: r.status || 'Pending', color: '#64748B' }
  }

  return (
    <main style={{ maxWidth: 1600, margin: '0 auto', padding: '40px' }}>
      <h1 style={{ color: '#0F172A', marginTop: 0 }}>Request History</h1>

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
            backgroundColor: '#FFFFFF',
            border: '1px solid #D0D7E2',
            borderRadius: '8px',
            color: '#0F172A',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? '#0077C8' : '#EAF3FB',
            color: filter === 'all' ? '#fff' : '#0077C8',
            border: filter === 'all' ? 'none' : '1px solid #D0D7E2',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={{
            background: filter === 'approved' ? '#0077C8' : '#EAF3FB',
            color: filter === 'approved' ? '#fff' : '#0077C8',
            border: filter === 'approved' ? 'none' : '1px solid #D0D7E2',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          Approved ({requests.filter(r => r.status === 'approved' && !r.scheduled_date && r.visit_status !== 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          style={{
            background: filter === 'scheduled' ? '#0077C8' : '#EAF3FB',
            color: filter === 'scheduled' ? '#fff' : '#0077C8',
            border: filter === 'scheduled' ? 'none' : '1px solid #D0D7E2',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          Scheduled ({requests.filter(r => r.status === 'approved' && r.scheduled_date && r.visit_status !== 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          style={{
            background: filter === 'confirmed' ? '#0077C8' : '#EAF3FB',
            color: filter === 'confirmed' ? '#fff' : '#0077C8',
            border: filter === 'confirmed' ? 'none' : '1px solid #D0D7E2',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          Confirmed ({requests.filter(r => r.visit_status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          style={{
            background: filter === 'rejected' ? '#0077C8' : '#EAF3FB',
            color: filter === 'rejected' ? '#fff' : '#0077C8',
            border: filter === 'rejected' ? 'none' : '1px solid #D0D7E2',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {/* Sort Options */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
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

      {loading ? (
        <p style={{ color: '#475569' }}>Loading history...</p>
      ) : sortedRequests.length === 0 ? (
        <p style={{ color: '#475569' }}>No requests found for this filter</p>
      ) : (
        sortedRequests.map(r => {
          const statusBadge = getStatusBadge(r)
          const isExpanded = expandedId === r.id

          return (
            <div
              key={r.id}
              style={{
                cursor: 'pointer',
                marginBottom: 16,
                transition: 'all 0.2s ease',
                borderLeft: `4px solid ${statusBadge.color}`,
                background: '#FFFFFF',
                border: '1px solid #D0D7E2',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
            >
              {/* Header Section - Always Visible */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: isExpanded ? 12 : 0 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, marginBottom: 4, color: '#0F172A' }}>
                    <b>{r.requester_name}</b>
                    <span style={{ color: '#64748B', fontSize: '12px', marginLeft: 8 }}>
                      ({r.requester_email})
                    </span>
                  </p>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>📍 {r.site_location}</p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: `${statusBadge.color}20`,
                      color: statusBadge.color,
                      borderRadius: '6px',
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
                  borderTop: '1px solid #D0D7E2',
                }}>
                  {/* Request ID & Date */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B' }}>Visit ID</p>
                    <code style={{
                      background: '#EAF3FB',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#0F172A',
                    }}>
                      {r.id}
                    </code>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                      Requested: {formatDateGMT7(r.created_at)}
                    </p>
                  </div>

                  {/* Problem Description */}
                  {r.problem_desc && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B' }}>Problem</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#0F172A', lineHeight: 1.4 }}>
                        {r.problem_desc}
                      </p>
                    </div>
                  )}

                  {/* Estimated Hours */}
                  {r.estimated_hours && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B' }}>Estimated Duration</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#0F172A' }}>
                        {r.estimated_hours} hour{r.estimated_hours !== 1 ? 's' : ''}
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

                    {r.approved_at && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                        ✓ Approved: {formatDateGMT7(r.approved_at)}
                      </p>
                    )}

                    {r.scheduled_date && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                        📅 Scheduled: {formatDateOnlyGMT7(r.scheduled_date)}
                      </p>
                    )}

                    {r.actual_start_time && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                        🕐 Started: {formatDateGMT7(r.actual_start_time)}
                      </p>
                    )}

                    {r.actual_end_time && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#0F172A' }}>
                        🕑 Ended: {formatDateGMT7(r.actual_end_time)}
                      </p>
                    )}

                    {r.customer_confirmed_at && (
                      <p style={{ margin: 0, fontSize: '12px', color: '#22C55E' }}>
                        ✓ Customer confirmed: {formatDateGMT7(r.customer_confirmed_at)}
                      </p>
                    )}
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {r.rejection_reason && (
                    <div style={{
                      backgroundColor: '#FEE2E2',
                      padding: 12,
                      borderRadius: '6px',
                      borderLeft: '3px solid #EF4444',
                    }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#EF4444' }}>Rejection Reason</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#0F172A', lineHeight: 1.4 }}>
                        {r.rejection_reason}
                      </p>
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
        })
      )}
    </main>
  )
}
