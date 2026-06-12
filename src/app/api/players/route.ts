import { NextRequest, NextResponse } from 'next/server'
import { searchPlayers } from '@/lib/players'
import type { PlayerSearchParams } from '@/types'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const params: PlayerSearchParams = {
    q: searchParams.get('q') ?? undefined,
    position: (searchParams.get('position') as any) ?? undefined,
    confederation: (searchParams.get('confederation') as any) ?? undefined,
    nationality: searchParams.get('nationality') ?? undefined,
    club: searchParams.get('club') ?? undefined,
    age_min: searchParams.get('age_min') ? Number(searchParams.get('age_min')) : undefined,
    age_max: searchParams.get('age_max') ? Number(searchParams.get('age_max')) : undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    page_size: searchParams.get('page_size') ? Number(searchParams.get('page_size')) : 24,
  }

  try {
    const result = await searchPlayers(params)
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err) {
    console.error('Player search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
