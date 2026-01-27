'use client'

import { useState } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'

export default function TrackRequestPage() {
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [quota, setQuota] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

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
    if (status === 'rejected') return 'var(--danger)'
    if (status === 'approved') return 'var(--accent)'
    return 'var(--muted)'
  }

  const getStatusLabel = (status: string, visitStatus: string) => {
    if (visitStatus === 'confirmed') return '✅ Completed & Confirmed'
    if (visitStatus === 'visit-completed') return '⏳ Awaiting Your Confirmation'
    if (status === 'rejected') return '❌ Rejected'
    if (status === 'approved') return '✓ Approved'
    return '⏳ Pending Review'
  }

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
              {quota.availableHours}/{quota.totalHours}h
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

      {searched && requests.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No requests found for this email address</p>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: 0 }}>
                  <b>📍 {req.site_location}</b>
                </p>
                <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                  {req.problem_desc}
                </p>
              </div>

              <div style={{
                padding: '12px',
                background: 'var(--card)',
                borderRadius: '6px',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Status</span>
                  <span style={{
                    color: getStatusColor(req.status, req.visit_status),
                    fontWeight: 600,
                    fontSize: '14px',
                  }}>
                    {getStatusLabel(req.status, req.visit_status)}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                <p style={{ margin: '4px 0' }}>
                  <b>Requested:</b> {formatDateOnlyGMT7(req.requested_date)}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <b>Estimated hours:</b> {req.estimated_hours}h
                </p>

                {req.approved_at && (
                  <p style={{ margin: '4px 0' }}>
                    <b>Approved:</b> {formatDateGMT7(req.approved_at)}
                  </p>
                )}

                {req.scheduled_date && (
                  <p style={{ margin: '4px 0' }}>
                    <b>Scheduled:</b> {formatDateOnlyGMT7(req.scheduled_date)} ({req.duration_hours}h)
                  </p>
                )}

                {req.actual_start_time && req.actual_end_time && (
                  <>
                    <p style={{ margin: '4px 0' }}>
                      <b>Visit completed:</b>
                    </p>
                    <p style={{ margin: '4px 0 0 0', paddingLeft: '12px' }}>
                      🕐 Started: {formatDateGMT7(req.actual_start_time)}
                    </p>
                    <p style={{ margin: '4px 0 0 0', paddingLeft: '12px' }}>
                      🕑 Ended: {formatDateGMT7(req.actual_end_time)}
                    </p>
                  </>
                )}

                {req.technician_notes && (
                  <div style={{ margin: '8px 0', padding: '8px', background: 'rgba(30, 144, 255, 0.05)', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>
                      📝 Technician Notes
                    </p>
                    <p style={{ margin: 0, fontSize: '13px' }}>{req.technician_notes}</p>
                  </div>
                )}

                {req.visit_status === 'visit-completed' && !req.customer_confirmed_at && (
                  <div style={{ margin: '12px 0 0 0', padding: '12px', background: 'rgba(30, 144, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(30, 144, 255, 0.2)' }}>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
                      ⏳ Awaiting Your Confirmation
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--muted)' }}>
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
                        fontSize: '14px',
                      }}
                    >
                      Confirm Visit Completion
                    </a>
                  </div>
                )}

                {req.customer_confirmed_at && (
                  <p style={{ margin: '8px 0 0 0', color: 'var(--accent)', fontWeight: 600 }}>
                    ✅ Confirmed on {formatDateGMT7(req.customer_confirmed_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
