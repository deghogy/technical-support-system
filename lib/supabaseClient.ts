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
    },
    global: {
      // Add fetch with timeout for better connection handling
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
      },
    },
  })
}

// Only create the browser client at runtime in the browser. During build/server-side
// evaluation these env vars may be undefined and we must avoid calling createBrowserClient.
export const supabase = createClient()
