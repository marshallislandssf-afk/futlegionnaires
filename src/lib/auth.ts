/**
 * Auth helpers — server-side only
 * Used in Route Handlers and Server Components.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types'

export type UserRole = 'super_admin' | 'country_manager'

export interface AdminUser {
  id: string
  email: string
  role: UserRole
  full_name?: string
  countries: string[]   // Empty for super_admin (has access to all)
  is_active: boolean
}

// ─── Create an auth-aware Supabase client for server use ──────────────────────
export function createAuthClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set({ name, value, ...options } as any) },
        remove(name: string, options: Record<string, unknown>) { cookieStore.set({ name, value: '', ...options } as any) },
      },
    }
  )
}

// ─── Get the current admin user (or null) ────────────────────────────────────
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createAuthClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('id, email, role, full_name, is_active')
    .eq('id', session.user.id)
    .single()

  if (!profile || !profile.is_active) return null

  const { data: countryRows } = await (supabase as any)
    .from('user_countries')
    .select('country')
    .eq('user_id', session.user.id)

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    full_name: profile.full_name ?? undefined,
    countries: countryRows?.map(r => r.country) ?? [],
    is_active: profile.is_active,
  }
}

// ─── Require auth — redirects to login if not signed in ──────────────────────
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) redirect('/auth/login')
  return user
}

// ─── Require super admin ──────────────────────────────────────────────────────
export async function requireSuperAdmin(): Promise<AdminUser> {
  const user = await requireAdmin()
  if (user.role !== 'super_admin') redirect('/admin/dashboard')
  return user
}

// ─── Check if a user can edit a player (based on nationality overlap) ─────────
export function canEditPlayer(
  user: AdminUser,
  playerNationalities: (string | null | undefined)[]
): boolean {
  if (user.role === 'super_admin') return true
  const nats = playerNationalities.filter(Boolean) as string[]
  return nats.some(n => user.countries.includes(n))
}

// ─── Filter a query to only show players this manager can see ─────────────────
// Returns the set of nationality values to filter by, or null for super_admin
export function getCountryFilter(user: AdminUser): string[] | null {
  if (user.role === 'super_admin') return null
  return user.countries
}
