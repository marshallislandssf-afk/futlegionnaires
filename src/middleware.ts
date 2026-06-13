import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check all possible Supabase session cookie/storage locations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''

  // Check for any auth-related cookie from Supabase
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(c =>
    c.name.includes('auth-token') ||
    c.name.includes('sb-') ||
    c.name === `sb-${projectRef}-auth-token`
  )

  if (pathname.startsWith('/admin')) {
    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (pathname === '/auth/login' && hasAuthCookie) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login'],
}
