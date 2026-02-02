'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function UserMenu({ user, role, name }: { user?: any; role?: string; name?: string }) {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { signOut } = useAuth()

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
    setLoggingOut(true)
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return null
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FFFFFF',
          padding: '6px 14px 6px 6px',
          borderRadius: '50px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0077C8',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {(name || user.email)?.[0].toUpperCase()}
        </div>
        <span
          style={{
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name || user.user_metadata?.name || user.email?.split('@')[0]}
        </span>
        <span style={{
          fontSize: '10px',
          opacity: open ? 1 : 0.8,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'all 0.2s ease',
        }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            right: 0,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            minWidth: '260px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {/* User Info Header */}
          <div
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #0077C8 0%, #005fa3 100%)',
              color: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {(name || user.email)?.[0].toUpperCase()}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {name || user.user_metadata?.name || user.email?.split('@')[0]}
                </p>
                {role && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: 'rgba(255,255,255,0.2)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderRadius: '4px',
                      marginTop: '2px',
                    }}
                  >
                    {role}
                  </span>
                )}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all' }}>
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px' }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#DC2626',
                padding: '10px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEF2F2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '16px' }}>🚪</span>
              {loggingOut ? 'Logging out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
