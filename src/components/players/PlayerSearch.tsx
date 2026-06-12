'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PlayerCard } from './PlayerCard'
import type { Player, Position, Confederation, PlayerSearchResponse } from '@/types'

const POSITIONS: Position[] = [
  'Goalkeeper', 'Centre-Back', 'Right-Back', 'Left-Back',
  'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
  'Right Winger', 'Left Winger', 'Second Striker', 'Centre-Forward',
]

const CONFEDERATIONS: Confederation[] = ['UEFA', 'CAF', 'CONMEBOL', 'CONCACAF', 'AFC', 'OFC']

const NATIONALITIES = [
  'England', 'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium',
  'Morocco', 'Algeria', 'Nigeria', 'Ghana', 'Senegal', 'Egypt', 'Cameroon', 'Mali',
  "Ivory Coast", 'Liberia', 'Equatorial Guinea',
  'Brazil', 'Argentina', 'Colombia', 'Jamaica', 'Canada', 'United States',
  'Japan', 'South Korea', 'Australia',
]

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function PlayerSearch({ initialConf }: { initialConf?: Confederation }) {
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState<Position | ''>('')
  const [confederation, setConfederation] = useState<Confederation | ''>(initialConf ?? '')
  const [nationality, setNationality] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debouncedQuery = useDebounce(query, 350)

  const fetchPlayers = useCallback(async (resetPage = true) => {
    setLoading(true)
    const currentPage = resetPage ? 1 : page
    if (resetPage) setPage(1)

    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (position) params.set('position', position)
    if (confederation) params.set('confederation', confederation)
    if (nationality) params.set('nationality', nationality)
    params.set('page', String(currentPage))
    params.set('page_size', '24')

    try {
      const res = await fetch(`/api/players?${params}`)
      const data: PlayerSearchResponse = await res.json()
      setPlayers(resetPage ? data.players : prev => [...prev, ...data.players])
      setTotal(data.total)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, position, confederation, nationality, page])

  useEffect(() => {
    fetchPlayers(true)
  }, [debouncedQuery, position, confederation, nationality])

  const hasFilters = position || confederation || nationality

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, club or nationality…"
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#1D9E75]/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-lg border transition-colors ${
            hasFilters || filtersOpen
              ? 'border-[#1D9E75]/50 bg-[#1D9E75]/10 text-[#1D9E75]'
              : 'border-white/10 bg-white/[0.05] text-white/50 hover:text-white/80'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-[#1D9E75] text-black text-[10px] font-medium flex items-center justify-center">
              {[position, confederation, nationality].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter row */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white/[0.03] border border-white/10 rounded-lg">
          <select
            value={position}
            onChange={e => setPosition(e.target.value as any)}
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#1D9E75]/50"
          >
            <option value="">All positions</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={confederation}
            onChange={e => setConfederation(e.target.value as any)}
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#1D9E75]/50"
          >
            <option value="">All confederations</option>
            {CONFEDERATIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={nationality}
            onChange={e => setNationality(e.target.value)}
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#1D9E75]/50"
          >
            <option value="">All nationalities</option>
            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setPosition(''); setConfederation(''); setNationality('') }}
              className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-white/30 mb-4">
        {loading ? 'Searching…' : `${total.toLocaleString()} player${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && players.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && players.length < total && (
        <button
          onClick={() => { setPage(p => p + 1); fetchPlayers(false) }}
          className="mt-6 w-full py-2.5 text-sm text-white/50 border border-white/10 rounded-lg hover:bg-white/[0.04] hover:text-white/70 transition-colors"
        >
          Load more ({total - players.length} remaining)
        </button>
      )}

      {/* Empty state */}
      {!loading && players.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No players found matching your search.</p>
          <p className="text-white/20 text-xs mt-1">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  )
}
