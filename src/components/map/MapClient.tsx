'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MapStats, Confederation } from '@/types'

const CONF_META: Record<Confederation, { label: string; emoji: string; color: string }> = {
  UEFA:     { label: 'UEFA — Europe',           emoji: '🇪🇺', color: 'border-blue-500/30 hover:border-blue-400/50' },
  CAF:      { label: 'CAF — Africa',             emoji: '🌍', color: 'border-amber-500/30 hover:border-amber-400/50' },
  CONMEBOL: { label: 'CONMEBOL — S. America',    emoji: '🌎', color: 'border-green-500/30 hover:border-green-400/50' },
  CONCACAF: { label: 'CONCACAF — N/C America',   emoji: '🌎', color: 'border-purple-500/30 hover:border-purple-400/50' },
  AFC:      { label: 'AFC — Asia',               emoji: '🌏', color: 'border-red-500/30 hover:border-red-400/50' },
  OFC:      { label: 'OFC — Oceania',            emoji: '🌏', color: 'border-teal-500/30 hover:border-teal-400/50' },
}

export function MapClient({ stats }: { stats: MapStats }) {
  const [selected, setSelected] = useState<Confederation | null>(null)

  const confMap = Object.fromEntries(
    stats.confederations.map(c => [c.confederation, c])
  )

  return (
    <div>
      {/* Confederation cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {(Object.keys(CONF_META) as Confederation[]).map(conf => {
          const meta = CONF_META[conf]
          const data = confMap[conf]
          const isSelected = selected === conf

          return (
            <button
              key={conf}
              onClick={() => setSelected(isSelected ? null : conf)}
              className={`
                text-left bg-white/[0.03] border rounded-xl p-4 transition-all
                ${isSelected
                  ? 'border-[#1D9E75]/60 bg-[#1D9E75]/5'
                  : `${meta.color} border-white/10`
                }
              `}
            >
              <div className="text-xl mb-2">{meta.emoji}</div>
              <div className="text-xs text-white/40 mb-1">{meta.label}</div>
              <div className="text-2xl font-semibold text-[#1D9E75]">
                {(data?.player_count ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/30 mt-0.5">players tracked</div>
            </button>
          )
        })}
      </div>

      {/* Map placeholder — wire up D3 choropleth here */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-8 min-h-64 flex flex-col items-center justify-center gap-3">
        <p className="text-white/30 text-sm">
          D3 choropleth world map — loads here in production
        </p>
        <p className="text-white/20 text-xs text-center max-w-md">
          Wire up <code className="text-[#1D9E75]/70">d3-geo</code> +{' '}
          <code className="text-[#1D9E75]/70">topojson-client</code> with the Natural Earth dataset.
          The <code className="text-[#1D9E75]/70">/api/map-stats</code> endpoint provides confederation counts and top-league dot data.
        </p>
      </div>

      {/* League concentration */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">Top leagues by player count</h2>
          <div className="space-y-2.5">
            {stats.top_leagues.slice(0, 8).map((l, i) => {
              const max = stats.top_leagues[0]?.player_count ?? 1
              return (
                <div key={l.league} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/30 w-4 text-right">{i + 1}</span>
                  <span className="text-xs text-white/60 w-28 shrink-0 truncate">{l.country}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D9E75] rounded-full"
                      style={{ width: `${Math.round(l.player_count / max * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{l.player_count}</span>
                </div>
              )
            })}
          </div>
          <Link
            href="/players"
            className="block mt-4 text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors"
          >
            Browse all players →
          </Link>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">Nations with most eligible players</h2>
          <div className="space-y-2.5">
            {stats.top_nations.slice(0, 8).map((n, i) => {
              const max = stats.top_nations[0]?.total_count ?? 1
              return (
                <div key={n.nationality} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/30 w-4 text-right">{i + 1}</span>
                  <span className="text-xs text-white/60 w-28 shrink-0 truncate">{n.nationality}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500/70 rounded-full"
                      style={{ width: `${Math.round(n.total_count / max * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{n.total_count}</span>
                </div>
              )
            })}
          </div>
          <Link
            href="/scout"
            className="block mt-4 text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors"
          >
            Open scout view →
          </Link>
        </div>
      </div>
    </div>
  )
}
