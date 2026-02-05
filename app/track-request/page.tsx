'use client'

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import { useToast, ToastContainer } from '@/components/Toast'
import { useAuth } from '@/components/contexts/AuthProvider'
import QRCode from '@/components/QRCode'

type SortOption = 'newest' | 'oldest' | 'location' | 'status'
type FilterOption = 'all' | 'pending' | 'approved' | 'scheduled' | 'completed' | 'rejected'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Memoized filter button to prevent re-renders
const FilterButton = memo(function FilterButton({
  item,
  isActive,
  onClick
}: {
  item: { key: FilterOption; label: string; count: number }
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? '#0077C8' : '#FFFFFF',
        color: isActive ? '#FFFFFF' : '#475569',
        border: `1px solid ${isActive ? '#0077C8' : '#D0D7E2'}`,
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: isActive ? 500 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
      }}
    >
      {item.label}
      <span style={{
        background: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
        color: isActive ? '#FFFFFF' : '#64748B',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '11px',
      }}>
        {item.count}
      </span>
    </button>
  )
})

// Memoized sort button
const SortButton = memo(function SortButton({
  option,
  isActive,
  onClick
}: {
  option: SortOption
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? '#0077C8' : '#FFFFFF',
        color: isActive ? '#FFFFFF' : '#475569',
        border: `1px solid ${isActive ? '#0077C8' : '#D0D7E2'}`,
        padding: '6px 14px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: isActive ? 500 : 400,
        textTransform: 'capitalize',
        transition: 'all 0.15s ease',
      }}
    >
      {option}
    </button>
  )
})

