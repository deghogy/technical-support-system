'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
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
const AUTH_TIMEOUT = 20000 // 20 seconds - generous timeout for slow connections
const PROFILE_FETCH_TIMEOUT = 12000 // 12 seconds for profile fetch

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Use ref to track initialization - doesn't trigger re-renders
  const isInitialized = useRef(false)
  const isInitializing = useRef(false)

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    try {
      // Add timeout to profile fetch to prevent hanging
      const fetchPromise = supabase
        .from('profiles')
        .select('role, name')
        .eq('id', userId)
        .maybeSingle()

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT)
      )

      const result = await Promise.race([fetchPromise, timeoutPromise])

      // Handle Supabase error response
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        throw result.error
      }

      // Handle Supabase data response
      const data = result && typeof result === 'object' && 'data' in result ? result.data : null
      setRole(data?.role ?? null)
      setName(data?.name ?? null)
    } catch (error) {
      console.warn('Failed to fetch profile:', error)

      // Retry once if this is the first attempt
      if (retryCount < 1) {
        console.log('Retrying profile fetch...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchProfile(userId, retryCount + 1)
      }

      // After retry, clear role/name
      setRole(null)
      setName(null)
    }
  }, [])

  const clearAuthState = useCallback(() => {
    setUser(null)
    setRole(null)
    setName(null)
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      if (data.session?.user) {
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
      clearAuthState()
      await supabase.auth.signOut()

      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      clearAuthState()
    }
  }, [clearAuthState])

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current || isInitializing.current) {
      return
    }

    isInitializing.current = true
    let timeoutId: NodeJS.Timeout | null = null

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.warn('Auth initialization timed out')
      setLoading(false)
      isInitialized.current = true
      isInitializing.current = false
      clearAuthState()
    }, AUTH_TIMEOUT)

    // Initialize auth
    refreshUser()
      .then(() => {
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
        isInitialized.current = true
        isInitializing.current = false
      })
      .catch((error) => {
        console.warn('Auth initialization error:', error)
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
        isInitialized.current = true
        isInitializing.current = false
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
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [refreshUser, fetchProfile, clearAuthState])

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
