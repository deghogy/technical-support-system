'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatDateGMT7 } from '@/lib/dateFormatter'
import { useToast, ToastContainer } from '@/components/Toast'

// Calculate duration between two dates in hours (rounded down to favor customer)
function calculateDurationHours(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diffMs = end - start
  const diffHours = diffMs / (1000 * 60 * 60)
  return Math.floor(diffHours).toString()
}

export default function ConfirmVisitPage() {
  const params = useParams()
  const id = params.id as string

  const [visit, setVisit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [customerNotes, setCustomerNotes] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)
  const { toasts, toast, removeToast } = useToast()

  useEffect(() => {
    // Skip loading if already successfully confirmed
    if (success) return

    async function loadVisit() {
      // Only show error on first attempt
      const isFirstAttempt = !hasAttemptedLoad
      setHasAttemptedLoad(true)

      try {
        const res = await fetch(`/api/confirm-visit/${id}`)
        if (!res.ok) {
          if (isFirstAttempt) {
            toast.error('Error', 'Visit not found or already confirmed')
          }
          setLoading(false)
          return
        }
        const data = await res.json()
        setVisit(data.visit)
        setLoading(false)
      } catch (err) {
        console.error(err)
        if (isFirstAttempt) {
          toast.error('Error', 'Failed to load visit details')
        }
        setLoading(false)
      }
    }

    loadVisit()
  }, [id, toast, success, hasAttemptedLoad])

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setConfirming(true)

    try {
      const res = await fetch(`/api/confirm-visit/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_notes: customerNotes }),
      })

      if (res.ok) {
        setSuccess(true)
        setCustomerNotes('')
        toast.success('Visit Confirmed', 'Thank you! Your confirmation has been recorded.')
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        const errorMessage = errorData.details || errorData.message || 'Failed to confirm visit'
        toast.error('Validation Error', errorMessage, 8000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error', err instanceof Error ? err.message : 'Failed to confirm visit')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 600, margin: '60px auto' }}>
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading visit details...</p>
      </main>
    )
  }

  if (!visit) {
    return (
      <main style={{ maxWidth: 600, margin: '60px auto' }}>
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>❌ Visit not found or already confirmed</p>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 600, margin: '60px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1>Confirm Site Visit</h1>
        <p style={{ color: 'var(--muted)', margin: '8px 0 0 0' }}>
          Please confirm that the technician visited your site and the work was completed.
        </p>
      </div>

      <div className="card">
        <p style={{ margin: 0 }}>
          <b>Service Location:</b> {visit.site_location}
        </p>
        <p style={{ margin: '8px 0 0 0' }}>
          <b>Problem:</b> {visit.problem_desc}
        </p>
        <p style={{ margin: '8px 0 0 0', color: 'var(--muted)' }}>
          <b>Scheduled:</b> {formatDateGMT7(visit.scheduled_date)}
        </p>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Visit Completed</h3>
        <p style={{ margin: '4px 0', color: 'var(--muted)' }}>
          <b>🕐 Start time:</b> {formatDateGMT7(visit.actual_start_time)}
        </p>
        <p style={{ margin: '4px 0', color: 'var(--muted)' }}>
          <b>🕑 End time:</b> {formatDateGMT7(visit.actual_end_time)}
        </p>
        {visit.actual_start_time && visit.actual_end_time && (
          <p style={{ margin: '8px 0 0 0', color: '#64748B', fontSize: '14px' }}>
            <b>⏱ Duration:</b> {calculateDurationHours(visit.actual_start_time, visit.actual_end_time)} hours
          </p>
        )}
        {visit.technician_notes && (
          <p style={{ margin: '8px 0 0 0', padding: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', fontSize: '14px' }}>
            <b>Technician Notes:</b>
            <br />
            {visit.technician_notes}
          </p>
        )}
        {visit.document_url && (
          <div style={{ margin: '12px 0 0 0', padding: '12px', backgroundColor: '#EAF3FB', borderRadius: '4px', borderLeft: '3px solid #0077C8' }}>
            <p style={{ margin: 0, marginBottom: 8 }}>
              <b>📎 Attached Document</b>
            </p>
            <a
              href={visit.document_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#0077C8',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ⬇️ Download Document
            </a>
          </div>
        )}
      </div>

      {success ? (
        <div className="card" style={{ border: '1px solid #0077C8', backgroundColor: '#EAF3FB' }}>
          <p style={{ margin: 0, color: '#0077C8' }}>
            ✅ <b>Thank you!</b> Your confirmation has been recorded. The site visit is now complete.
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            You can close this page now.
          </p>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="card">
          <label style={{ display: 'block', marginBottom: 12 }}>
            <small style={{ color: 'var(--muted)' }}>Additional comments (optional)</small>
            <textarea
              value={customerNotes}
              onChange={e => setCustomerNotes(e.target.value)}
              placeholder="Any feedback or notes about the service..."
              style={{ display: 'block', marginTop: 6, height: '100px' }}
            />
          </label>

          <button type="submit" disabled={confirming} style={{ width: '100%' }}>
            {confirming ? 'Confirming...' : 'Confirm Visit Completed'}
          </button>
        </form>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </main>
  )
}