export default function TrackRequestPage() {
  const router = useRouter()
  const { user, role: userRole, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [quota, setQuota] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toasts, toast, removeToast } = useToast()

  // Track request state to prevent infinite loops
  const isFetchingRef = useRef(false)
  const retryCountRef = useRef(0)
  const hasAttemptedFetchRef = useRef(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Memoized search handler with retry logic and deduplication
  const handleSearchForEmail = useCallback(async (searchEmail: string, isRetry = false) => {
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...')
      return
    }

    // Prevent infinite retries
    if (!isRetry) {
      retryCountRef.current = 0
    } else if (retryCountRef.current >= MAX_RETRIES) {
      console.log('Max retries reached, giving up')
      toast.error('Error', 'Failed to load requests after multiple attempts. Please refresh the page.')
      setLoading(false)
      return
    }

    isFetchingRef.current = true
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/customer/track?email=${encodeURIComponent(searchEmail)}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        retryCountRef.current = 0 // Reset retry count on success
        if (data.requests.length === 0) {
          toast.warning('No Requests Found', 'No requests found for this email address')
        }
      } else {
        throw new Error(`HTTP ${res.status}`)
      }

      // Load quota
      const quotaRes = await fetch(`/api/customer/quota?email=${encodeURIComponent(searchEmail)}`)
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      retryCountRef.current++

      if (retryCountRef.current < MAX_RETRIES) {
        // Exponential backoff retry
        const delay = RETRY_DELAY * retryCountRef.current
        console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current})`)
        setTimeout(() => {
          isFetchingRef.current = false
          handleSearchForEmail(searchEmail, true)
        }, delay)
        return // Don't setLoading(false) yet, we're retrying
      } else {
        toast.error('Error', 'Failed to load requests. Please try again.')
        setRequests([])
        setQuota(null)
      }
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [toast])

  // Auto-fill email for customers and auto-search
  useEffect(() => {
    if (user && userRole === 'customer') {
      setEmail(user.email || '')
      // Auto-search for customers only once per user
      if (user.email && !hasAttemptedFetchRef.current) {
        hasAttemptedFetchRef.current = true
        handleSearchForEmail(user.email)
      }
    }

    // Reset when user changes (logout/login)
    return () => {
      if (!user) {
        hasAttemptedFetchRef.current = false
        retryCountRef.current = 0
        isFetchingRef.current = false
      }
    }
  }, [user, userRole, handleSearchForEmail])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    // Reset retry count for manual searches
    retryCountRef.current = 0
    hasAttemptedFetchRef.current = true
    handleSearchForEmail(email)
  }, [email, handleSearchForEmail])

  // Memoized status helpers
  const getStatusColor = useCallback((status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return '#0077C8'
    if (status === 'rejected') return '#DC2626'
    if (status === 'approved') return '#22C55E'
    return '#F59E0B'
  }, [])

  const getStatusBgColor = useCallback((status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return '#EAF3FB'
    if (status === 'rejected') return '#FEF2F2'
    if (status === 'approved') return '#F0FDF4'
    return '#FFFBEB'
  }, [])

  const getStatusLabel = useCallback((status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return 'Completed'
    if (visitStatus === 'visit-completed') return 'Awaiting Confirmation'
    if (status === 'rejected') return 'Rejected'
    if (status === 'approved') return 'Approved'
    return 'Pending'
  }, [])

  // Memoized filter counts - calculated once per requests change
  const filterCounts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved' && !r.scheduled_date && r.visit_status !== 'confirmed').length,
    scheduled: requests.filter(r => r.status === 'approved' && r.scheduled_date && r.visit_status !== 'confirmed').length,
    completed: requests.filter(r => r.visit_status === 'confirmed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests])

  // Memoized filter options
  const filterOptions = useMemo(() => [
    { key: 'all' as FilterOption, label: 'All', count: filterCounts.all },
    { key: 'pending' as FilterOption, label: 'Pending', count: filterCounts.pending },
    { key: 'approved' as FilterOption, label: 'Approved', count: filterCounts.approved },
    { key: 'scheduled' as FilterOption, label: 'Scheduled', count: filterCounts.scheduled },
    { key: 'completed' as FilterOption, label: 'Completed', count: filterCounts.completed },
    { key: 'rejected' as FilterOption, label: 'Rejected', count: filterCounts.rejected },
  ], [filterCounts])

  // Memoized filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filter === 'all') return true
      if (filter === 'pending') return r.status === 'pending'
      if (filter === 'approved') return r.status === 'approved' && !r.scheduled_date && r.visit_status !== 'confirmed'
      if (filter === 'scheduled') return r.status === 'approved' && r.scheduled_date && r.visit_status !== 'confirmed'
      if (filter === 'completed') return r.visit_status === 'confirmed'
      if (filter === 'rejected') return r.status === 'rejected'
      return true
    })
  }, [requests, filter])

  // Memoized sort requests
  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'location') {
      sorted.sort((a, b) => (a.site_location || '').localeCompare(b.site_location || ''))
    } else if (sortBy === 'status') {
      const statusOrder = { rejected: 0, pending: 1, approved: 2, scheduled: 3, confirmed: 4 }
      const getStatusKey = (r: any) => {
        if (r.status === 'rejected') return 'rejected'
        if (r.visit_status === 'confirmed') return 'confirmed'
        if (r.scheduled_date && r.status === 'approved') return 'scheduled'
        if (r.status === 'approved') return 'approved'
        return 'pending'
      }
      sorted.sort((a, b) =>
        (statusOrder[getStatusKey(a) as keyof typeof statusOrder] || 0) -
        (statusOrder[getStatusKey(b) as keyof typeof statusOrder] || 0)
      )
    }
    return sorted
  }, [filteredRequests, sortBy])

  // Calculate used percentage correctly
  const usedPercentage = quota && quota.totalHours > 0
    ? Math.round((quota.usedHours / quota.totalHours) * 100)
    : 0

  if (authLoading) {
    return (
      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const isCustomer = userRole === 'customer'
  const isAdmin = userRole === 'admin' || userRole === 'approver'

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
          Track Your Request
        </h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '15px' }}>
          {isCustomer ? 'View your service request status' : 'Enter email to check request status'}
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
            readOnly={isCustomer}
            style={{
              flex: 1,
              marginBottom: 0,
              backgroundColor: isCustomer ? '#F1F5F9' : '#FFFFFF',
              cursor: isCustomer ? 'not-allowed' : 'text'
            }}
          />
          {isAdmin && (
            <button type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Searching...' : 'Track Request'}
            </button>
          )}
        </div>
        {isCustomer && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748B' }}>
            Showing requests for your account
          </p>
        )}
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

      {/* Filter Options */}
      {requests.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '12px 16px',
          background: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>Filter:</span>
          {filterOptions.map((item) => (
            <FilterButton
              key={item.key}
              item={item}
              isActive={filter === item.key}
              onClick={() => setFilter(item.key)}
            />
          ))}
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
            <SortButton
              key={option}
              option={option}
              isActive={sortBy === option}
              onClick={() => setSortBy(option)}
            />
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
