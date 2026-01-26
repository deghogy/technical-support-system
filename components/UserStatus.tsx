'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function UserStatus() {
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (!data.session) return
      const user = data.session.user
      setEmail(user.email ?? null)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setRole(profile?.role ?? null)
    }

    loadSession()

    return () => { mounted = false }
  }, [])

  return (
    <div className="user-status">
      {email ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <small style={{ opacity: 0.9 }}>{email}</small>
          {(role === 'admin' || role === 'approver') && (
            <>
              <Link href="/admin/approvals" className="nav-button">Approvals</Link>
              <Link href="/admin/dashboard" className="nav-button">Dashboard</Link>
            </>
          )}
          {role === 'approver' && (
            <Link href="/admin/history" className="nav-button">History</Link>
          )}
        </div>
      ) : (
        <Link href="/login" className="nav-button muted">Login</Link>
      )}
    </div>
  )
}
