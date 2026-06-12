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

  const { data: player } = await supabase
    .from('players').select('*').eq('slug', params.slug).single()

  if (!player) notFound()
  const p = player as NonNullable<typeof player>

  const nats = [p.nationality_1, p.nationality_2, p.nationality_3,
    p.nationality_4, p.nationality_5]

  if (!canEditPlayer(user, nats)) {
    redirect('/admin/players')
  }

  // Load territories for dropdowns
  const { data: territories } = await supabase
    .from('territories').select('name, confederation, is_fifa_member').order('name')

  return (
    <div className="max-w-2xl">
      <Link href="/admin/players" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 mb-5 transition-colors">
        <ChevronLeft size={13} /> Back to players
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-0.5">{p.name}</h1>
        <p className="text-white/30 text-sm">{p.current_club} · {p.position}</p>
      </div>
      <PlayerEditForm
        player={p as Player}
        territories={territories?.map(t => t.name) ?? []}
        userRole={user.role}
      />
    </div>
  )
}
