import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as any
  const error      = searchParams.get('error')
  const error_desc = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_desc ?? error)}`, origin)
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  let session = null

  if (code) {
    const { data, error: err } = await supabase.auth.exchangeCodeForSession(code)
    if (!err) session = data.session
  }

  if (!session && token_hash && type) {
    const { data, error: err } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!err) session = data.session
  }

  if (!session) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Link+expired+or+invalid.+Please+request+a+new+one.', origin)
    )
  }

  // Set the session cookie
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''
  const cookieName = `sb-${projectRef}-auth-token`
  const cookieValue = encodeURIComponent(JSON.stringify([
    session.access_token,
    session.refresh_token,
  ]))

  // Always go to admin dashboard after login
  const response = NextResponse.redirect(new URL('/admin/dashboard', origin))

  response.cookies.set(cookieName, cookieValue, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    maxAge: session.expires_in ?? 3600,
    path: '/',
  })

  return response
}
