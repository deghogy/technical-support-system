'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function UserMenu({ user, role }: { user?: any; role?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) {
    return (
      <a href="/login" style={{
        color: 'var(--accent)',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '600',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid rgba(30, 144, 255, 0.3)',
      }}>
        Login
      </a>
    )
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--muted)',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          background: 'var(--accent)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '12px',
          fontWeight: '700',
        }}>
          {user.email?.[0].toUpperCase()}
        </div>
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email?.split('@')[0]}
        </span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: 0,
          background: 'var(--card)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          minWidth: '200px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Signed in as</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              {user.email}
            </p>
            {role && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--accent)' }}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              padding: '12px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {loading ? 'Logging out...' : '🚪 Logout'}
          </button>
        </div>
      )}
    </div>
  )
}
