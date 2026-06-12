import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  // Only shows whether vars are SET, never exposes actual values
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL:      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:     !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SPORTSDB_API_KEY:              !!process.env.SPORTSDB_API_KEY,
    NEXT_PUBLIC_APP_URL:           !!process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV:                      process.env.NODE_ENV,
  })
}
