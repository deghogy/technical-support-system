 'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [quota, setQuota] = useState<any>(null)
  const [checkingQuota, setCheckingQuota] = useState(false)
  const [quotaError, setQuotaError] = useState('')
  const [email, setEmail] = useState('')
  const [quotaChecked, setQuotaChecked] = useState(false)

  async function checkQuota() {
    setCheckingQuota(true)
    setQuotaError('')
    setQuota(null)

    if (!email) {
      setQuotaError('Please enter your email first')
      setCheckingQuota(false)
      return
    }

    try {
      const res = await fetch(`/api/customer/quota?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        // If quota is 0 or not found, show error
        if (!data || data.totalHours === 0) {
          setQuotaError('Email not registered in quota system. Please contact support.')
          setQuota(null)
          setQuotaChecked(false)
        } else {
          setQuota(data)
          setQuotaChecked(true)
        }
      } else {
        setQuotaError('Email not registered in quota system. Please contact support.')
        setQuota(null)
        setQuotaChecked(false)
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
        setMessage('✅ Request submitted successfully!')
        form.reset()
        setQuota(null)
        setQuotaChecked(false)
        setEmail('')
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
              <div style={{ background: 'var(--card)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                📋 Please check your quota first to proceed with the request
              </div>

              <input
                name="name"
                placeholder="Your name"
                required
              />

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setQuotaChecked(false)
                    setQuota(null)
                    setQuotaError('')
                  }}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={checkQuota}
                  disabled={checkingQuota || !email}
                  style={{
                    background: quotaChecked ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${quotaChecked ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                    color: quotaChecked ? '#fff' : 'var(--muted)',
                    padding: '10px 16px',
                    borderRadius: '4px',
                    cursor: email ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: quotaChecked ? 600 : 400,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {checkingQuota ? '⏳ Checking...' : quotaChecked ? '✅ Verified' : '🔍 Check Quota'}
                </button>
              </div>

              {quotaError && (
                <p style={{ color: 'var(--danger)', fontSize: '14px', margin: '8px 0', background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '4px' }}>
                  ❌ {quotaError}
                </p>
              )}

              {quota && quota.totalHours > 0 && (
                <div style={{ padding: '12px', background: 'var(--card)', borderRadius: '4px', fontSize: '14px', border: '1px solid var(--accent)' }}>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <b>✅ Your Hour Quota:</b> {quota.availableHours}/{quota.totalHours} hours available
                  </p>
                  {quota.availableHours < 10 && (
                    <p style={{ margin: 0, color: 'var(--danger)' }}>
                      ⚠️ Running low on hours. Request only what you need.
                    </p>
                  )}
                </div>
              )}

              {/* Show rest of form only after quota is verified */}
              {quotaChecked && quota && quota.totalHours > 0 && (
                <>
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
                    placeholder="Estimated hours needed"
                    min="1"
                    max="999"
                    required
                  />

                  <button type="submit" disabled={loading}>
                    {loading ? '⏳ Submitting...' : '✉️ Submit Request'}
                  </button>
                </>
              )}

              {quotaChecked && quotaError && (
                <button 
                  type="button"
                  disabled
                  style={{
                    background: 'var(--card)',
                    color: 'var(--muted)',
                    cursor: 'not-allowed',
                    opacity: 0.5,
                  }}
                >
                  Cannot proceed - contact support
                </button>
              )}
            </form>

            {message && (
              <p style={{ 
                padding: '12px', 
                borderRadius: '4px', 
                background: message.includes('✅') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                color: message.includes('✅') ? 'var(--accent)' : 'var(--danger)',
                marginTop: '16px'
              }}>
                {message}
              </p>
            )}
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
                <li style={{ margin: '8px 0' }}>✅ Check your available quota</li>
                <li style={{ margin: '8px 0' }}>📝 Submit your site visit request</li>
                <li style={{ margin: '8px 0' }}>📋 Our team reviews and approves</li>
                <li style={{ margin: '8px 0' }}>📅 We schedule the visit</li>
                <li style={{ margin: '8px 0' }}>🔧 Technician completes the work</li>
                <li style={{ margin: '8px 0' }}>✔️ You confirm completion</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
