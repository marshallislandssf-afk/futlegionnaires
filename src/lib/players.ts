/**
 * Player service
 * All player data operations — search, lookup, create, update.
 * Merges TheSportsDB data with our Supabase supplementary data.
 */

import { createServerSupabaseClient } from './supabase'
import { searchPlayersByName, lookupPlayerById, normaliseSportsDBPlayer, getConfederation } from './sportsdb'
import type { Player, PlayerSearchParams, PlayerSearchResponse, PlayerSubmission, MapStats } from '@/types'

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchPlayers(params: PlayerSearchParams): Promise<PlayerSearchResponse> {
  const supabase = createServerSupabaseClient()
  const db = supabase as any
  const {
    q,
    position,
    confederation,
    nationality,
    club,
    age_min,
    age_max,
    page = 1,
    page_size = 24,
  } = params

  let query = db
    .from('players')
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  // Text search across name, club and nationality fields
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,current_club.ilike.%${q}%,nationality_1.ilike.%${q}%,nationality_2.ilike.%${q}%`
    )
  }

  if (position) query = query.eq('position', position)
  if (confederation) query = query.eq('current_club_confederation', confederation)
  if (club) query = query.ilike('current_club', `%${club}%`)

  if (nationality) {
    query = query.or(
      `nationality_1.ilike.%${nationality}%,nationality_2.ilike.%${nationality}%,nationality_3.ilike.%${nationality}%,nationality_4.ilike.%${nationality}%,nationality_5.ilike.%${nationality}%`
    )
  }

  if (age_min) query = query.gte('age', age_min)
  if (age_max) query = query.lte('age', age_max)

  const from = (page - 1) * page_size
  query = query.range(from, from + page_size - 1).order('name')

  const { data, error, count } = await query

  if (error) throw new Error(`Player search failed: ${error.message}`)

  return {
    players: data as Player[],
    total: count ?? 0,
    page,
    page_size,
  }
}

// ─── Get single player ────────────────────────────────────────────────────────

export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  const supabase = createServerSupabaseClient()
  const db = supabase as any
  const { data, error } = await db
    .from('players')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as unknown as Player
}

// ─── Enrich from TheSportsDB ──────────────────────────────────────────────────

/**
 * Pull fresh data from TheSportsDB for a player and merge into Supabase.
 * Run this on a cron (e.g. Vercel Cron) nightly to keep club data fresh.
 */
export async function enrichPlayerFromSportsDB(playerId: string): Promise<Player | null> {
  const supabase = createServerSupabaseClient()
  const db = supabase as any

  const { data: rawPlayer } = await db
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single()

  const player = rawPlayer as Player | null
  if (!player) return null

  // If we have a SportsDB ID, do a direct lookup
  if (player.sportsdb_id) {
    const raw = await lookupPlayerById(player.sportsdb_id)
    if (raw) {
      const enriched = normaliseSportsDBPlayer(raw)
      // Only update fields that SportsDB owns — don't overwrite our curated nationality data
      const { data: updated } = await db
        .from('players')
        .update({
          current_club: enriched.current_club ?? player.current_club,
          profile_image_url: enriched.profile_image_url ?? player.profile_image_url,
          cutout_image_url: enriched.cutout_image_url ?? player.cutout_image_url,
          description: enriched.description ?? player.description,
          status: enriched.status ?? player.status,
          is_active: enriched.is_active ?? player.is_active,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', playerId)
        .select()
        .single()

      return updated as Player
    }
  }

  return player as Player
}

/**
 * Search SportsDB by name and create a new player record in Supabase.
 * Used by the admin import tool.
 */
export async function importPlayerFromSportsDB(name: string, extraData: Partial<Player> = {}): Promise<Player | null> {
  const supabase = createServerSupabaseClient()
  const db = supabase as any

  const results = await searchPlayersByName(name)
  if (!results.length) return null

  // Take the most relevant result
  const raw = results[0]
  const normalised = normaliseSportsDBPlayer(raw)

  const slug = generateSlug(raw.strPlayer)

  const playerData = {
    ...normalised,
    ...extraData, // Our curated data takes priority
    slug,
    current_club_confederation: getConfederation(normalised.current_club ?? ''),
    is_verified: false,
    is_self_submitted: false,
  }

  const { data, error } = await supabase
    .from('players')
    .upsert(playerData as any, { onConflict: 'slug' })
    .select()
    .single()

  if (error) throw new Error(`Failed to import player: ${error.message}`)
  return data as Player
}

// ─── Submissions (player self-submit) ────────────────────────────────────────

export async function submitPlayerProfile(submission: PlayerSubmission): Promise<{ id: string }> {
  const supabase = createServerSupabaseClient()
  const db = supabase as any

  const { data, error } = await db
    .from('player_submissions')
    .insert({
      ...submission,
      status: 'pending',
    } as any)
    .select('id')
    .single()

  if (error) throw new Error(`Submission failed: ${error.message}`)
  const row = data as unknown as { id: string } | null
  return { id: row?.id ?? '' }
}

// ─── Map / Scout stats ────────────────────────────────────────────────────────

export async function getMapStats(): Promise<MapStats> {
  const supabase = createServerSupabaseClient()
  const db = supabase as any

  // Confederation counts
  const { data: rawConfData } = await db
    .from('players')
    .select('current_club_confederation')
    .eq('is_active', true)

  const confData = (rawConfData ?? []) as { current_club_confederation: string }[]
  const confCounts: Record<string, number> = {}
  for (const row of confData) {
    const c = row.current_club_confederation
    confCounts[c] = (confCounts[c] ?? 0) + 1
  }

  // Top leagues (club + country grouped)
  const { data: rawLeagueData } = await db
    .from('players')
    .select('current_club, current_club_country, current_club_confederation')
    .eq('is_active', true)

  const leagueData = (rawLeagueData ?? []) as { current_club: string; current_club_country: string; current_club_confederation: string }[]
  const leagueCounts: Record<string, { country: string; confederation: string; count: number }> = {}
  for (const row of leagueData) {
    const key = row.current_club_country
    if (!leagueCounts[key]) {
      leagueCounts[key] = { country: row.current_club_country, confederation: row.current_club_confederation, count: 0 }
    }
    leagueCounts[key].count++
  }

  // Top nations with uncapped eligible players
  const { data: rawNatData } = await db
    .from('players')
    .select('nationality_1, nationality_2, nationality_3, nationality_4, nationality_5')
    .eq('is_active', true)

  const natData = (rawNatData ?? []) as { nationality_1?: string; nationality_2?: string; nationality_3?: string; nationality_4?: string; nationality_5?: string }[]
  const natCounts: Record<string, number> = {}
  for (const row of natData) {
    const nats = [row.nationality_1, row.nationality_2, row.nationality_3, row.nationality_4, row.nationality_5].filter(Boolean)
    for (const nat of nats) {
      if (nat) natCounts[nat] = (natCounts[nat] ?? 0) + 1
    }
  }

  const totalPlayers = confData.length

  return {
    total_players: totalPlayers,
    confederations: Object.entries(confCounts).map(([confederation, player_count]) => ({
      confederation: confederation as any,
      player_count,
      club_count: 0,
      country_count: 0,
    })),
    top_leagues: Object.entries(leagueCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([league, v]) => ({
        league,
        country: v.country,
        confederation: v.confederation as any,
        player_count: v.count,
      })),
    top_nations: Object.entries(natCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([nationality, count]) => ({
        nationality,
        confederation: getConfederation(nationality),
        uncapped_count: count,
        total_count: count,
      })),
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
