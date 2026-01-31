'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useToast, ToastContainer } from '@/components/Toast'
import { useAuth } from '@/components/contexts/AuthProvider'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toasts, toast, removeToast } = useToast()
  const { user: signedInUser, role: signedInRole, signOut } = useAuth()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      toast.error('Login Failed', error.message)
      return
    }

    toast.success('Welcome Back!', 'Successfully signed in')

    // After sign-in, fetch session and role and redirect accordingly
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.replace('/')
      return
    }

    const user = session.user
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // admins and approvers go to the approvals area
    if (profile?.role === 'admin' || profile?.role === 'approver') {
      router.push('/admin/approvals')
    } else {
      router.push('/')
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="login-branding-content">
            <Image
              src="/assets/logo-boccard.png"
              alt="Boccard Logo"
              width={80}
              height={80}
              priority
              className="login-logo"
            />
            <h2 className="login-branding-title">Welcome Back!</h2>
            <p className="login-branding-subtitle">
              Technical Support Management System
            </p>
            <div className="login-features">
              <div className="login-feature">
                <span className="login-feature-icon">🚀</span>
                <span>Fast service requests</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">📊</span>
                <span>Real-time tracking</span>
              </div>
              <div className="login-feature">
                <span className="login-feature-icon">🔧</span>
                <span>Expert technicians</span>
              </div>
            </div>
          </div>
          <div className="login-waves">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-section">
          <Link href="/" className="login-back-link">
            ← Back to Home
          </Link>

          <div className="login-form-wrapper">
            {signedInUser ? (
              <div className="login-card login-already-signed-in">
                <div className="login-success-icon">✓</div>
                <h3>You&apos;re already signed in!</h3>
                <p className="login-user-info">
                  Signed in as <strong>{signedInUser}</strong>
                  {signedInRole && (
                    <span className="login-role-badge">{signedInRole}</span>
                  )}
                </p>
                <div className="login-action-buttons">
                  <Link
                    href={signedInRole === 'admin' || signedInRole === 'approver' ? '/admin/approvals' : '/'}
                    className="button button-primary"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="button button-secondary"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="login-card">
                <div className="login-header">
                  <h1>Sign In</h1>
                  <p>Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                  <div className="login-input-group">
                    <label htmlFor="email">Email</label>
                    <div className="login-input-wrapper">
                      <span className="login-input-icon">📧</span>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="login-input-group">
                    <label htmlFor="password">Password</label>
                    <div className="login-input-wrapper">
                      <span className="login-input-icon">🔒</span>
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="login-submit-button"
                  >
                    {loading ? (
                      <>
                        <span className="login-spinner"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="login-help">
                  <p>Need help? <Link href="/">Contact support</Link></p>
                </div>
              </div>
            )}
          </div>

          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </div>
    </main>
  )
}
