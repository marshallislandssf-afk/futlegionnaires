'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, FileCheck, Upload, UserPlus, LogOut, Globe } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { AdminUser } from '@/lib/auth'

const NAV = [
  { href: '/admin/dashboard',   label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/admin/players',     label: 'Players',      Icon: Users },
  { href: '/admin/submissions', label: 'Submissions',  Icon: FileCheck },
  { href: '/admin/import',      label: 'Import',       Icon: Upload },
]

const SUPER_ADMIN_NAV = [
  { href: '/admin/team',   label: 'Team',    Icon: UserPlus },
]

export function AdminNav({ user }: { user: AdminUser }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const items = user.role === 'super_admin'
    ? [...NAV, ...SUPER_ADMIN_NAV]
    : NAV

  return (
    <aside className="w-56 shrink-0 border-r border-white/8 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/8">
        <Link href="/" className="text-base font-semibold">
          Fut<span className="text-[#1D9E75]">Legionnaires</span>
        </Link>
        <div className="mt-1 text-[10px] text-white/25 uppercase tracking-wider">
          {user.role === 'super_admin' ? 'Super Admin' : 'Country Manager'}
        </div>
      </div>

      {/* Country scope badge */}
      {user.role === 'country_manager' && user.countries.length > 0 && (
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-[10px] text-white/25 mb-1.5 uppercase tracking-wider">Your countries</p>
          <div className="flex flex-wrap gap-1">
            {user.countries.map(c => (
              <span key={c} className="text-[10px] px-1.5 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75]/80 rounded">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#1D9E75]/12 text-[#1D9E75]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-5 py-4 border-t border-white/8">
        <p className="text-xs text-white/50 truncate mb-1">{user.full_name ?? user.email}</p>
        <p className="text-[11px] text-white/25 truncate mb-3">{user.email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  )
}
