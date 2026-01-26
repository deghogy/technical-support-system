'use client'

import { useState, useEffect } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'

export default function HistoryPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'scheduled' | 'confirmed'>('all')

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
  }, [])

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'approved') return r.status === 'approved'
    if (filter === 'rejected') return r.status === 'rejected'
    if (filter === 'scheduled') return r.status === 'approved' && r.scheduled_date
    if (filter === 'confirmed') return r.visit_status === 'confirmed'
    return true
  })

  return (
    <main style={{ maxWidth: 900, margin: '40px auto' }}>
      <h1>Request History</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? 'var(--accent)' : 'transparent',
            color: filter === 'all' ? '#fff' : 'var(--muted)',
            border: filter === 'all' ? 'none' : '1px solid rgba(255,255,255,0.04)',
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
          }}
        >
          Approved ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          style={{
            background: filter === 'scheduled' ? 'var(--accent)' : 'transparent',
            color: filter === 'scheduled' ? '#fff' : 'var(--muted)',
            border: filter === 'scheduled' ? 'none' : '1px solid rgba(255,255,255,0.04)',
          }}
        >
          Scheduled ({requests.filter(r => r.status === 'approved' && r.scheduled_date).length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          style={{
            background: filter === 'confirmed' ? 'var(--accent)' : 'transparent',
            color: filter === 'confirmed' ? '#fff' : 'var(--muted)',
            border: filter === 'confirmed' ? 'none' : '1px solid rgba(255,255,255,0.04)',
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
          }}
        >
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading history...</p>
      ) : filteredRequests.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No requests found for this filter</p>
      ) : (
        filteredRequests.map(r => (
          <div key={r.id} className="card">
            <p style={{ margin: 0 }}><b>{r.requester_name}</b> <small style={{ color: 'var(--muted)' }}>({r.requester_email})</small></p>
            <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '14px' }}>📍 {r.site_location}</p>
            <p style={{ margin: '8px 0' }}>
              <b>Status:</b>{' '}
              <span style={{
                color: r.status === 'rejected' ? 'var(--danger)' : r.visit_status === 'confirmed' ? 'var(--accent)' : 'var(--muted)',
              }}>
                {r.visit_status === 'confirmed' ? '✅ Confirmed' : r.status === 'rejected' ? '❌ Rejected' : r.status === 'approved' ? '✓ Approved' : r.status}
              </span>
            </p>
            
            {r.scheduled_date && (
              <p style={{ margin: '4px 0', color: 'var(--muted)' }}>📅 Scheduled: {formatDateOnlyGMT7(r.scheduled_date)}</p>
            )}
            
            {r.approved_at && (
              <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '14px' }}>Approved: {formatDateGMT7(r.approved_at)}</p>
            )}
            
            {r.actual_start_time && r.actual_end_time && (
              <div style={{ margin: '8px 0', padding: '8px', backgroundColor: 'var(--card)', borderRadius: '4px', fontSize: '14px' }}>
                <p style={{ margin: '0 0 4px 0' }}>🕐 Started: {formatDateGMT7(r.actual_start_time)}</p>
                <p style={{ margin: 0 }}>🕑 Ended: {formatDateGMT7(r.actual_end_time)}</p>
              </div>
            )}
            
            {r.customer_confirmed_at && (
              <p style={{ margin: '4px 0', color: 'var(--accent)', fontSize: '14px' }}>✓ Customer confirmed: {formatDateGMT7(r.customer_confirmed_at)}</p>
            )}
          </div>
        ))
      )}
    </main>
  )
}
