import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code         = searchParams.get('code')
  const token_hash   = searchParams.get('token_hash')
  const type         = searchParams.get('type')
  const next         = searchParams.get('next') ?? '/admin/dashboard'
  const error        = searchParams.get('error')
  const error_desc   = searchParams.get('error_description')

  // If Supabase sent an error, show it
  if (error) {
    console.error('Auth callback error:', error, error_desc)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_desc ?? error)}`, origin)
    )
  }

  const supabase = createServerSupabaseClient()

  // PKCE flow (code)
  if (code) {
    const { error } = await (supabase as any).auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Magic link / OTP flow (token_hash)
  if (token_hash && type) {
    const { error } = await (supabase as any).auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Fallback — something went wrong
  return NextResponse.redirect(new URL('/auth/login?error=Link+expired+or+invalid.+Please+request+a+new+one.', origin))
}
