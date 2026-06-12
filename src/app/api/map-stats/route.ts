import { NextResponse } from 'next/server'
import { getMapStats } from '@/lib/players'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const stats = await getMapStats()
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  } catch (err: any) {
    console.error('Map stats error:', err)
    // Return safe empty structure so the map page doesn't crash
    return NextResponse.json({
      total_players: 0,
      confederations: [],
      top_leagues: [],
      top_nations: [],
    })
  }
}
