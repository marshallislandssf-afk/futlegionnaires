import { requireAdmin, canEditPlayer } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { PlayerEditForm } from '@/components/admin/PlayerEditForm'
import type { Player } from '@/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function AdminPlayerEditPage({ params }: { params: { slug: string } }) {
  const user = await requireAdmin()
  const supabase = createServerSupabaseClient()

  const { data: rawPlayer } = await supabase
    .from('players').select('*').eq('slug', params.slug).single()

  if (!rawPlayer) notFound()

  // Cast to Player — Supabase's generated type for this table isn't wired up yet
  // so we cast explicitly. All fields are defined in src/types/index.ts.
  const player = rawPlayer as unknown as Player

  const nats = [
    player.nationality_1,
    player.nationality_2,
    player.nationality_3,
    player.nationality_4,
    player.nationality_5,
  ]

  if (!canEditPlayer(user, nats)) {
    redirect('/admin/players')
  }

  const { data: territories } = await supabase
    .from('territories').select('name, confederation, is_fifa_member').order('name')

  return (
    <div className="max-w-2xl">
      <Link href="/admin/players" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 mb-5 transition-colors">
        <ChevronLeft size={13} /> Back to players
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-0.5">{player.name}</h1>
        <p className="text-white/30 text-sm">{player.current_club} · {player.position}</p>
      </div>
      <PlayerEditForm
        player={player}
        territories={territories?.map(t => t.name) ?? []}
        userRole={user.role}
      />
    </div>
  )
}
