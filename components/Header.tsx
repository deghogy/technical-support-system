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
            Boccard Technical Support
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {user && userRole === 'admin' && (
            <>
              <Link
                href="/admin/dashboard"
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
                Dashboard
              </Link>
              <Link
                href="/admin/approvals"
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
                Approvals
              </Link>
              <Link
                href="/admin/visits"
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
                Visits
              </Link>
              <Link
                href="/admin/history"
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
                History
              </Link>
              <Link
                href="/admin/quotas"
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
                Quotas
              </Link>
            </>
          )}
          {user && userRole === 'approver' && (
            <>
              <Link
                href="/admin/approvals"
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
                Approvals
              </Link>
              <Link
                href="/admin/visits"
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
                Visits
              </Link>
              <Link
                href="/admin/history"
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
                History
              </Link>
            </>
          )}

          <div style={{ marginLeft: '8px' }}>
            <UserMenu user={user} role={userRole} />
          </div>
        </nav>
      </div>
    </header>
  )
}
