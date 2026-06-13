import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Browser client ───────────────────────────────────────────
// Singleton — one instance per browser context, avoids the
// "Multiple GoTrueClient instances" warning
let _browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserSupabaseClient() {
  if (typeof window === 'undefined') return createClient(supabaseUrl, supabaseAnonKey)
  if (!_browserClient) {
    _browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return _browserClient
}

export function getSupabaseClient() {
  return createBrowserSupabaseClient()
}

// ─── Server client ────────────────────────────────────────────
export function createServerSupabaseClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
