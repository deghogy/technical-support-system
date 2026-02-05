'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function LogoutPage() {
  const router = useRouter()
  const { signOut, loading } = useAuth()

  useEffect(() => {
    async function doLogout() {
      try {
        // Call server-side logout first
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        // Then client-side signout
        await signOut()

        // Force reload to clear all state
        window.location.href = '/'
      } catch (error) {
        console.error('Logout failed:', error)
        // Even on error, redirect to home
        window.location.href = '/'
      }
    }

    doLogout()
  }, [signOut])

  return (
    <main style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #E2E8F0',
        borderTopColor: '#0077C8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ color: '#64748B', fontSize: '16px' }}>
        Signing out...
      </p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}
