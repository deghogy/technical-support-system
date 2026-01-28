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
      <a
        href="/login"
        style={{
          color: '#FFFFFF',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          padding: '8px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.4)',
          background: 'transparent',
          transition: 'all 0.15s ease',
        }}
      >
        Login
      </a>
    )
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            background: '#FFFFFF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0077C8',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {user.email?.[0].toUpperCase()}
        </div>
        <span
          style={{
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.email?.split('@')[0]}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.8 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            background: '#FFFFFF',
            border: '1px solid #D0D7E2',
            borderRadius: '8px',
            minWidth: '220px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #EAF3FB',
              background: '#F8FAFC',
            }}
          >
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
              Signed in as
            </p>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0F172A',
                wordBreak: 'break-word',
              }}
            >
              {user.email}
            </p>
            {role && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  padding: '2px 8px',
                  background: '#EAF3FB',
                  color: '#0077C8',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderRadius: '4px',
                }}
              >
                {role}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#EF4444',
              padding: '12px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = '#FEF2F2')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  )
}
