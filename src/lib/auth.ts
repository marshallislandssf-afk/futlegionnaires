import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type UserRole = 'super_admin' | 'country_manager'

export interface AdminUser {
  id: string
  email: string
  role: UserRole
  full_name?: string
  countries: string[]
  is_active: boolean
}

// Server-side client that reads the session from cookies
export function createAuthClient() {
  // Use service role so we can read user_profiles regardless of RLS
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Get session from the auth cookie Supabase sets
async function getSessionFromCookies() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''
  
  // Supabase stores the session in a cookie named sb-{projectRef}-auth-token
  const cookieName = `sb-${projectRef}-auth-token`
  const rawCookie = cookieStore.get(cookieName)?.value
  
  if (!rawCookie) return null
  
  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie))
    // Cookie can be an array [accessToken, refreshToken] or an object
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token
    return accessToken ?? null
  } catch {
    return null
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createAuthClient()
  
  const token = await getSessionFromCookies()
  if (!token) return null

  // Verify the token and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('id, email, role, full_name, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return null

  const { data: countryRows } = await (supabase as any)
    .from('user_countries')
    .select('country')
    .eq('user_id', user.id)

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    full_name: profile.full_name ?? undefined,
    countries: (countryRows ?? []).map((r: { country: string }) => r.country),
    is_active: profile.is_active,
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) redirect('/auth/login')
  return user
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const user = await requireAdmin()
  if (user.role !== 'super_admin') redirect('/admin/dashboard')
  return user
}

export function canEditPlayer(user: AdminUser, playerNationalities: (string | null | undefined)[]): boolean {
  if (user.role === 'super_admin') return true
  const nats = playerNationalities.filter(Boolean) as string[]
  return nats.some(n => user.countries.includes(n))
}

export function getCountryFilter(user: AdminUser): string[] | null {
  if (user.role === 'super_admin') return null
  return user.countries
}
