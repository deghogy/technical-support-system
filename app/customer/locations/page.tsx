'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast, ToastContainer } from '@/components/Toast'
import { useAuth } from '@/components/contexts/AuthProvider'

interface Location {
  id: string
  location_name: string
  created_at: string
}

const MAX_LOCATIONS = 2

export default function CustomerLocationsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [newLocation, setNewLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
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

  // Fetch locations on mount
  useEffect(() => {
    if (user && role === 'customer') {
      fetchLocations()
    }
  }, [user, role])

  async function fetchLocations() {
    setFetchLoading(true)
    try {
      const res = await fetch('/api/customer/locations')
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
      } else {
        toast.error('Error', 'Failed to load locations')
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
      toast.error('Error', 'Failed to load locations')
    } finally {
      setFetchLoading(false)
    }
  }

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault()

    if (!newLocation.trim()) {
      toast.error('Error', 'Please enter a location name')
      return
    }

    if (locations.length >= MAX_LOCATIONS) {
      toast.error('Limit Reached', `You can only have ${MAX_LOCATIONS} locations`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/customer/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_name: newLocation.trim() }),
      })

      if (res.ok) {
        toast.success('Success', 'Location added successfully')
        setNewLocation('')
        fetchLocations()
      } else {
        const error = await res.json()
        toast.error('Error', error.message || 'Failed to add location')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error', 'Failed to add location')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }

    try {
      const res = await fetch(`/api/customer/locations?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Success', 'Location deleted successfully')
        fetchLocations()
      } else {
        toast.error('Error', 'Failed to delete location')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error', 'Failed to delete location')
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
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/customer/request" style={{ fontSize: '14px', color: '#0077C8', textDecoration: 'none' }}>
          ← Back to Service Request
        </Link>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
          My Locations
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Manage your site locations for service requests. Maximum {MAX_LOCATIONS} locations allowed.
        </p>
      </div>

      {/* Location Counter */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#475569' }}>
          Locations configured:
        </span>
        <span style={{ fontSize: '18px', fontWeight: 700, color: locations.length >= MAX_LOCATIONS ? '#DC2626' : '#16A34A' }}>
          {locations.length} / {MAX_LOCATIONS}
        </span>
      </div>

      {/* Add Location Form */}
      {locations.length < MAX_LOCATIONS && (
        <form onSubmit={handleAddLocation} className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 16px 0' }}>
            Add New Location
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location name (e.g., Factory A, Warehouse B)"
              maxLength={100}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={loading || !newLocation.trim()}
              style={{
                padding: '10px 20px',
                background: loading || !newLocation.trim() ? '#94A3B8' : '#0077C8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading || !newLocation.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Adding...' : 'Add Location'}
            </button>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
            {newLocation.length}/100 characters
          </p>
        </form>
      )}

      {/* Locations List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            Your Locations
          </h3>
        </div>

        {fetchLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#64748B' }}>Loading locations...</p>
          </div>
        ) : locations.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 8px 0' }}>
              No locations yet
            </h4>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              Add your first location above to start submitting service requests.
            </p>
          </div>
        ) : (
          <div>
            {locations.map((location, index) => (
              <div
                key={location.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < locations.length - 1 ? '1px solid #E2E8F0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: '#EAF3FB',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    📍
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>
                      {location.location_name}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                      Added {new Date(location.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLocation(location.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FEF2F2'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: '#EAF3FB',
          borderRadius: '8px',
          borderLeft: '4px solid #0077C8',
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#0077C8' }}>💡 Tip:</strong> These locations will be available when submitting
          service requests. Choose between on-site visits or remote support for each request.
        </p>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </main>
  )
}
