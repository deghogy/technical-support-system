 'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [quota, setQuota] = useState<any>(null)
  const [checkingQuota, setCheckingQuota] = useState(false)
  const [quotaError, setQuotaError] = useState('')

  async function checkQuota(e: React.FormEvent) {
    e.preventDefault()
    setCheckingQuota(true)
    setQuotaError('')
    setQuota(null)

    const email = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value

    if (!email) {
      setQuotaError('Please enter your email first')
      setCheckingQuota(false)
      return
    }

    try {
      const res = await fetch(`/api/customer/quota?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setQuota(data)
      } else {
        setQuotaError('Failed to check quota')
      }
    } catch (error) {
      console.error(error)
      setQuotaError('Error checking quota')
    } finally {
      setCheckingQuota(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    setLoading(true)
    setMessage('')

    const formData = new FormData(form)
    const estimatedHours = Number(formData.get('estimated_hours'))
    const email = formData.get('email') as string

    // Check quota before submission
    if (quota && quota.availableHours < estimatedHours) {
      setMessage(`Insufficient quota. You have ${quota.availableHours} hours available but need ${estimatedHours} hours.`)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requester_name: formData.get('name'),
          requester_email: email,
          site_location: formData.get('location'),
          problem_desc: formData.get('problem'),
          requested_date: formData.get('date'),
          estimated_hours: estimatedHours,
        }),
      })

      if (res.ok) {
        setMessage('Request submitted successfully')
        form.reset()
        setQuota(null)
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to submit request' }))
        setMessage(errorData.message || 'Failed to submit request')
      }
    } catch (error) {
      console.error(error)
      setMessage('Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <main style={{ maxWidth: 900, margin: '60px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h2>Submit Site Visit Request</h2>
            <p style={{ color: 'var(--muted)' }}>
              Fill out the form below to request a technical support visit at your site.
            </p>

            <form onSubmit={handleSubmit} className="card request-form">
              <input
                name="name"
                placeholder="Your name"
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Your email"
                required
              />

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={checkQuota}
                  disabled={checkingQuota}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'var(--muted)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    flex: 1,
                  }}
                >
                  {checkingQuota ? 'Checking...' : 'Check My Quota'}
                </button>
              </div>

              {quota && (
                <div style={{ padding: '12px', background: 'var(--card)', borderRadius: '4px', fontSize: '14px' }}>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <b>Your Hour Quota:</b> {quota.availableHours}/{quota.totalHours} hours available
                  </p>
                  {quota.totalHours === 0 && (
                    <p style={{ margin: 0, color: 'var(--danger)' }}>
                      ⚠️ No quota allocated. Contact support to request hours.
                    </p>
                  )}
                </div>
              )}

              {quotaError && (
                <p style={{ color: 'var(--danger)', fontSize: '14px', margin: '8px 0' }}>{quotaError}</p>
              )}

              <input
                name="location"
                placeholder="Site location"
                required
              />

              <textarea
                name="problem"
                placeholder="Problem description"
                required
              />

              <input
                type="date"
                name="date"
                required
              />

              <input
                type="number"
                name="estimated_hours"
                placeholder="Estimated hours"
                min="1"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            {message && <p>{message}</p>}
          </div>

          <div style={{ flex: 1 }}>
            <div className="card">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Track Your Request</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--muted)', fontSize: '14px' }}>
                Already submitted a request? Track its status here.
              </p>
              <Link
                href="/track-request"
                style={{
                  display: 'inline-block',
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Track Request Status
              </Link>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>How It Works</h3>
              <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '14px' }}>
                <li style={{ margin: '8px 0' }}>Submit your site visit request</li>
                <li style={{ margin: '8px 0' }}>Our team reviews and approves your request</li>
                <li style={{ margin: '8px 0' }}>We schedule the visit and notify you</li>
                <li style={{ margin: '8px 0' }}>Technician completes the work</li>
                <li style={{ margin: '8px 0' }}>You confirm the visit completion</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
