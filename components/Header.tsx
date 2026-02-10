'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, role: userRole, name: userName, loading } = useAuth()
  const pathname = usePathname()

  // Prevent hydration mismatch - only render auth-dependent UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't show header on login page
  if (pathname === '/login') {
    return null
  }

  // Build nav links based on auth state
  // Don't show "Sign In" while loading to prevent flash of wrong state
  const navLinks = []
  if (user && userRole === 'admin') {
    navLinks.push(
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/approvals', label: 'Approvals' },
      { href: '/admin/visits', label: 'Visits' },
      { href: '/admin/history', label: 'History' },
      { href: '/admin/quotas', label: 'Quotas' },
      { href: '/admin/issues', label: 'Issues' }
    )
  } else if (user && userRole === 'approver') {
    navLinks.push(
      { href: '/admin/approvals', label: 'Approvals' },
      { href: '/admin/visits', label: 'Visits' },
      { href: '/admin/history', label: 'History' }
    )
  } else if (user && userRole === 'customer') {
    navLinks.push(
      { href: '/customer/request', label: 'Service Request' },
      { href: '/track-request', label: 'Track Request' },
      { href: '/customer/locations', label: 'My Locations' }
    )
  } else if (!loading && !user) {
    // Only show Sign In when we're sure user is not logged in
    navLinks.push(
      { href: '/login', label: 'Sign In' }
    )
  }

  // Helper to check if a link is active
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href || pathname === '/admin'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }
  // While loading, show no nav links (or could show a loading placeholder)

  return (
    <>
      {/* Keyframes for loading animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <header
        style={{
          background: '#0077C8',
          borderBottom: '1px solid #005FA3',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Image
            src="/assets/logo-boccard.png"
            alt="Boccard Logo"
            width={36}
            height={36}
            priority
            style={{
              borderRadius: '6px',
              background: '#FFFFFF',
              padding: '2px',
            }}
          />
          <span
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.3px',
            }}
          >
            <span className="site-title-full">Boccard Technical Support</span>
            <span className="site-title-short">Boccard Tech</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 500,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                }}
              >
                {link.label}
              </Link>
            )
          })}

          <div style={{ marginLeft: '8px', minWidth: '44px' }}>
            {loading || !mounted ? (
              // Loading placeholder - prevents layout shift
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ) : (
              <UserMenu user={user} role={userRole || undefined} name={userName || undefined} />
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav"
          style={{
            display: 'none',
            background: '#005FA3',
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: active ? 600 : 500,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {link.label}
                {active && <span style={{ fontSize: '12px' }}>●</span>}
              </Link>
            )
          })}
          <div style={{ padding: '12px 0' }}>
            {!loading && mounted && (
              <UserMenu user={user} role={userRole || undefined} name={userName || undefined} />
            )}
          </div>
        </div>
      )}
    </header>
    </>
  )
}
