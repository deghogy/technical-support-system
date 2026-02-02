'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, role: userRole, loading } = useAuth()
  const pathname = usePathname()

  // Don't show header on login page
  if (pathname === '/login') {
    return null
  }

  const navLinks = []
  if (user && userRole === 'admin') {
    navLinks.push(
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/approvals', label: 'Approvals' },
      { href: '/admin/visits', label: 'Visits' },
      { href: '/admin/history', label: 'History' },
      { href: '/admin/quotas', label: 'Quotas' }
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
  } else {
    // Guest users (not logged in) - only Sign In
    navLinks.push(
      { href: '/login', label: 'Sign In' }
    )
  }

  return (
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: 'rgba(255,255,255,0.9)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ marginLeft: '8px' }}>
            <UserMenu user={user} role={userRole || undefined} />
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 500,
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ padding: '12px 0' }}>
            <UserMenu user={user} role={userRole || undefined} />
          </div>
        </div>
      )}
    </header>
  )
}
