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

// Shorter timeouts - fail fast for better UX
const AUTH_TIMEOUT = 10000 // 10 seconds max for auth
const PROFILE_FETCH_TIMEOUT = 5000 // 5 seconds for profile fetch

// Cache keys
const PROFILE_CACHE_KEY = 'auth_profile_cache'
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface ProfileCache {
  role: string | null
  name: string | null
  timestamp: number
  userId: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Use ref to track initialization - doesn't trigger re-renders
  const isInitialized = useRef(false)
  const isInitializing = useRef(false)
  const profileFetchInProgress = useRef(false)

  // Get cached profile from localStorage
  const getCachedProfile = useCallback((userId: string): ProfileCache | null => {
    if (typeof window === 'undefined') return null
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY)
      if (!cached) return null
      const parsed: ProfileCache = JSON.parse(cached)
      // Check if cache is valid (not expired and same user)
      if (parsed.userId === userId && Date.now() - parsed.timestamp < PROFILE_CACHE_TTL) {
        return parsed
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Save profile to cache
  const setCachedProfile = useCallback((userId: string, role: string | null, name: string | null) => {
    if (typeof window === 'undefined') return
    try {
      const cache: ProfileCache = { role, name, timestamp: Date.now(), userId }
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Clear profile cache
  const clearProfileCache = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Fetch profile with timeout and caching
  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    // Prevent multiple simultaneous fetches
    if (profileFetchInProgress.current) return
    profileFetchInProgress.current = true

    try {
      // Check cache first
      const cached = getCachedProfile(userId)
      if (cached) {
        setRole(cached.role)
        setName(cached.name)
        // Still fetch fresh data in background, but don't block
        profileFetchInProgress.current = false
        // Background refresh (don't await)
        fetchProfileFresh(userId)
        return
      }

      await fetchProfileFresh(userId, retryCount)
    } finally {
      profileFetchInProgress.current = false
    }
  }, [getCachedProfile])

  // Fresh profile fetch from server
  const fetchProfileFresh = async (userId: string, retryCount = 0): Promise<void> => {
    try {
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
      const newRole = data?.role ?? null
      const newName = data?.name ?? null

      setRole(newRole)
      setName(newName)
      setCachedProfile(userId, newRole, newName)
    } catch (error) {
      console.warn('Failed to fetch profile:', error)

      // Retry once if this is the first attempt
      if (retryCount < 1) {
        console.log('Retrying profile fetch...')
        await new Promise(resolve => setTimeout(resolve, 500))
        return fetchProfileFresh(userId, retryCount + 1)
      }

      // After retry, use cache if available (stale), otherwise clear
      const staleCache = getCachedProfile(userId)
      if (staleCache) {
        console.log('Using stale profile cache')
        setRole(staleCache.role)
        setName(staleCache.name)
      } else {
        setRole(null)
        setName(null)
      }
    }
  }

  const clearAuthState = useCallback(() => {
    setUser(null)
    setRole(null)
    setName(null)
    clearProfileCache()
  }, [clearProfileCache])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      if (data.session?.user) {
        setUser(data.session.user)
        // Don't block on profile fetch - let it happen in background
        fetchProfile(data.session.user.id).catch(console.warn)
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
        localStorage.removeItem(PROFILE_CACHE_KEY)
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
      // Don't clear auth state on timeout - user might still be valid
    }, AUTH_TIMEOUT)

    // Initialize auth
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        if (data.session?.user) {
          setUser(data.session.user)

          // Check for cached profile immediately
          const cached = getCachedProfile(data.session.user.id)
          if (cached) {
            setRole(cached.role)
            setName(cached.name)
          }

          // Fetch fresh profile in background (don't block)
          fetchProfile(data.session.user.id).catch(console.warn)
        } else {
          clearAuthState()
        }
      } catch (error) {
        console.warn('Auth initialization error:', error)
        clearAuthState()
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
        isInitialized.current = true
        isInitializing.current = false
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event)

        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          // Clear any stale cache for new sign in
          clearProfileCache()
          fetchProfile(session.user.id).catch(console.warn)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          clearAuthState()
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setUser(session.user)
        } else if (event === 'USER_UPDATED' && session) {
          setUser(session.user)
          // Clear cache to get fresh data
          clearProfileCache()
          fetchProfile(session.user.id).catch(console.warn)
        } else if (event === 'INITIAL_SESSION' && session) {
          setUser(session.user)
          // Don't block on profile fetch
          fetchProfile(session.user.id).catch(console.warn)
        }
      }
    )

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [fetchProfile, clearAuthState, getCachedProfile, clearProfileCache])

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
