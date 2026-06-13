'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.access_token) {
        setError(data.error_description ?? data.msg ?? 'Invalid email or password.')
        setLoading(false)
        return
      }

      // Store session in localStorage exactly how Supabase SDK expects
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''
      const storageKey = `sb-${projectRef}-auth-token`
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
        expires_in: data.expires_in ?? 3600,
        token_type: 'bearer',
        user: data.user,
      }))

      // Also set a cookie for middleware
      document.cookie = `sb-${projectRef}-auth-token=${encodeURIComponent(JSON.stringify([data.access_token, data.refresh_token]))}; path=/; max-age=${data.expires_in ?? 3600}; SameSite=Lax`

      router.push('/admin/dashboard')
      router.refresh()
    } catch (err: any) {
      setError('Network error — please try again.')
    }

    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          email,
          create_user: false,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        }),
      })

      if (res.ok) {
        setMagicSent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.msg ?? data.error_description ?? 'Could not send magic link.')
      }
    } catch {
      setError('Network error — please try again.')
    }

    setLoading(false)
  }

  const urlError = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('error')
    : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0f0d]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold mb-1 text-white">
            Fut<span className="text-[#1D9E75]">Legionnaires</span>
          </h1>
          <p className="text-white/40 text-sm">Admin portal</p>
        </div>

        {(error || urlError) && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-sm text-red-400">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error ?? urlError}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex gap-1 mb-5 bg-white/[0.04] p-1 rounded-lg">
          <button
            onClick={() => setMode('password')}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              mode === 'password'
                ? 'bg-[#1D9E75] text-black font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setMode('magic')}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              mode === 'magic'
                ? 'bg-[#1D9E75] text-black font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Magic link
          </button>
        </div>

        {/* Password login */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="bg-white/[0.04] border border-white/10 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] text-black font-medium text-sm py-2.5 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50 transition-colors"
            >
              <Lock size={14} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-[11px] text-white/20 text-center">
              Set your password in Supabase → Authentication → Users
            </p>
          </form>
        )}

        {/* Magic link */}
        {mode === 'magic' && !magicSent && (
          <form onSubmit={handleMagicLink} className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
            <label className="block text-xs text-white/40 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50 mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] text-black font-medium text-sm py-2.5 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50 transition-colors"
            >
              <Mail size={14} />
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {mode === 'magic' && magicSent && (
          <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-xl p-6 text-center">
            <CheckCircle size={32} className="text-[#1D9E75] mx-auto mb-3" />
            <p className="text-sm font-medium text-white mb-1">Check your email</p>
            <p className="text-xs text-white/40">
              Magic link sent to <span className="text-white/60">{email}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
