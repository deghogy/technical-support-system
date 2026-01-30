'use client'

import { useState } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import { useToast, ToastContainer } from '@/components/Toast'

function QRCode({ url }: { url: string }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`

  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src={qrCodeUrl}
        alt="QR Code"
        style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
      />
      <p style={{ fontSize: '11px', color: '#64748B', margin: '6px 0 0 0' }}>
        Scan to confirm
      </p>
    </div>
  )
}

type SortOption = 'newest' | 'oldest' | 'location' | 'status'

export default function TrackRequestPage() {
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [quota, setQuota] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toasts, toast, removeToast } = useToast()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setRequests([])
    setQuota(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/customer/track?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        if (data.requests.length === 0) {
          toast.warning('No Requests Found', 'No requests found for this email address')
        } else {
          toast.success('Requests Loaded', `Found ${data.requests.length} request(s)`)
        }
      } else {
        toast.error('Error', 'Failed to load requests')
      }

      // Load quota
      const quotaRes = await fetch(`/api/customer/quota?email=${encodeURIComponent(email)}`)
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error', 'Failed to load requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return '#0077C8'
    if (status === 'rejected') return '#DC2626'
    if (status === 'approved') return '#22C55E'
    return '#F59E0B'
  }

  const getStatusBgColor = (status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return '#EAF3FB'
    if (status === 'rejected') return '#FEF2F2'
    if (status === 'approved') return '#F0FDF4'
    return '#FFFBEB'
  }

  const getStatusLabel = (status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return 'Completed'
    if (visitStatus === 'visit-completed') return 'Awaiting Confirmation'
    if (status === 'rejected') return 'Rejected'
    if (status === 'approved') return 'Approved'
    return 'Pending'
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

  // Calculate used percentage correctly
  const usedPercentage = quota && quota.totalHours > 0
    ? Math.round((quota.usedHours / quota.totalHours) * 100)
    : 0

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
          Track Your Request
        </h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '15px' }}>
          Enter your email to check request status
        </p>
      </div>

      <form onSubmit={handleSearch} className="card" style={{ padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="email"
            placeholder="your.email@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? 'Searching...' : 'Track Request'}
          </button>
        </div>
      </form>

      {/* Quota Display */}
      {searched && quota && (
        <div className="card" style={{ marginBottom: 24, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
              Your Quota Usage
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0077C8' }}>
              {quota.usedHours}h / {quota.totalHours}h
            </span>
          </div>
          <div style={{
            background: '#E2E8F0',
            height: '12px',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <div style={{
              background: usedPercentage > 80 ? '#DC2626' : usedPercentage > 50 ? '#F59E0B' : '#0077C8',
              height: '100%',
              width: `${usedPercentage}%`,
              transition: 'width 0.3s ease',
              borderRadius: '6px',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {usedPercentage}% used
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {quota.availableHours}h available
            </span>
          </div>
        </div>
      )}

      {/* Sort Options */}
      {requests.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '12px 16px',
          background: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>Sort by:</span>
          {(['newest', 'oldest', 'location', 'status'] as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              style={{
                background: sortBy === option ? '#0077C8' : '#FFFFFF',
                color: sortBy === option ? '#FFFFFF' : '#475569',
                border: `1px solid ${sortBy === option ? '#0077C8' : '#D0D7E2'}`,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: sortBy === option ? 500 : 400,
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {searched && !loading && requests.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
            No requests found
          </p>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
            Try a different email address
          </p>
        </div>
      )}

      {/* Request Cards */}
      {requests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sortedRequests.map((req) => {
            const isExpanded = expandedId === req.id
            const statusColor = getStatusColor(req.status, req.visit_status)
            const statusBg = getStatusBgColor(req.status, req.visit_status)
            const statusLabel = getStatusLabel(req.status, req.visit_status)
            const isRemote = req.site_location?.includes('Automation - Boccard Indonesia')

            return (
              <div
                key={req.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  borderLeft: `4px solid ${statusColor}`,
                  background: isExpanded ? '#FAFBFC' : '#FFFFFF',
                }}
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: '16px' }}>{isRemote ? '💻' : '📍'}</span>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '15px',
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {req.site_location}
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      color: '#64748B',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {req.problem_desc}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      backgroundColor: statusBg,
                      color: statusColor,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                    {/* ID and QR */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: req.visit_status === 'visit-completed' ? '1fr auto' : '1fr',
                      gap: '16px',
                      marginBottom: 16,
                    }}>
                      <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                          Request ID
                        </p>
                        <code style={{
                          background: '#F1F5F9',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#0F172A',
                          border: '1px solid #E2E8F0',
                          fontFamily: 'monospace',
                          display: 'inline-block'
                        }}>
                          {req.id}
                        </code>
                        <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                          📅 Requested: {formatDateOnlyGMT7(req.requested_date)}
                        </p>
                        {req.support_type && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                            {req.support_type === 'remote' ? '💻 Remote Support' : '📍 Direct Visit'}
                          </p>
                        )}
                      </div>

                      {req.visit_status === 'visit-completed' && (
                        <QRCode url={`${typeof window !== 'undefined' ? window.location.origin : ''}/confirm-visit/${req.id}`} />
                      )}
                    </div>

                    {/* Timeline */}
                    <div style={{
                      background: '#F8FAFC',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: 16,
                      border: '1px solid #E2E8F0'
                    }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Timeline
                      </p>

                      {req.approved_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#22C55E' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Approved on {formatDateGMT7(req.approved_at)}
                          </span>
                        </div>
                      )}

                      {req.scheduled_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#0077C8' }}>📅</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Scheduled for {formatDateOnlyGMT7(req.scheduled_date)} ({req.duration_hours}h)
                          </span>
                        </div>
                      )}

                      {req.actual_start_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#0077C8' }}>🕐</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Started at {formatDateGMT7(req.actual_start_time)}
                          </span>
                        </div>
                      )}

                      {req.actual_end_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#0077C8' }}>🕑</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Ended at {formatDateGMT7(req.actual_end_time)}
                          </span>
                        </div>
                      )}

                      {req.actual_start_time && req.actual_end_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ color: '#22C55E' }}>⏱</span>
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                            Duration: {Math.floor((new Date(req.actual_end_time).getTime() - new Date(req.actual_start_time).getTime()) / (1000 * 60 * 60))} hours
                          </span>
                        </div>
                      )}

                      {req.customer_confirmed_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#0077C8' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            Confirmed on {formatDateGMT7(req.customer_confirmed_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Technician Notes */}
                    {req.technician_notes && (
                      <div style={{
                        marginBottom: 16,
                        padding: '16px',
                        background: '#EAF3FB',
                        borderRadius: '8px',
                        borderLeft: '3px solid #0077C8'
                      }}>
                        <p style={{ margin: '0 0 8px 0', color: '#0077C8', fontWeight: 600, fontSize: '13px' }}>
                          📝 Technician Notes
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                          {req.technician_notes}
                        </p>
                      </div>
                    )}

                    {/* Attached Document */}
                    {req.document_url && req.visit_status === 'confirmed' && (
                      <div style={{
                        marginBottom: 16,
                        padding: '16px',
                        background: '#EAF3FB',
                        borderRadius: '8px',
                        borderLeft: '3px solid #0077C8'
                      }}>
                        <p style={{ margin: '0 0 12px 0', color: '#0077C8', fontWeight: 600, fontSize: '13px' }}>
                          📎 Attached Document
                        </p>
                        <a
                          href={req.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 20px',
                            backgroundColor: '#0077C8',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇️ Download Document
                        </a>
                      </div>
                    )}

                    {/* Confirmation CTA */}
                    {req.visit_status === 'visit-completed' && !req.customer_confirmed_at && (
                      <div style={{
                        padding: '16px',
                        background: '#F0FDF4',
                        borderRadius: '8px',
                        border: '1px solid #86EFAC',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 12px 0', color: '#166534', fontWeight: 600, fontSize: '14px' }}>
                          ⏳ Awaiting Your Confirmation
                        </p>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#475569' }}>
                          The technician has completed the visit. Please confirm the work.
                        </p>
                        <a
                          href={`/confirm-visit/${req.id}`}
                          style={{
                            display: 'inline-block',
                            background: '#0077C8',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '14px',
                          }}
                        >
                          Confirm Completion
                        </a>
                      </div>
                    )}

                    {/* Collapse Hint */}
                    <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>
                      ▲ Click to collapse
                    </p>
                  </div>
                )}

                {/* Expand Hint */}
                {!isExpanded && (
                  <div style={{
                    marginTop: 16,
                    padding: '10px',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}>
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </main>
  )
}
