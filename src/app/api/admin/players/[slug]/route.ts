import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, canEditPlayer } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data: existing } = await supabase
    .from('players').select('*').eq('slug', params.slug).single()

  if (!existing) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const nats = [existing.nationality_1, existing.nationality_2, existing.nationality_3,
    existing.nationality_4, existing.nationality_5]

  if (!canEditPlayer(user, nats)) {
    return NextResponse.json({ error: 'You do not have permission to edit this player' }, { status: 403 })
  }

  const body = await request.json()

  // Fields that are always safe to update
  const ALLOWED_FIELDS = [
    'name', 'date_of_birth', 'position', 'current_club', 'current_club_country',
    'nationality_1', 'nationality_2', 'nationality_3', 'nationality_4', 'nationality_5',
    'instagram_url', 'facebook_url', 'youtube_url', 'video_urls',
    'transfermarkt_url', 'profile_image_url', 'cutout_image_url',
    'description', 'birth_location', 'height_cm', 'weight_kg', 'status',
  ]

  // Super admins can also toggle platform flags
  const SUPER_ONLY = ['is_verified', 'is_active', 'is_self_submitted']

  const allowedKeys = user.role === 'super_admin'
    ? [...ALLOWED_FIELDS, ...SUPER_ONLY]
    : ALLOWED_FIELDS

  const update: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (key in body) update[key] = body[key]
  }

  // Recalculate confederation if club country changed
  if (update.current_club_country) {
    const { getConfederation } = await import('@/lib/sportsdb')
    update.current_club_confederation = getConfederation(update.current_club_country as string)
  }

  const { data, error } = await supabase
    .from('players')
    .update(update)
    .eq('slug', params.slug)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
