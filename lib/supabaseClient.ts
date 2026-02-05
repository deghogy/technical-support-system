import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Client-side Supabase configuration with improved connection handling
function createClient() {
  if (typeof window === 'undefined' || !supabaseUrl || !supabaseAnonKey) {
    return null as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Reduce token refresh interval to prevent stale sessions
      flowType: 'pkce',
    },
    global: {
      // Add fetch with timeout and keepalive for better connection handling
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        const controller = new AbortController()
        // Reduce timeout to 10s for faster failure detection
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        return fetch(url, {
          ...options,
          signal: controller.signal,
          // Keep connections alive for better performance
          keepalive: true,
        }).finally(() => clearTimeout(timeoutId))
      },
    },
    // Enable realtime for better session sync
    realtime: {
      timeout: 10000,
    },
  })
}

// Only create the browser client at runtime in the browser. During build/server-side
// evaluation these env vars may be undefined and we must avoid calling createBrowserClient.
export const supabase = createClient()
