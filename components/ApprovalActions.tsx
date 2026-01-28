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
          onClick={() => setScheduleOpen(!scheduleOpen)}
          disabled={loading}
          style={{
            background: scheduleOpen ? '#64748B' : '#0077C8',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {scheduleOpen ? 'Cancel' : 'Approve & Schedule'}
        </button>

        <button
          onClick={() => doAction('rejected')}
          disabled={loading}
          style={{
            background: '#FFFFFF',
            color: '#64748B',
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #D0D7E2',
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8FAFC'
            e.currentTarget.style.borderColor = '#64748B'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.borderColor = '#D0D7E2'
          }}
        >
          Reject
        </button>
      </div>

      {scheduleOpen && (
        <div
          style={{
            padding: '16px',
            background: '#F8FAFC',
            border: '1px solid #EAF3FB',
            borderRadius: '8px',
            marginTop: '8px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#0F172A'
              }}>
                Scheduled date & time
              </span>
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #D0D7E2',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#0F172A'
              }}>
                Duration (hours)
              </span>
            </label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: '120px',
                padding: '8px 10px',
                border: '1px solid #D0D7E2',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
          </div>

          <button
            onClick={() => doAction('approved', true)}
            disabled={loading || !scheduledDate}
            style={{
              width: '100%',
              background: !scheduledDate ? '#94A3B8' : '#22C55E',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading || !scheduledDate ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Approving...' : 'Confirm Approval'}
          </button>
        </div>
      )}

      {error && (
        <p style={{
          color: '#DC2626',
          fontSize: '13px',
          background: '#FEF2F2',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #FECACA',
          margin: '8px 0 0 0',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
