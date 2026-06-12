import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, canEditPlayer } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Player } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data: rawExisting } = await (supabase as any)
    .from('players').select('*').eq('slug', params.slug).single()

  if (!rawExisting) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const existing = rawExisting as Player

  const nats = [
    existing.nationality_1,
    existing.nationality_2,
    existing.nationality_3,
    existing.nationality_4,
    existing.nationality_5,
  ]

  if (!canEditPlayer(user, nats)) {
    return NextResponse.json({ error: 'You do not have permission to edit this player' }, { status: 403 })
  }

  const body = await request.json()

  const ALLOWED_FIELDS = [
    'name', 'date_of_birth', 'position', 'current_club', 'current_club_country',
    'nationality_1', 'nationality_2', 'nationality_3', 'nationality_4', 'nationality_5',
    'instagram_url', 'facebook_url', 'youtube_url', 'video_urls',
    'transfermarkt_url', 'profile_image_url', 'cutout_image_url',
    'description', 'birth_location', 'height_cm', 'weight_kg', 'status',
  ]

  const SUPER_ONLY = ['is_verified', 'is_active', 'is_self_submitted']

  const allowedKeys = user.role === 'super_admin'
    ? [...ALLOWED_FIELDS, ...SUPER_ONLY]
    : ALLOWED_FIELDS

  const update: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (key in body) update[key] = body[key]
  }

  if (update.current_club_country) {
    const { getConfederation } = await import('@/lib/sportsdb')
    update.current_club_confederation = getConfederation(update.current_club_country as string)
  }

  const { data: rawUpdated, error } = await (supabase as any)
    .from('players')
    .update(update)
    .eq('slug', params.slug)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rawUpdated)
}
