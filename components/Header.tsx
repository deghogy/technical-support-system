import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import UserMenu from '@/components/UserMenu'

export default async function Header() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : null

  const userRole = profile?.data?.role

  return (
    <header style={{
      background: 'linear-gradient(180deg, rgba(15,23,32,0.95), rgba(11,11,13,0.8))',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image
            src="/assets/logo-boccard.png"
            alt="Boccard-ID Logo"
            width={32}
            height={32}
            priority
            style={{
              borderRadius: '8px',
            }}
          />
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.5px',
          }}>
            Boccard-ID TechSupport
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {user && userRole === 'admin' && (
            <>
              <Link href="/admin/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                Dashboard
              </Link>
              <Link href="/admin/approvals" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                Approvals
              </Link>
              <Link href="/admin/visits" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                Visits
              </Link>
              <Link href="/admin/history" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                History
              </Link>
              <Link href="/admin/quotas" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                Quotas
              </Link>
            </>
          )}
          {user && userRole === 'approver' && (
            <>
              <Link href="/admin/approvals" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                Approvals
              </Link>
              <Link href="/admin/visits" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                Visits
              </Link>
              <Link href="/admin/history" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                History
              </Link>
            </>
          )}

          <UserMenu user={user} role={userRole} />
        </nav>
      </div>
    </header>
  )
}
