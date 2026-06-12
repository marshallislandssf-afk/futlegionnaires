import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/players'
import { getConfederation } from '@/lib/sportsdb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { action, reviewer_notes } = await request.json()
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Fetch the submission
  const { data: sub } = await supabase
    .from('player_submissions').select('*').eq('id', params.id).single()

  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (sub.status !== 'pending') {
    return NextResponse.json({ error: 'Submission already reviewed' }, { status: 409 })
  }

  if (action === 'reject') {
    await supabase.from('player_submissions').update({
      status: 'rejected',
      reviewer_notes: reviewer_notes ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', params.id)

    return NextResponse.json({ success: true, action: 'rejected' })
  }

  // ── Approve: create the player record ────────────────────────
  const slug = generateSlug(sub.name)
  const clubCountry = sub.current_club_country ?? ''

  const playerData = {
    slug,
    name: sub.name,
    date_of_birth: sub.date_of_birth ?? null,
    position: sub.position ?? 'Centre-Forward',
    current_club: sub.current_club ?? '',
    current_club_country: clubCountry,
    current_club_confederation: getConfederation(clubCountry),
    nationality_1: sub.nationality_1,
    nationality_2: sub.nationality_2 ?? null,
    nationality_3: sub.nationality_3 ?? null,
    nationality_4: sub.nationality_4 ?? null,
    nationality_5: sub.nationality_5 ?? null,
    instagram_url: sub.instagram_url ?? null,
    transfermarkt_url: sub.transfermarkt_url ?? null,
    video_urls: sub.video_urls ?? null,
    description: sub.description ?? null,
    is_verified: false,
    is_self_submitted: true,
    is_active: true,
    status: 'Active',
  }

  const { data: newPlayer, error: playerError } = await supabase
    .from('players')
    .upsert(playerData, { onConflict: 'slug' })
    .select('id')
    .single()

  if (playerError) {
    return NextResponse.json({ error: playerError.message }, { status: 500 })
  }

  // Mark submission as approved and link to the new player
  await supabase.from('player_submissions').update({
    status: 'approved',
    reviewer_notes: reviewer_notes ?? null,
    reviewed_at: new Date().toISOString(),
    player_id: newPlayer.id,
  }).eq('id', params.id)

  return NextResponse.json({ success: true, action: 'approved', player_id: newPlayer.id })
}
