import { NextResponse } from 'next/server'
import { getMapStats } from '@/lib/players'

export const runtime = 'edge'

export async function GET() {
  try {
    const stats = await getMapStats()
    return NextResponse.json(stats, {
      headers: {
        // Cache map stats for 5 minutes — doesn't need to be real-time
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('Map stats error:', err)
    return NextResponse.json({ error: 'Failed to load map stats' }, { status: 500 })
  }
}
