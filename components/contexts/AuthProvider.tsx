'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  role: string | null
  name: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Maximum time to wait for auth initialization (prevents infinite loading)
const AUTH_TIMEOUT = 8000 // 8 seconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Add timeout to profile fetch to prevent hanging
      const fetchPromise = supabase
        .from('profiles')
        .select('role, name')
        .eq('id', userId)

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data: profile } = await Promise.race([fetchPromise, timeoutPromise])
      setRole(profile?.role ?? null)
      setName(profile?.name ?? null)
    } catch (error) {
      console.warn('Failed to fetch profile:', error)
      setRole(null)
      setName(null)
    }
  }, [])

  const clearAuthState = useCallback(() => {
    setUser(null)
    setRole(null)
    setName(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      if (data.session) {
        setUser(data.session.user)
        await fetchProfile(data.session.user.id)
      } else {
        clearAuthState()
      }
    } catch (error) {
      console.warn('Failed to refresh user:', error)
      clearAuthState()
    }
  }, [fetchProfile, clearAuthState])

  const signOut = useCallback(async () => {
    try {
      // Clear local state first for immediate UI feedback
      clearAuthState()

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any app-specific localStorage items (but not all, to preserve preferences)
        localStorage.removeItem('supabase.auth.token')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if signOut fails, keep local state cleared
      clearAuthState()
    }
  }, [clearAuthState])

  useEffect(() => {
    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (!initialized) {
        console.warn('Auth initialization timed out')
        setLoading(false)
        setInitialized(true)
        clearAuthState()
      }
    }, AUTH_TIMEOUT)

    // Initial session check
    refreshUser()
      .then(() => {
        setInitialized(true)
        setLoading(false)
      })
      .catch((error) => {
        console.warn('Auth initialization error:', error)
        setInitialized(true)
        setLoading(false)
        clearAuthState()
      })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event)

        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          clearAuthState()
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setUser(session.user)
        } else if (event === 'USER_UPDATED' && session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [fetchProfile, clearAuthState, refreshUser, initialized])

  return (
    <AuthContext.Provider value={{ user, role, name, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
