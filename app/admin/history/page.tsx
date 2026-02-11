'use client'

import { useState, useEffect } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import Unauthorized from '@/components/Unauthorized'

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
      return { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2' }
    }
    if (r.visit_status === 'confirmed') {
      return { label: 'Completed', color: '#0077C8', bg: '#EAF3FB' }
    }
    if (r.scheduled_date && r.status === 'approved') {
      return { label: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF' }
    }
    if (r.status === 'approved') {
      return { label: 'Approved', color: '#22C55E', bg: '#F0FDF4' }
    }
    return { label: 'Pending', color: '#64748B', bg: '#F1F5F9' }
  }

  const isRemote = (location: string) => location?.includes('Automation - Boccard Indonesia')

  return (
    <Unauthorized>
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1000px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Request History
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          View and search all site visit requests
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94A3B8',
            fontSize: '16px',
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name, email, location, or visit ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D0D7E2',
              borderRadius: '8px',
              color: '#0F172A',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
        padding: '12px',
        background: '#F8FAFC',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
      }}>
        {[
          { key: 'all', label: 'All', count: requests.length },
          { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved' && !r.scheduled_date && r.visit_status !== 'confirmed').length },
          { key: 'scheduled', label: 'Scheduled', count: requests.filter(r => r.status === 'approved' && r.scheduled_date && r.visit_status !== 'confirmed').length },
          { key: 'confirmed', label: 'Completed', count: requests.filter(r => r.visit_status === 'confirmed').length },
          { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            style={{
              background: filter === item.key ? '#0077C8' : '#FFFFFF',
              color: filter === item.key ? '#FFFFFF' : '#475569',
              border: `1px solid ${filter === item.key ? '#0077C8' : '#D0D7E2'}`,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {item.label}
            <span style={{
              background: filter === item.key ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
              color: filter === item.key ? '#FFFFFF' : '#64748B',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
            }}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Sort by:</span>
        {(['newest', 'oldest', 'location', 'status'] as SortOption[]).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            style={{
              background: sortBy === option ? '#0077C8' : 'transparent',
              color: sortBy === option ? '#FFFFFF' : '#64748B',
              border: `1px solid ${sortBy === option ? '#0077C8' : '#D0D7E2'}`,
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: sortBy === option ? 500 : 400,
              textTransform: 'capitalize',
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748B', margin: 0 }}>Loading history...</p>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
            No requests found
          </p>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sortedRequests.map(r => {
            const statusBadge = getStatusBadge(r)
            const isExpanded = expandedId === r.id

            return (
              <div
                key={r.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  borderLeft: `4px solid ${statusBadge.color}`,
                  background: isExpanded ? '#FAFBFC' : '#FFFFFF',
                }}
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                {/* Header Section - Always Visible */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: '16px' }}>{isRemote(r.site_location) ? '💻' : '📍'}</span>
                      <span style={{ fontWeight: 600, fontSize: '15px', color: '#0F172A' }}>
                        {r.requester_name}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '13px' }}>
                        ({r.requester_email})
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
                      {r.site_location}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.color,
                        borderRadius: '20px',
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
                    paddingTop: 16,
                    borderTop: '1px solid #E2E8F0',
                  }}>
                    {/* Request ID & Date */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Visit ID</p>
                      <code style={{
                        background: '#F1F5F9',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#0F172A',
                        border: '1px solid #E2E8F0',
                        fontFamily: 'monospace',
                      }}>
                        {r.id}
                      </code>
                      <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                        Requested: {formatDateGMT7(r.created_at)}
                      </p>
                    </div>

                    {/* Problem Description */}
                    {r.problem_desc && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Problem</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                          {r.problem_desc}
                        </p>
                      </div>
                    )}

                    {/* Timeline Section */}
                    <div style={{
                      background: '#F8FAFC',
                      padding: 16,
                      borderRadius: '8px',
                      marginBottom: 12,
                      border: '1px solid #E2E8F0',
                    }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Timeline</p>

                      {r.approved_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#22C55E' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Approved: {formatDateGMT7(r.approved_at)}
                          </span>
                        </div>
                      )}

                      {r.scheduled_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#0077C8' }}>📅</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Scheduled: {formatDateOnlyGMT7(r.scheduled_date)}
                          </span>
                        </div>
                      )}

                      {r.actual_start_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#0077C8' }}>🕐</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Started: {formatDateGMT7(r.actual_start_time)}
                          </span>
                        </div>
                      )}

                      {r.actual_end_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#0077C8' }}>🕑</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Ended: {formatDateGMT7(r.actual_end_time)}
                          </span>
                        </div>
                      )}

                      {r.actual_start_time && r.actual_end_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#22C55E' }}>⏱</span>
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                            Duration: {Math.floor((new Date(r.actual_end_time).getTime() - new Date(r.actual_start_time).getTime()) / (1000 * 60 * 60))} hours
                          </span>
                        </div>
                      )}

                      {r.customer_confirmed_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#0077C8' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Customer confirmed: {formatDateGMT7(r.customer_confirmed_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rejection Reason (if rejected) */}
                    {r.rejection_reason && (
                      <div style={{
                        background: '#FEF2F2',
                        padding: 12,
                        borderRadius: '6px',
                        borderLeft: '3px solid #DC2626',
                      }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Rejection Reason</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                          {r.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Attached Document (for completed visits) */}
                    {r.document_url && r.visit_status === 'confirmed' && (
                      <div style={{
                        marginTop: 12,
                        padding: '12px',
                        background: '#EAF3FB',
                        borderRadius: '6px',
                        borderLeft: '3px solid #0077C8',
                      }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0077C8', fontWeight: 600 }}>
                          📎 Attached Document
                        </p>
                        <a
                          href={r.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#0077C8',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇️ Download Document
                        </a>
                      </div>
                    )}

                    {/* Collapse Indicator */}
                    <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>
                      ▲ Click to collapse
                    </p>
                  </div>
                )}

                {/* Collapse Indicator */}
                {!isExpanded && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                  >
                    <span style={{ fontSize: '13px', color: '#64748B' }}>
                      Click to expand details ▼
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
    </Unauthorized>
  )
}
