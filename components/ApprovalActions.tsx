'use client'

import React, { useState } from 'react'

export default function ApprovalActions({ id, requestedDate }: { id: string; requestedDate?: string }) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(requestedDate || '')
  const [duration, setDuration] = useState<number>(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function doAction(status: 'approved' | 'rejected', isScheduling = false) {
    setLoading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('status', status)
      if (isScheduling) {
        body.append('scheduled_date', scheduledDate)
        body.append('duration_hours', String(duration))
      }

      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: 'POST',
        body,
      })

      if (res.ok || res.redirected) {
        window.location.href = '/admin/approvals'
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        setError(errorData.details || errorData.message || 'Failed to perform action')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to perform action')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="nav-button"
          onClick={() => setScheduleOpen(!scheduleOpen)}
          disabled={loading}
        >
          {scheduleOpen ? 'Cancel' : 'Approve & Schedule'}
        </button>

        <button
          className="nav-button"
          style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.04)' }}
          onClick={() => doAction('rejected')}
          disabled={loading}
        >
          Reject
        </button>
      </div>

      {scheduleOpen && (
        <div className="card" style={{ padding: '12px' }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>Scheduled date & time</small>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              required
              style={{ display: 'block', marginTop: 4 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>Duration (hours)</small>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ display: 'block', marginTop: 4 }}
            />
          </label>

          <button
            onClick={() => doAction('approved', true)}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Approving...' : 'Approve with Schedule'}
          </button>
        </div>
      )}

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}
