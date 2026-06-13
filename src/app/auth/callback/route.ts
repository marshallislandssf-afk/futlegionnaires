import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  // Just redirect to a client-side page that handles the session
  // Pass along all the original params
  const params = new URL(request.url).search
  return NextResponse.redirect(new URL(`/auth/confirm${params}`, origin))
}
