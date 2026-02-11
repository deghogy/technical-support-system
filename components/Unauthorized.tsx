'use client'

import Link from 'next/link'
import { useAuth } from './contexts/AuthProvider'

interface UnauthorizedProps {
  children: React.ReactNode
}

export default function Unauthorized({ children }: UnauthorizedProps) {
  const { user, role, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '800px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#64748B', margin: 0 }}>Loading...</p>
        </div>
      </main>
    )
  }

  if (!user || (role !== 'admin' && role !== 'approver')) {
    return (
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '800px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
            Unauthorized Access
          </h1>
          <p style={{ color: '#64748B', margin: '0 0 24px 0' }}>
            You must be signed in as an administrator to view this page.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/login"
              style={{
                background: '#0077C8',
                color: '#FFFFFF',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/"
              style={{
                background: '#F1F5F9',
                color: '#475569',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
