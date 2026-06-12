/**
 * Nightly cron job — runs at 2am UTC via Vercel Cron.
 * Refreshes club data for all players with a SportsDB ID.
 * Prevents stale club info after transfers.
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { enrichPlayerFromSportsDB } from '@/lib/players'

export const runtime = 'edge'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  // Get players with SportsDB IDs that haven't been updated in 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: players } = await supabase
    .from('players')
    .select('id, name')
    .not('sportsdb_id', 'is', null)
    .lt('updated_at', sevenDaysAgo)
    .limit(50) // Process 50 per run to stay within rate limits

  let enriched = 0
  let failed = 0

  for (const player of players ?? []) {
    try {
      await enrichPlayerFromSportsDB(player.id)
      enriched++
      // Respect rate limit: 100 requests/min on premium
      await new Promise(r => setTimeout(r, 700))
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    message: 'Enrichment complete',
    enriched,
    failed,
    timestamp: new Date().toISOString(),
  })
}
