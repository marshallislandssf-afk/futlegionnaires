import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { Users, FileCheck, Upload, UserPlus } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAdmin()
  const supabase = createServerSupabaseClient()

  // Build scoped player query
  let playerQuery = (supabase as any).from('players').select('id', { count: 'exact', head: true }).eq('is_active', true)
  let submissionQuery = (supabase as any).from('player_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')

  // Country managers only see their scope
  if (user.role === 'country_manager' && user.countries.length > 0) {
    const natFilter = user.countries.map(c =>
      `nationality_1.eq.${c},nationality_2.eq.${c},nationality_3.eq.${c},nationality_4.eq.${c},nationality_5.eq.${c}`
    ).join(',')
    playerQuery = playerQuery.or(natFilter)
    submissionQuery = submissionQuery.or(
      user.countries.map(c => `nationality_1.eq.${c},nationality_2.eq.${c}`).join(',')
    )
  }

  const [{ count: playerCount }, { count: pendingCount }] = await Promise.all([
    playerQuery,
    submissionQuery,
  ])

  const isSuper = user.role === 'super_admin'
  const greeting = user.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Welcome back'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1">{greeting}</h1>
        <p className="text-white/40 text-sm">
          {isSuper
            ? 'Full platform access'
            : `Managing ${user.countries.length} countr${user.countries.length === 1 ? 'y' : 'ies'}: ${user.countries.join(', ')}`
          }
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
          <div className="text-3xl font-semibold text-[#1D9E75] mb-1">{(playerCount ?? 0).toLocaleString()}</div>
          <div className="text-sm text-white/40">{isSuper ? 'Total players' : 'Players in your scope'}</div>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
          <div className="text-3xl font-semibold text-amber-400 mb-1">{pendingCount ?? 0}</div>
          <div className="text-sm text-white/40">Pending submissions</div>
          {(pendingCount ?? 0) > 0 && (
            <Link href="/admin/submissions" className="text-xs text-amber-400/70 hover:text-amber-400 mt-1 block transition-colors">
              Review now →
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-medium text-white/40 mb-3 uppercase tracking-wider text-[11px]">Quick actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { href: '/admin/players',     Icon: Users,      label: 'Browse & edit players',    sub: 'Search, filter, update' },
          { href: '/admin/submissions', Icon: FileCheck,  label: 'Review submissions',       sub: 'Approve or reject public submissions' },
          { href: '/admin/import',      Icon: Upload,     label: 'Import spreadsheet',       sub: 'CSV batch upload' },
          ...(isSuper ? [{ href: '/admin/team', Icon: UserPlus, label: 'Manage team', sub: 'Invite country managers' }] : []),
        ].map(({ href, Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 bg-white/[0.03] border border-white/8 rounded-xl p-4 hover:border-white/15 hover:bg-white/[0.05] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-[#1D9E75]" />
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5">{label}</p>
              <p className="text-xs text-white/30">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
