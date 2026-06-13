'use client'

import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setError('Configuration error — check Vercel environment variables.')
      setLoading(false)
      return
    }

    const redirectTo = `${window.location.origin}/auth/callback`

    // Call Supabase auth API directly — avoids any SDK routing issues
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email,
          create_user: false,
          data: {},
          gotrue_meta_security: {},
          options: { emailRedirectTo: redirectTo },
        }),
      })

      if (res.ok || res.status === 200) {
        setSent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data?.msg ?? data?.message ?? data?.error_description ?? `Error ${res.status}`
        if (msg.toLowerCase().includes('user') || res.status === 422) {
          setError("This email hasn't been invited. Contact your FutLegionnaires admin.")
        } else {
          setError(msg)
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error — please try again.')
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

        {sent ? (
          <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-xl p-6 text-center">
            <CheckCircle size={32} className="text-[#1D9E75] mx-auto mb-3" />
            <p className="text-sm font-medium text-white mb-1">Check your email</p>
            <p className="text-xs text-white/40">
              We sent a magic link to <span className="text-white/60">{email}</span>.
              Click it to sign in — no password needed.
            </p>
            <p className="text-xs text-white/25 mt-3">Check spam if it doesn't arrive within a minute.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
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
      </div>
    </div>
  )
}
