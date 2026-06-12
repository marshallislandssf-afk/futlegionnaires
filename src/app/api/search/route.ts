/**
 * /api/search — proxies TheSportsDB searches server-side.
 * The API key NEVER leaves the server. The browser calls this endpoint.
 */
import { NextRequest, NextResponse } from 'next/server'
import { searchPlayersByName, normaliseSportsDBPlayer } from '@/lib/sportsdb'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'name param required (min 2 chars)' }, { status: 400 })
  }

  try {
    const rawPlayers = await searchPlayersByName(name.trim())
    const normalised = rawPlayers.map(normaliseSportsDBPlayer)
    return NextResponse.json({ players: normalised, source: 'sportsdb' }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('SportsDB search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
