import { NextRequest, NextResponse } from 'next/server'
import { getPlayerBySlug } from '@/lib/players'

export const runtime = 'edge'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const player = await getPlayerBySlug(params.slug)
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }
    return NextResponse.json(player, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('Player lookup error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
