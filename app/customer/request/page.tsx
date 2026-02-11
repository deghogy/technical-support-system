'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast, ToastContainer } from '@/components/Toast'
import { useAuth } from '@/components/contexts/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

interface Location {
  id: string
  location_name: string
}

export default function CustomerRequestPage() {
  const router = useRouter()
  const { user, role, name: userName, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [quota, setQuota] = useState<any>(null)
  const [checkingQuota, setCheckingQuota] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [supportType, setSupportType] = useState<'remote' | 'onsite'>('onsite')
  const [problemDesc, setProblemDesc] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const { toasts, toast, removeToast } = useToast()

  // Redirect if not customer - wait for both user and role to be determined
  useEffect(() => {
    // Don't redirect while still loading auth state
    if (authLoading) return

    // If no user, redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    // If user exists but role is not yet loaded, wait (don't redirect yet)
    // This prevents race condition where role is null initially
    if (role === null) {
      // Give it a small grace period for role to load from cache
      const timeoutId = setTimeout(() => {
        // After grace period, if role is still null, redirect
        if (role === null) {
          router.push('/login')
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }

    // Now we have both user and role, check authorization
    if (role === 'admin' || role === 'approver') {
      router.push('/admin/dashboard')
    } else if (role !== 'customer') {
      router.push('/login')
    }
  }, [user, role, authLoading, router])

  // Fetch customer locations and quota on mount
  useEffect(() => {
    if (user && role === 'customer') {
      fetchLocations()
      checkQuota()
    }
  }, [user, role])

  async function fetchLocations() {
    try {
      const res = await fetch('/api/customer/locations')
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  async function checkQuota() {
    setCheckingQuota(true)
    try {
      const res = await fetch('/api/customer/quota')
      if (res.ok) {
        const data = await res.json()
        setQuota(data)
      } else {
        toast.error('Error', 'Failed to load quota information')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error', 'Failed to check quota')
    } finally {
      setCheckingQuota(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedLocation) {
      toast.error('Location Required', 'Please select a site location')
      return
    }

    if (!quota || quota.availableHours <= 0) {
      toast.error('No Quota', 'You have no available quota. Please contact support.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_location: selectedLocation,
          problem_desc: problemDesc,
          requested_date: requestedDate,
          support_type: supportType,
        }),
      })

      if (res.ok) {
        toast.success('Request Submitted', 'Your service request has been submitted successfully. You will receive a confirmation email shortly.')
        // Reset form
        setSelectedLocation('')
        setProblemDesc('')
        setRequestedDate('')
        setSupportType('onsite')
        // Refresh quota
        checkQuota()
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to submit request' }))
        const errorMessage = errorData.errors
          ? errorData.errors.map((err: any) => `• ${err.message}`).join('\n')
          : errorData.message || 'Failed to submit request'
        toast.error('Submission Error', errorMessage, 8000)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error', 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <main className="container" style={{ paddingTop: '40px', paddingBottom: '60px', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user || role !== 'customer') {
    return null // Will redirect
  }

  return (
    <main className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
          Service Request
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Submit a technical support request for your site.
        </p>
      </div>

      {/* Quota Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            Your Quota
          </h3>
          <button
            onClick={checkQuota}
            disabled={checkingQuota}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0077C8',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {checkingQuota ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {quota ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#475569' }}>
                Available: <strong style={{ color: '#0F172A' }}>{quota.availableHours}h</strong> of {quota.totalHours}h
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: quota.availableHours > 0 ? '#16A34A' : '#DC2626' }}>
                {Math.round((quota.availableHours / quota.totalHours) * 100)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#E2E8F0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(quota.availableHours / quota.totalHours) * 100}%`,
                height: '100%',
                background: quota.availableHours > 0 ? 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)' : '#DC2626',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            {quota.availableHours < 5 && quota.availableHours > 0 && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#92400E' }}>
                Running low on hours. Request only what you need.
              </p>
            )}
            {quota.availableHours <= 0 && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#DC2626' }}>
                You have no available quota. Please contact support.
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            {checkingQuota ? 'Loading quota...' : 'Unable to load quota'}
          </p>
        )}
      </div>

      {/* Request Form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '24px' }}>
        {/* User Info (Read-only) */}
        <div style={{ marginBottom: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '8px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Name
            </label>
            <p style={{ margin: 0, fontSize: '14px', color: '#0F172A' }}>
              {userName || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Not set'}
            </p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Email
            </label>
            <p style={{ margin: 0, fontSize: '14px', color: '#0F172A' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Support Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>
            Support Type
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setSupportType('onsite')
                setSelectedLocation('')
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: supportType === 'onsite' ? '2px solid #0077C8' : '1px solid #E2E8F0',
                background: supportType === 'onsite' ? '#EAF3FB' : '#FFFFFF',
                color: supportType === 'onsite' ? '#0077C8' : '#64748B',
                fontWeight: supportType === 'onsite' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              On-site Visit
            </button>
            <button
              type="button"
              onClick={() => {
                setSupportType('remote')
                // Set default location for Remote Support
                setSelectedLocation('Boccard Indonesia - Automation')
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: supportType === 'remote' ? '2px solid #0077C8' : '1px solid #E2E8F0',
                background: supportType === 'remote' ? '#EAF3FB' : '#FFFFFF',
                color: supportType === 'remote' ? '#0077C8' : '#64748B',
                fontWeight: supportType === 'remote' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Remote Support
            </button>
          </div>
        </div>

        {/* Location Selection */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
              {supportType === 'remote' ? 'Department / Area' : 'Site Location'}
            </label>
            {supportType !== 'remote' && (
              <Link
                href="/customer/locations"
                style={{ fontSize: '12px', color: '#0077C8', textDecoration: 'none' }}
              >
                Manage Locations →
              </Link>
            )}
          </div>
          {supportType === 'remote' ? (
            // Remote Support - Fixed Department/Area
            <input
              type="text"
              value="Boccard Indonesia - Automation"
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '14px',
                background: '#F1F5F9',
                color: '#64748B',
                cursor: 'not-allowed',
              }}
            />
          ) : locations.length > 0 ? (
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '14px',
                background: '#FFFFFF',
              }}
            >
              <option value="">Select a location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.location_name}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          ) : (
            <div style={{
              padding: '16px',
              background: '#FEF3C7',
              borderRadius: '6px',
              border: '1px solid #FDE68A',
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400E' }}>
                No locations configured
              </p>
              <Link
                href="/customer/locations"
                style={{
                  display: 'inline-block',
                  background: '#0077C8',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Add Your First Location
              </Link>
            </div>
          )}
        </div>

        {/* Problem Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Problem Description
          </label>
          <textarea
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            placeholder="Describe the technical issue you need assistance with"
            rows={4}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Requested Date */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Preferred Date
          </label>
          <input
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || locations.length === 0 || !quota || quota.availableHours <= 0}
          style={{
            width: '100%',
            padding: '12px',
            background: loading || locations.length === 0 || !quota || quota.availableHours <= 0 ? '#94A3B8' : '#0077C8',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading || locations.length === 0 || !quota || quota.availableHours <= 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </main>
  )
}
