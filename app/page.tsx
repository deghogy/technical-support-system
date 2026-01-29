'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [quota, setQuota] = useState<any>(null)
  const [checkingQuota, setCheckingQuota] = useState(false)
  const [quotaError, setQuotaError] = useState('')
  const [email, setEmail] = useState('')
  const [quotaChecked, setQuotaChecked] = useState(false)
  const [savedEmails, setSavedEmails] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [supportType, setSupportType] = useState<'remote' | 'onsite'>('onsite')
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Load saved emails from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tsm_saved_emails')
    if (stored) {
      try {
        const emails = JSON.parse(stored)
        if (Array.isArray(emails)) {
          setSavedEmails(emails)
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, [])

  // Save email to localStorage when quota check succeeds
  const saveEmail = (emailToSave: string) => {
    const normalized = emailToSave.toLowerCase().trim()
    if (!normalized) return

    setSavedEmails(prev => {
      // Remove if exists, add to front (most recent first)
      const filtered = prev.filter(e => e.toLowerCase() !== normalized)
      const updated = [normalized, ...filtered].slice(0, 10) // Keep max 10
      localStorage.setItem('tsm_saved_emails', JSON.stringify(updated))
      return updated
    })
  }

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
          saveEmail(email) // Save successful email for future autocomplete
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
          estimated_hours: 0, // Not collected from form - actual hours used for billing
          support_type: supportType,
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

            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={emailInputRef}
                    type="email"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setQuotaChecked(false)
                      setQuota(null)
                      setQuotaError('')
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    required
                    style={{ width: '100%' }}
                    autoComplete="off"
                  />
                  {/* Email autocomplete dropdown */}
                  {showSuggestions && savedEmails.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      marginTop: '4px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}>
                      {savedEmails
                        .filter(savedEmail => savedEmail.toLowerCase().includes(email.toLowerCase()))
                        .map((savedEmail, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setEmail(savedEmail)
                              setShowSuggestions(false)
                              setQuotaChecked(false)
                              setQuota(null)
                              setQuotaError('')
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 12px',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#0F172A',
                              borderBottom: index < savedEmails.length - 1 ? '1px solid #F1F5F9' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F8FAFC'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            {savedEmail}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <div style={{ flex: 1, height: '8px', background: '#DCFCE7', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(quota.availableHours / quota.totalHours) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((quota.availableHours / quota.totalHours) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {quotaChecked && quota && quota.totalHours > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Support Type
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setSupportType('onsite')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: supportType === 'onsite' ? '2px solid #0077C8' : '1px solid #E2E8F0',
                        background: supportType === 'onsite' ? '#EAF3FB' : '#FFFFFF',
                        color: supportType === 'onsite' ? '#0077C8' : '#64748B',
                        fontWeight: supportType === 'onsite' ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      Direct Visit (On-site)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupportType('remote')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: supportType === 'remote' ? '2px solid #0077C8' : '1px solid #E2E8F0',
                        background: supportType === 'remote' ? '#EAF3FB' : '#FFFFFF',
                        color: supportType === 'remote' ? '#0077C8' : '#64748B',
                        fontWeight: supportType === 'remote' ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                      Remote Support
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    {supportType === 'remote' ? 'Location / Department' : 'Site Location'}
                  </label>
                  <input
                    name="location"
                    placeholder={supportType === 'remote' ? 'Enter location or department' : 'Enter site location'}
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

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    style={{
                      paddingLeft: '12px',
                      paddingRight: '8px',
                    }}
                  />
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
