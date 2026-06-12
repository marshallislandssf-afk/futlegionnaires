import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { enrichPlayerFromSportsDB } from '@/lib/players'

export const runtime = 'edge'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const db = createServerSupabaseClient() as any

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rawPlayers } = await db
    .from('players')
    .select('id, name')
    .not('sportsdb_id', 'is', null)
    .lt('updated_at', sevenDaysAgo)
    .limit(50)

  const players = (rawPlayers ?? []) as { id: string; name: string }[]

  let enriched = 0
  let failed = 0

  for (const player of players) {
    try {
      await enrichPlayerFromSportsDB(player.id)
      enriched++
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
