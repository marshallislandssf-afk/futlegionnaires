import { Nav } from '@/components/layout/Nav'
import { PlayerSearch } from '@/components/players/PlayerSearch'

export const metadata = {
  title: 'Players — FutLegionnaires',
  description: 'Browse and search dual-heritage football players worldwide.',
}

export default function PlayersPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Player database</h1>
          <p className="text-white/40 text-sm">
            Search and filter dual-heritage players. Click a card for the full profile.
          </p>
        </div>
        <PlayerSearch />
      </main>
    </div>
  )
}
