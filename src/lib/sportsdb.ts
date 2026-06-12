/**
 * TheSportsDB API client
 * Server-side only — the API key is never sent to the browser.
 * All calls go through Next.js Route Handlers (Edge Functions on Vercel).
 *
 * API docs: https://www.thesportsdb.com/documentation
 * v2 base URL requires X-API-KEY header (premium only)
 */

import type { SportsDBPlayer, SportsDBSearchResult, SportsDBLookupResult, Player, Position, Confederation } from '@/types'

const V1_BASE = 'https://www.thesportsdb.com/api/v1/json'
const V2_BASE = 'https://www.thesportsdb.com/api/v2/json'
const API_KEY = process.env.SPORTSDB_API_KEY!

if (!API_KEY) {
  throw new Error('SPORTSDB_API_KEY is not set. Add it to .env.local')
}

// ─── Request helpers ──────────────────────────────────────────────────────────

async function v1Get<T>(path: string): Promise<T> {
  const url = `${V1_BASE}/${API_KEY}/${path}`
  const res = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  })
  if (!res.ok) throw new Error(`SportsDB v1 error: ${res.status} ${url}`)
  return res.json()
}

async function v2Get<T>(path: string): Promise<T> {
  const url = `${V2_BASE}/${path}`
  const res = await fetch(url, {
    headers: { 'X-API-KEY': API_KEY },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`SportsDB v2 error: ${res.status} ${url}`)
  return res.json()
}

// ─── Player search ────────────────────────────────────────────────────────────

/**
 * Search players by name.
 * v2 returns richer data and up to 10 results (premium).
 */
export async function searchPlayersByName(name: string): Promise<SportsDBPlayer[]> {
  try {
    // v2 search — more modern, returns better fields
    const query = name.replace(/\s+/g, '_')
    const data = await v2Get<{ players: SportsDBPlayer[] | null }>(`search/player/${encodeURIComponent(query)}`)
    return data.players ?? []
  } catch {
    // Fallback to v1 if v2 fails
    const query = name.replace(/\s+/g, '_')
    const data = await v1Get<SportsDBSearchResult>(`searchplayers.php?p=${encodeURIComponent(query)}`)
    return data.player ?? []
  }
}

/**
 * Look up a single player by their TheSportsDB ID.
 * Returns full details including social links, images, bio.
 */
export async function lookupPlayerById(sportsdbId: string): Promise<SportsDBPlayer | null> {
  const data = await v1Get<SportsDBLookupResult>(`lookupplayer.php?id=${sportsdbId}`)
  return data.players?.[0] ?? null
}

/**
 * Get all players for a team by team ID.
 * Useful for batch-loading when you know which clubs to scan.
 */
export async function getPlayersByTeam(teamId: string): Promise<SportsDBPlayer[]> {
  const data = await v1Get<{ player: SportsDBPlayer[] | null }>(`lookup_all_players.php?id=${teamId}`)
  return data.player ?? []
}

// ─── Normaliser: SportsDB → our Player type ───────────────────────────────────

/**
 * Converts a raw TheSportsDB player object into our internal Player shape.
 * Gaps (multiple nationalities, extra videos) are filled from Supabase later
 * via mergeWithSupabaseData().
 */
export function normaliseSportsDBPlayer(raw: SportsDBPlayer): Partial<Player> {
  const dob = raw.dateBorn ?? ''
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : 0

  // Parse height — SportsDB returns "180 cm" or "5'11\""
  let height_cm: number | undefined
  if (raw.strHeight) {
    const cmMatch = raw.strHeight.match(/(\d+)\s*cm/i)
    if (cmMatch) height_cm = parseInt(cmMatch[1])
  }

  // Normalise Instagram — SportsDB stores full URLs or handles inconsistently
  let instagram_url: string | undefined
  if (raw.strInstagram) {
    const handle = raw.strInstagram.replace(/^.*instagram\.com\/?/, '').replace(/^@/, '').replace(/\/$/, '')
    instagram_url = handle ? `https://instagram.com/${handle}` : undefined
  }

  return {
    sportsdb_id: raw.idPlayer,
    sportsdb_team_id: raw.idTeam,
    transfermarkt_id: raw.idTransferMkt ?? undefined,
    name: raw.strPlayer,
    date_of_birth: dob,
    age,
    position: normalisePosition(raw.strPosition),
    gender: (raw.strGender as 'Male' | 'Female') ?? 'Male',
    current_club: raw.strTeam?.replace(/^_/, '') ?? '',
    nationality_1: raw.strNationality ?? '',
    profile_image_url: raw.strThumb ?? undefined,
    cutout_image_url: raw.strCutout ?? undefined,
    instagram_url,
    youtube_url: raw.strYoutube ? `https://${raw.strYoutube.replace(/^https?:\/\//, '')}` : undefined,
    description: raw.strDescriptionEN ?? undefined,
    birth_location: raw.strBirthLocation ?? undefined,
    ethnicity: raw.strEthnicity ?? undefined,
    height_cm,
    status: normaliseStatus(raw.strStatus),
    is_verified: false,
    is_self_submitted: false,
    is_active: raw.strStatus !== 'Retired',
  }
}

// ─── Field normalisers ────────────────────────────────────────────────────────

function normalisePosition(raw: string | null): Position {
  if (!raw) return 'Centre-Forward'
  const p = raw.toLowerCase()
  if (p.includes('goalkeeper') || p.includes('goalie')) return 'Goalkeeper'
  if (p.includes('centre-back') || p.includes('center-back') || p.includes('central def')) return 'Centre-Back'
  if (p.includes('right back') || p.includes('right-back')) return 'Right-Back'
  if (p.includes('left back') || p.includes('left-back')) return 'Left-Back'
  if (p.includes('defensive mid')) return 'Defensive Midfielder'
  if (p.includes('attacking mid')) return 'Attacking Midfielder'
  if (p.includes('midfielder') || p.includes('midfield')) return 'Central Midfielder'
  if (p.includes('right wing') || p.includes('right-wing')) return 'Right Winger'
  if (p.includes('left wing') || p.includes('left-wing')) return 'Left Winger'
  if (p.includes('second striker')) return 'Second Striker'
  if (p.includes('forward') || p.includes('striker')) return 'Centre-Forward'
  if (p.includes('winger')) return 'Right Winger'
  return 'Centre-Forward'
}

function normaliseStatus(raw: string | null): 'Active' | 'Retired' | 'Free Agent' {
  if (!raw) return 'Active'
  const s = raw.toLowerCase()
  if (s.includes('retired')) return 'Retired'
  if (s.includes('free')) return 'Free Agent'
  return 'Active'
}

// ─── Confederation mapping ────────────────────────────────────────────────────

const COUNTRY_CONFEDERATION: Record<string, Confederation> = {
  // UEFA
  England: 'UEFA', France: 'UEFA', Germany: 'UEFA', Spain: 'UEFA', Italy: 'UEFA',
  Portugal: 'UEFA', Netherlands: 'UEFA', Belgium: 'UEFA', Turkey: 'UEFA', Russia: 'UEFA',
  Poland: 'UEFA', Sweden: 'UEFA', Norway: 'UEFA', Denmark: 'UEFA', Switzerland: 'UEFA',
  Austria: 'UEFA', Greece: 'UEFA', Croatia: 'UEFA', Serbia: 'UEFA', Ukraine: 'UEFA',
  Scotland: 'UEFA', Wales: 'UEFA', 'Northern Ireland': 'UEFA', Ireland: 'UEFA',
  // CAF
  Nigeria: 'CAF', Ghana: 'CAF', Senegal: 'CAF', Morocco: 'CAF', Egypt: 'CAF',
  Algeria: 'CAF', Tunisia: 'CAF', 'Ivory Coast': 'CAF', Cameroon: 'CAF', Mali: 'CAF',
  Zambia: 'CAF', Zimbabwe: 'CAF', Kenya: 'CAF', Ethiopia: 'CAF', Tanzania: 'CAF',
  'DR Congo': 'CAF', Congo: 'CAF', Gabon: 'CAF', Guinea: 'CAF', 'Cape Verde': 'CAF',
  'Burkina Faso': 'CAF', Togo: 'CAF', Benin: 'CAF', Rwanda: 'CAF', Uganda: 'CAF',
  'Equatorial Guinea': 'CAF', Liberia: 'CAF', 'Sierra Leone': 'CAF', Gambia: 'CAF',
  // CONMEBOL
  Brazil: 'CONMEBOL', Argentina: 'CONMEBOL', Colombia: 'CONMEBOL', Chile: 'CONMEBOL',
  Uruguay: 'CONMEBOL', Peru: 'CONMEBOL', Ecuador: 'CONMEBOL', Venezuela: 'CONMEBOL',
  Bolivia: 'CONMEBOL', Paraguay: 'CONMEBOL',
  // CONCACAF
  'United States': 'CONCACAF', Mexico: 'CONCACAF', Canada: 'CONCACAF', Jamaica: 'CONCACAF',
  Haiti: 'CONCACAF', 'Trinidad and Tobago': 'CONCACAF', Honduras: 'CONCACAF',
  'Costa Rica': 'CONCACAF', 'El Salvador': 'CONCACAF', Guatemala: 'CONCACAF',
  Panama: 'CONCACAF', Cuba: 'CONCACAF', Guadeloupe: 'CONCACAF', Martinique: 'CONCACAF',
  Suriname: 'CONCACAF', Curacao: 'CONCACAF',
  // AFC
  Japan: 'AFC', 'South Korea': 'AFC', China: 'AFC', Australia: 'AFC', Iran: 'AFC',
  'Saudi Arabia': 'AFC', Qatar: 'AFC', UAE: 'AFC', Iraq: 'AFC', Jordan: 'AFC',
  India: 'AFC', Pakistan: 'AFC', Philippines: 'AFC', Indonesia: 'AFC', Vietnam: 'AFC',
  Thailand: 'AFC', Malaysia: 'AFC', Singapore: 'AFC',
  // OFC
  'New Zealand': 'OFC', 'Papua New Guinea': 'OFC', Fiji: 'OFC', Vanuatu: 'OFC',
  'Solomon Islands': 'OFC', Samoa: 'OFC', Tahiti: 'OFC',
}

export function getConfederation(country: string): Confederation {
  return COUNTRY_CONFEDERATION[country] ?? 'UEFA'
}
