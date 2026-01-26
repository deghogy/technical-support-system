 'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget // ✅ STORE FORM REF EARLY
    setLoading(true)
    setMessage('')

    const formData = new FormData(form)

    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requester_name: formData.get('name'),
          requester_email: formData.get('email'),
          site_location: formData.get('location'),
          problem_desc: formData.get('problem'),
          requested_date: formData.get('date'),
          estimated_hours: formData.get('estimated_hours'),
        }),
      })

      if (res.ok) {
        setMessage('Request submitted successfully')
        form.reset() // ✅ SAFE NOW
      } else {
        setMessage('Failed to submit request')
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
