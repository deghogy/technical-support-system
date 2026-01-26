'use client'

import { useState } from 'react'

export default function ScheduleForm({ id, requestedDate }: { id: string, requestedDate?: string }) {
  const [open, setOpen] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(requestedDate || '')
  const [duration, setDuration] = useState<number>(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = new FormData()
    body.append('status', 'approved')
    body.append('scheduled_date', scheduledDate)
    body.append('duration_hours', String(duration))

    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: 'POST',
        body,
      })

      if (res.ok || res.redirected) {
        window.location.href = '/admin/approvals'
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        setError(errorData.details || errorData.message || 'Failed to save schedule')
        console.error('Schedule save error:', errorData)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ marginRight: 8 }}>
        {open ? 'Cancel' : 'Schedule'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 8 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>
            Scheduled date
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              required
              style={{ display: 'block', marginTop: 6 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 6 }}>
            Duration (hours)
            <input
              type="number"
              min={1}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ display: 'block', marginTop: 6 }}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save schedule'}
          </button>

          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        </form>
      )}
    </div>
  )
}
