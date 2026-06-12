import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { CheckCircle, ExternalLink } from 'lucide-react'
import type { Player } from '@/types'

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const user = await requireAdmin()
  const supabase = createServerSupabaseClient()
  const page = Number(searchParams.page ?? 1)
  const PAGE_SIZE = 30
  const q = searchParams.q?.trim() ?? ''

  let query = supabase
    .from('players')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (user.role === 'country_manager' && user.countries.length > 0) {
    query = query.or(
      user.countries.flatMap(c => [
        `nationality_1.eq.${c}`, `nationality_2.eq.${c}`,
        `nationality_3.eq.${c}`, `nationality_4.eq.${c}`, `nationality_5.eq.${c}`,
      ]).join(',')
    )
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,current_club.ilike.%${q}%`)
  }

  const { data: rawPlayers, count } = await query
  const players = (rawPlayers ?? []) as unknown as Player[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-0.5">Players</h1>
          <p className="text-white/30 text-sm">{total.toLocaleString()} in your scope</p>
        </div>
      </div>

      <form className="mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or club…"
          className="w-full max-w-sm bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#1D9E75]/50"
        />
      </form>

      <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-white/30 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Player</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Club</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Position</th>
              <th className="text-left px-4 py-3 font-medium">Nationalities</th>
              <th className="px-4 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => {
              const nats = [player.nationality_1, player.nationality_2, player.nationality_3,
                player.nationality_4, player.nationality_5].filter(Boolean)
              return (
                <tr key={player.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.name}</span>
                      {player.is_verified && <CheckCircle size={12} className="text-[#1D9E75]" />}
                    </div>
                    <span className="text-xs text-white/30">{player.age ? `Age ${player.age}` : ''}</span>
                  </td>
                  <td className="px-4 py-3 text-white/50 hidden md:table-cell">{player.current_club}</td>
                  <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">{player.position}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {nats.map((n, i) => (
                        <span key={String(n)} className={`text-[10px] px-1.5 py-0.5 rounded ${
                          i === 0 ? 'bg-[#1D9E75]/15 text-[#1D9E75]/80' : 'bg-white/5 text-white/30'
                        }`}>{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/players/${player.slug}`}
                      className="text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors inline-flex items-center gap-1"
                    >
                      Edit <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {players.length === 0 && (
          <div className="text-center py-12 text-white/25 text-sm">No players found.</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-white/30">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition-colors">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition-colors">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
