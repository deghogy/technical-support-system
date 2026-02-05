import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Route handler Supabase client with improved connection handling
export async function createSupabaseRouteClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        // Add timeout for API route fetch requests
        fetch: (url: RequestInfo | URL, options?: RequestInit) => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for API routes

          return fetch(url, {
            ...options,
            signal: controller.signal,
            keepalive: true,
          }).finally(() => clearTimeout(timeoutId))
        },
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Ignore errors in route handlers
          }
        },
      },
    }
  )
}
