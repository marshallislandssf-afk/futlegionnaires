import { Nav } from '@/components/layout/Nav'
import { MapClient } from '@/components/map/MapClient'
import { getMapStats } from '@/lib/players'

export default async function MapPage() {
  const stats = await getMapStats()

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Global diaspora map</h1>
          <p className="text-white/40 text-sm">
            {stats.total_players.toLocaleString()} dual-heritage players tracked across{' '}
            {stats.confederations.length} confederations
          </p>
        </div>

        <MapClient stats={stats} />
      </main>
    </div>
  )
}
