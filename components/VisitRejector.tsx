'use client'

import { useState } from 'react'

export default function VisitRejector({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/visits/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'No reason provided' }),
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        setError(errorData.details || errorData.message || 'Failed to reject visit')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to reject visit')
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
        style={{
          background: 'transparent',
          color: 'var(--danger)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
        }}
      >
        {open ? 'Cancel' : 'Reject Visit'}
      </button>

      {open && (
        <form onSubmit={handleReject} className="card" style={{ marginTop: 8, borderColor: 'var(--danger)' }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>Reason for rejection (optional)</small>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Equipment malfunction, Unable to access site..."
              style={{ display: 'block', marginTop: 4, height: '80px' }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>

          {error && <p style={{ color: 'var(--danger)', margin: '8px 0 0 0' }}>{error}</p>}
        </form>
      )}
    </div>
  )
}
