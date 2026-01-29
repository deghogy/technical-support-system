'use client'

import { useState } from 'react'
import { useToast, ToastContainer } from './Toast'

export default function VisitRecorder({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [document, setDocument] = useState<File | null>(null)
  const [documentPreview, setDocumentPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const { toasts, toast, removeToast } = useToast()

  function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setDocument(file)
      setDocumentPreview(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const body = new FormData()
    body.append('actual_start_time', startTime)
    body.append('actual_end_time', endTime)
    body.append('technician_notes', notes)
    if (document) {
      body.append('document', document)
    }

    try {
      const res = await fetch(`/api/admin/visits/${id}`, {
        method: 'POST',
        body,
      })

      if (res.ok) {
        toast.success('Visit Recorded', 'The site visit has been recorded successfully.')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        const errorMessage = errorData.details || errorData.message || 'Failed to save visit record'
        toast.error('Validation Error', errorMessage, 8000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error', err instanceof Error ? err.message : 'Failed to save visit record')
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
          background: open ? '#64748B' : '#0077C8',
          color: '#FFFFFF',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.15s ease',
        }}
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

          <label style={{ display: 'block', marginBottom: 8 }}>
            <small style={{ color: 'var(--muted)' }}>Attach document (PDF, Image, or Word) - Optional</small>
            <input
              type="file"
              onChange={handleDocumentChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ display: 'block', marginTop: 4 }}
            />
            {documentPreview && (
              <small style={{ color: 'var(--accent)', display: 'block', marginTop: 4 }}>
                ✓ {documentPreview}
              </small>
            )}
          </label>

          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Saving...' : 'Save Visit Record'}
          </button>
        </form>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

