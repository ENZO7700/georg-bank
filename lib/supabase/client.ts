import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client. Returns null when public env is not configured
 * (local CI / demos without Realtime).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !key) {
    return null
  }

  return createBrowserClient(url, key)
}
