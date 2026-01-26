import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create the browser client at runtime in the browser. During build/server-side
// evaluation these env vars may be undefined and we must avoid calling createBrowserClient.
export const supabase = (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey)
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : (null as any)
