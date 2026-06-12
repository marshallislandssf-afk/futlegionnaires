'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WorldMap } from './WorldMap'
import type { MapStats, Confederation } from '@/types'

const CONF_META: Record<Confederation, { label: string }> = {
  UEFA:     { label: 'UEFA — Europe' },
  CAF:      { label: 'CAF — Africa' },
  CONMEBOL: { label: 'CONMEBOL — S. America' },
  CONCACAF: { label: 'CONCACAF — N/C America' },
  AFC:      { label: 'AFC — Asia' },
  OFC:      { label: 'OFC — Oceania' },
}

export function MapClient({ stats }: { stats: MapStats }) {
  const [selectedConf, setSelectedConf] = useState<Confederation | null>(null)

  const confMap = Object.fromEntries(
    stats.confederations.map(c => [c.confederation, c])
  )

  const displayStats = selectedConf
    ? stats.confederations.filter(c => c.confederation === selectedConf)
    : stats.confederations

  return (
    <div>
      {/* World map */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
        <WorldMap
          stats={stats}
          selectedConf={selectedConf}
          onSelectConf={setSelectedConf}
        />
      </div>

      {/* Selected confederation detail or summary grid */}
      {selectedConf ? (
        <div className="bg-white/[0.03] border border-[#1D9E75]/20 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">{CONF_META[selectedConf].label}</h2>
            <button
              onClick={() => setSelectedConf(null)}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Clear filter ×
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/[0.04] rounded-lg p-3 text-center">
              <div className="text-2xl font-semibold text-[#1D9E75]">
                {(confMap[selectedConf]?.player_count ?? 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-white/30 mt-0.5">players tracked</div>
            </div>
          </div>
          <Link
            href={`/players?confederation=${selectedConf}`}
            className="text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors"
          >
            Browse {selectedConf} players →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {(Object.keys(CONF_META) as Confederation[]).map(conf => {
            const data = confMap[conf]
            return (
              <button
                key={conf}
                onClick={() => setSelectedConf(conf)}
                className="text-left bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-[#1D9E75]/30 hover:bg-white/[0.05] transition-all"
              >
                <div className="text-xs text-white/40 mb-1">{CONF_META[conf].label}</div>
                <div className="text-2xl font-semibold text-[#1D9E75]">
                  {(data?.player_count ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-white/25 mt-0.5">players</div>
              </button>
            )
          })}
        </div>
      )}

      {/* League and nation stats */}
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
                    <div className="h-full bg-[#1D9E75] rounded-full"
                      style={{ width: `${Math.round(l.player_count / max * 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{l.player_count}</span>
                </div>
              )
            })}
          </div>
          <Link href="/players" className="block mt-4 text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors">
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
                    <div className="h-full bg-amber-500/60 rounded-full"
                      style={{ width: `${Math.round(n.total_count / max * 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{n.total_count}</span>
                </div>
              )
            })}
          </div>
          <Link href="/scout" className="block mt-4 text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors">
            Open scout view →
          </Link>
        </div>
      </div>
    </div>
  )
}
