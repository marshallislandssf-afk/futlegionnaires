import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not set. Check .env.local')
}

// ─── Browser client (safe to use in Client Components) ───────────────────────
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// ─── Server client (for Route Handlers and Server Components) ────────────────
// Uses service role key when elevated permissions are needed (admin writes)
export function createServerSupabaseClient() {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey,
    {
      auth: { persistSession: false },
    }
  )
}

// ─── Singleton browser client ─────────────────────────────────────────────────
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient() called on the server. Use createServerSupabaseClient() instead.')
  }
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient()
  }
  return browserClient
}
