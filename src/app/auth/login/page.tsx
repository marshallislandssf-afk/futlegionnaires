'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Mail, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false, // Only allow pre-invited users
      },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold mb-1">
            Fut<span className="text-[#1D9E75]">Legionnaires</span>
          </h1>
          <p className="text-white/40 text-sm">Admin portal</p>
        </div>

        {sent ? (
          <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-xl p-6 text-center">
            <CheckCircle size={32} className="text-[#1D9E75] mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Check your email</p>
            <p className="text-xs text-white/40">
              We sent a magic link to <span className="text-white/60">{email}</span>.
              Click it to sign in — no password needed.
            </p>
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
            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-4">
                {error === 'Signups not allowed for this instance'
                  ? 'This email hasn\'t been invited. Contact your FutLegionnaires admin.'
                  : error}
              </p>
            )}
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
