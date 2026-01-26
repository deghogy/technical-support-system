'use client'

import { useState } from 'react'

export default function VisitRecorder({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = new FormData()
    body.append('actual_start_time', startTime)
    body.append('actual_end_time', endTime)
    body.append('technician_notes', notes)

    try {
      const res = await fetch(`/api/admin/visits/${id}`, {
        method: 'POST',
        body,
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        setError(errorData.details || errorData.message || 'Failed to save visit record')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save visit record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minWidth: '200px' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="nav-button"
      >
        {open ? 'Cancel' : 'Record Visit'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 8 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>Start time</small>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
              style={{ display: 'block', marginTop: 4 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>End time</small>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
              style={{ display: 'block', marginTop: 4 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>Technician notes (optional)</small>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Work completed successfully, replaced HMI panel..."
              style={{ display: 'block', marginTop: 4, height: '80px' }}
            />
          </label>

          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Saving...' : 'Save Visit Record'}
          </button>

          {error && <p style={{ color: 'var(--danger)', margin: '8px 0 0 0' }}>{error}</p>}
        </form>
      )}
    </div>
  )
}
