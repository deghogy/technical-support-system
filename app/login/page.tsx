'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useToast, ToastContainer } from '@/components/Toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toasts, toast, removeToast } = useToast()

  // ✅ Check active session for display (do not auto-redirect)
  const [signedInUser, setSignedInUser] = useState<string | null>(null)
  const [signedInRole, setSignedInRole] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      const user = data.session.user
      setSignedInUser(user.email ?? null)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setSignedInRole(profile?.role ?? null)
    }

    loadSession()
  }, [])

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

    router.refresh()
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto' }}>
      <h1>Login</h1>

      {signedInUser ? (
        <div className="card">
          <p style={{ margin: 0 }}>You're signed in as <b>{signedInUser}</b> (role: {signedInRole ?? 'unknown'})</p>
          <p style={{ marginTop: 8 }}>
            Use the nav to go to your dashboard. If you'd like to sign in as a different user, click Logout and sign in again.
          </p>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="card">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ marginBottom: '16px' }}
          />

          <button disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </main>
  )
}
