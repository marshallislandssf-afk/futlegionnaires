import { Nav } from '@/components/layout/Nav'
import { getMapStats } from '@/lib/players'
import Link from 'next/link'

export const metadata = {
  title: 'Scout View — FutLegionnaires',
  description: 'Intelligence tools for national federation scouts.',
}

export default async function ScoutPage() {
  const stats = await getMapStats()

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Scout intelligence view</h1>
          <p className="text-white/40 text-sm">
            Identify concentrations of eligible players. Plan scouting missions.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total players tracked', value: stats.total_players.toLocaleString() },
            { label: 'Confederations covered', value: stats.confederations.length },
            { label: 'Nations with eligible players', value: stats.top_nations.length + '+' },
            { label: 'Top leagues covered', value: stats.top_leagues.length + '+' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] rounded-xl p-4 text-center">
              <div className="text-2xl font-semibold text-[#1D9E75] mb-1">{s.value}</div>
              <div className="text-[11px] text-white/30">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Leagues */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium mb-1">Leagues by eligible player count</h2>
            <p className="text-[11px] text-white/30 mb-4">
              High numbers indicate productive scouting destinations
            </p>
            <div className="space-y-3">
              {stats.top_leagues.map((l, i) => {
                const max = stats.top_leagues[0]?.player_count ?? 1
                const pct = Math.round(l.player_count / max * 100)
                return (
                  <div key={l.league}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{l.country}</span>
                      <span className="font-medium">{l.player_count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nations */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium mb-1">Nations with most eligible players</h2>
            <p className="text-[11px] text-white/30 mb-4">
              Players holding this nationality across all nationalities 1–5
            </p>
            <div className="space-y-3">
              {stats.top_nations.map((n, i) => {
                const max = stats.top_nations[0]?.total_count ?? 1
                const pct = Math.round(n.total_count / max * 100)
                return (
                  <div key={n.nationality}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{n.nationality}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">{n.confederation}</span>
                        <span className="font-medium">{n.total_count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Confederation breakdown */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">Players by confederation (club location)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.confederations
              .sort((a, b) => b.player_count - a.player_count)
              .map(c => (
                <Link
                  key={c.confederation}
                  href={`/players?confederation=${c.confederation}`}
                  className="bg-white/[0.03] border border-white/10 rounded-lg p-3 hover:border-[#1D9E75]/30 transition-colors"
                >
                  <div className="text-lg font-semibold text-[#1D9E75]">{c.player_count}</div>
                  <div className="text-xs text-white/40">{c.confederation}</div>
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
