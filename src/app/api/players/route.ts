import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'  // Use Node runtime, not Edge — avoids process.version warning

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q          = searchParams.get('q')?.trim() ?? ''
  const position   = searchParams.get('position') ?? ''
  const conf       = searchParams.get('confederation') ?? ''
  const nationality = searchParams.get('nationality') ?? ''
  const page       = Math.max(1, Number(searchParams.get('page') ?? 1))
  const page_size  = Math.min(48, Number(searchParams.get('page_size') ?? 24))
  const from       = (page - 1) * page_size
  const to         = from + page_size - 1

  try {
    const db = createServerSupabaseClient() as any

    let query = db
      .from('players')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(from, to)

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,current_club.ilike.%${q}%,nationality_1.ilike.%${q}%,nationality_2.ilike.%${q}%`
      )
    }
    if (position)    query = query.eq('position', position)
    if (conf) {
      // Filter by nationality confederation, not club confederation
      // Build list of all countries in this confederation
      const { getConfederation } = await import('@/lib/sportsdb')
      // Use nationality fields to match — a player appears in AFC if any nationality is AFC
      // We do this by filtering where nationality_X belongs to the conf
      // Since we can't do this in SQL without a function, we filter client-side after fetch
      // For now use a broad OR across nationality fields with known AFC/CAF etc countries
      query = query.or(
        [1,2,3,4,5].map(n => `nationality_${n}.not.is.null`).join(',')
      )
      // We'll post-filter by confederation below
    }
    if (nationality) query = query.or(
      `nationality_1.ilike.%${nationality}%,nationality_2.ilike.%${nationality}%,nationality_3.ilike.%${nationality}%,nationality_4.ilike.%${nationality}%,nationality_5.ilike.%${nationality}%`
    )

    const { data, error, count } = await query

    if (error) {
      console.error('Player search error:', error)
      return NextResponse.json({ error: error.message, players: [], total: 0, page, page_size }, { status: 500 })
    }

    // Post-filter by nationality confederation if requested
    let players = data ?? []
    if (conf) {
      const { getConfederation } = await import('@/lib/sportsdb')
      players = players.filter((p: any) => {
        const nats = [p.nationality_1, p.nationality_2, p.nationality_3, p.nationality_4, p.nationality_5].filter(Boolean)
        return nats.some((n: string) => getConfederation(n) === conf)
      })
    }

    return NextResponse.json({
      players,
      total: conf ? players.length : (count ?? 0),
      page,
      page_size,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err: any) {
    console.error('Players API error:', err)
    return NextResponse.json({ error: err.message, players: [], total: 0, page, page_size }, { status: 500 })
  }
}
