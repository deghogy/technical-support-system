'use client'

import { useState } from 'react'
import { useToast, ToastContainer } from './Toast'

export default function VisitRejector({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { toasts, toast, removeToast } = useToast()

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/visits/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'No reason provided' }),
      })

      if (res.ok) {
        toast.success('Visit Rejected', 'The visit has been rejected and the customer will be notified')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        const errorMessage = errorData.errors
          ? errorData.errors.map((err: any) => `• ${err.message}`).join('\n')
          : errorData.details || errorData.message || 'Failed to reject visit'
        toast.error('Rejection Failed', errorMessage, 8000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error', err instanceof Error ? err.message : 'Failed to reject visit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minWidth: '200px' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: open ? '#64748B' : '#FEF2F2',
          color: open ? '#FFFFFF' : '#DC2626',
          border: '1px solid #FECACA',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.15s ease',
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

          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </form>
      )}
    </div>
  )
}
