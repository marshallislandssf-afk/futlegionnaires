'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    async function confirm() {
      const params = new URLSearchParams(window.location.search)
      const token_hash = params.get('token_hash')
      const type = params.get('type')
      const code = params.get('code')
      const error = params.get('error')
      const error_desc = params.get('error_description')

      if (error) {
        setStatus(`Error: ${error_desc ?? error}`)
        setTimeout(() => router.push('/auth/login?error=' + encodeURIComponent(error_desc ?? error)), 2000)
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        let session = null

        if (token_hash && type) {
          // OTP / magic link flow
          const res = await fetch(`${supabaseUrl}/auth/v1/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
            },
            body: JSON.stringify({ token_hash, type }),
          })
          const data = await res.json()
          if (data.access_token) session = data
        }

        if (!session && code) {
          // PKCE flow
          const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
            },
            body: JSON.stringify({ auth_code: code }),
          })
          const data = await res.json()
          if (data.access_token) session = data
        }

        if (session?.access_token) {
          // Store session in localStorage the same way Supabase client does
          const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''
          const storageKey = `sb-${projectRef}-auth-token`
          localStorage.setItem(storageKey, JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
            expires_in: session.expires_in ?? 3600,
            token_type: 'bearer',
            user: session.user,
          }))
          setStatus('Signed in! Redirecting…')
          router.push('/admin/dashboard')
        } else {
          setStatus('Link expired or invalid. Redirecting to login…')
          setTimeout(() => router.push('/auth/login?error=Link+expired'), 2000)
        }
      } catch (err: any) {
        setStatus('Something went wrong. Redirecting to login…')
        setTimeout(() => router.push('/auth/login'), 2000)
      }
    }

    confirm()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">{status}</p>
      </div>
    </div>
  )
}
