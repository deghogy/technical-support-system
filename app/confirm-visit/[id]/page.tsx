'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatDateGMT7 } from '@/lib/dateFormatter'
import QRCode from '@/components/QRCode'

export default function ConfirmVisitPage() {
  const params = useParams()
  const id = params.id as string

  const [visit, setVisit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [customerNotes, setCustomerNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadVisit() {
      try {
        const res = await fetch(`/api/confirm-visit/${id}`)
        if (!res.ok) {
          setError('Visit not found or already confirmed')
          setLoading(false)
          return
        }
        const data = await res.json()
        setVisit(data.visit)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to load visit details')
        setLoading(false)
      }
    }

    loadVisit()
  }, [id])

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setConfirming(true)
    setError('')

    try {
      const res = await fetch(`/api/confirm-visit/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_notes: customerNotes }),
      })

      if (res.ok) {
        setSuccess(true)
        setCustomerNotes('')
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        setError(errorData.details || errorData.message || 'Failed to confirm visit')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to confirm visit')
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
          <p style={{ color: 'var(--danger)', margin: 0 }}>❌ {error}</p>
        </div>
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

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <QRCode url={typeof window !== 'undefined' ? window.location.href : ''} />
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 8 }}>Scan this QR code to share confirmation</p>
        </div>
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
        {visit.technician_notes && (
          <p style={{ margin: '8px 0 0 0', padding: '8px', backgroundColor: 'var(--card)', borderRadius: '4px', fontSize: '14px' }}>
            <b>Technician Notes:</b>
            <br />
            {visit.technician_notes}
          </p>
        )}
      </div>

      {success ? (
        <div className="card" style={{ borderColor: 'var(--accent)', backgroundColor: 'rgba(30, 144, 255, 0.05)' }}>
          <p style={{ margin: 0, color: 'var(--accent)' }}>
            ✅ <b>Thank you!</b> Your confirmation has been recorded. The site visit is now complete.
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

          {error && <p style={{ color: 'var(--danger)', margin: '12px 0 0 0' }}>{error}</p>}
        </form>
      )}
    </main>
  )
}
