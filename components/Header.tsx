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
      background: '#FFFFFF',
      borderBottom: '1px solid #D0D7E2',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '0 40px',
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
            color: '#0F172A',
            letterSpacing: '0.5px',
          }}>
            Boccard-ID TechSupport
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {user && userRole === 'admin' && (
            <>
              <Link href="/admin/dashboard" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                Dashboard
              </Link>
              <Link href="/admin/approvals" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                Approvals
              </Link>
              <Link href="/admin/visits" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                Visits
              </Link>
              <Link href="/admin/history" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                History
              </Link>
              <Link href="/admin/quotas" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                Quotas
              </Link>
            </>
          )}
          {user && userRole === 'approver' && (
            <>
              <Link href="/admin/approvals" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                Approvals
              </Link>
              <Link href="/admin/visits" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
                Visits
              </Link>
              <Link href="/admin/history" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0077C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}>
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
