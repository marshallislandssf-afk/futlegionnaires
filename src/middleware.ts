import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session token from cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''
  const cookieName = `sb-${projectRef}-auth-token`
  const rawCookie = request.cookies.get(cookieName)?.value
  const isAuthenticated = !!rawCookie

  // Protect /admin/*
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/auth/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login'],
}
