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

    // Note: Quota is no longer checked at submission time.
    // Actual hours will be deducted when technician records the visit.
    // We still collect estimated_hours for planning purposes.

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
          estimated_hours: Number(formData.get('estimated_hours')),
        }),
      })

      if (res.ok) {
        setMessage('Request submitted successfully!')
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
    <main className="container-sm" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', alignItems: 'flex-start' }}>
        {/* Left Column - Form */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
              Site Visit Request
            </h1>
            <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
              Submit a technical support request for your site. Check your quota first to proceed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card" style={{ padding: '24px' }}>
            <div style={{ background: '#EAF3FB', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', borderLeft: '3px solid #0077C8' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                Please check your quota before submitting a request
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Your Name
              </label>
              <input
                name="name"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  placeholder="your.email@company.com"
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
                    background: quotaChecked ? '#22C55E' : '#EAF3FB',
                    color: quotaChecked ? '#FFFFFF' : '#0077C8',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: email ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                    border: quotaChecked ? 'none' : '1px solid #0077C8',
                  }}
                >
                  {checkingQuota ? 'Checking...' : quotaChecked ? 'Verified' : 'Check Quota'}
                </button>
              </div>
            </div>

            {quotaError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <p style={{ color: '#991B1B', fontSize: '13px', margin: 0 }}>
                  {quotaError}
                </p>
              </div>
            )}

            {quota && quota.totalHours > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '14px', borderRadius: '6px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0F172A' }}>
                  <strong>Quota Available:</strong> {quota.availableHours} of {quota.totalHours} hours
                </p>
                {quota.availableHours < 10 && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#92400E' }}>
                    Running low on hours. Request only what you need.
                  </p>
                )}
                <div style={{ width: '100%', height: '6px', background: '#DCFCE7', borderRadius: '3px', marginTop: '10px' }}>
                  <div style={{
                    width: `${(quota.availableHours / quota.totalHours) * 100}%`,
                    height: '100%',
                    background: '#22C55E',
                    borderRadius: '3px',
                  }} />
                </div>
              </div>
            )}

            {quotaChecked && quota && quota.totalHours > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Site Location
                  </label>
                  <input
                    name="location"
                    placeholder="Enter site location"
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Problem Description
                  </label>
                  <textarea
                    name="problem"
                    placeholder="Describe the technical issue you need assistance with"
                    rows={4}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      name="estimated_hours"
                      placeholder="e.g. 4"
                      min="1"
                      max="999"
                      required
                    />
                    <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#64748B' }}>
                      For planning only - actual hours will be billed
                    </small>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </>
            )}

            {quotaChecked && quotaError && (
              <button
                type="button"
                disabled
                style={{
                  width: '100%',
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  cursor: 'not-allowed',
                  opacity: 0.8,
                }}
              >
                Cannot proceed - contact support
              </button>
            )}
          </form>

          {message && (
            <div style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '6px',
              background: message.includes('successfully') ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${message.includes('successfully') ? '#86EFAC' : '#FECACA'}`,
            }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: message.includes('successfully') ? '#166534' : '#991B1B',
              }}>
                {message}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 12px 0' }}>
              Track Your Request
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#64748B', fontSize: '14px' }}>
              Already submitted a request? Check its status and view updates.
            </p>
            <Link
              href="/track-request"
              style={{
                display: 'inline-block',
                background: '#0077C8',
                color: '#FFFFFF',
                padding: '10px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Track Request
            </Link>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 16px 0' }}>
              How It Works
            </h3>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {[
                'Check your available quota',
                'Submit site visit request',
                'Our team reviews and approves',
                'Visit is scheduled',
                'Technician completes work',
                'You confirm completion',
              ].map((step, index) => (
                <li
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: index < 5 ? '1px solid #EAF3FB' : 'none',
                    fontSize: '14px',
                    color: '#475569',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      background: '#EAF3FB',
                      color: '#0077C8',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
