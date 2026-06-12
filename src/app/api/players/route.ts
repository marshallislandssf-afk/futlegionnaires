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
    if (conf)        query = query.eq('current_club_confederation', conf)
    if (nationality) query = query.or(
      `nationality_1.ilike.%${nationality}%,nationality_2.ilike.%${nationality}%,nationality_3.ilike.%${nationality}%,nationality_4.ilike.%${nationality}%,nationality_5.ilike.%${nationality}%`
    )

    const { data, error, count } = await query

    if (error) {
      console.error('Player search error:', error)
      return NextResponse.json({ error: error.message, players: [], total: 0, page, page_size }, { status: 500 })
    }

    return NextResponse.json({
      players: data ?? [],
      total: count ?? 0,
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
