'use client'

import { useState } from 'react'
import { UserPlus, X, CheckCircle, Mail, AlertCircle, Globe } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  full_name?: string
  role: string
  is_active: boolean
  created_at: string
  user_countries: { country: string }[]
}

interface PendingInvite {
  id: string
  email: string
  role: string
  countries: string[]
  created_at: string
  expires_at: string
}

interface Territory {
  name: string
  confederation: string
  is_fifa_member: boolean
}

const CONFEDERATIONS = ['UEFA','CAF','CONMEBOL','CONCACAF','AFC','OFC']

export function TeamClient({
  members,
  pendingInvites,
  territories,
}: {
  members: TeamMember[]
  pendingInvites: PendingInvite[]
  territories: Territory[]
}) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [confFilter, setConfFilter] = useState('')
  const [nonFifaVisible, setNonFifaVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localMembers, setLocalMembers] = useState(members)
  const [localInvites, setLocalInvites] = useState(pendingInvites)

  const filteredTerritories = territories.filter(t => {
    if (confFilter && t.confederation !== confFilter) return false
    if (!nonFifaVisible && !t.is_fifa_member) return false
    return true
  })

  function toggleCountry(name: string) {
    setSelectedCountries(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  async function sendInvite() {
    if (!inviteEmail || selectedCountries.length === 0) {
      setError('Email and at least one country are required.')
      return
    }
    setSending(true); setError(null)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, countries: selectedCountries }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSending(false); return }
    setSentTo(inviteEmail)
    setLocalInvites(prev => [data.invite, ...prev])
    setInviteEmail(''); setSelectedCountries([]); setShowInviteForm(false)
    setSending(false)
    setTimeout(() => setSentTo(null), 5000)
  }

  async function revokeAccess(userId: string) {
    if (!confirm('Revoke this user\'s access? They will no longer be able to log in.')) return
    await fetch(`/api/admin/invite`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    setLocalMembers(prev => prev.map(m => m.id === userId ? { ...m, is_active: false } : m))
  }

  async function cancelInvite(inviteId: string) {
    await fetch(`/api/admin/invite?id=${inviteId}`, { method: 'DELETE' })
    setLocalInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  return (
    <div className="space-y-6">
      {/* Invite success toast */}
      {sentTo && (
        <div className="flex items-center gap-2 bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-lg px-4 py-3 text-sm text-[#1D9E75]">
          <CheckCircle size={14} /> Invite sent to {sentTo}
        </div>
      )}

      {/* Current team members */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-medium">Team members</h2>
          <button
            onClick={() => setShowInviteForm(v => !v)}
            className="flex items-center gap-1.5 text-xs bg-[#1D9E75] text-black font-medium px-3 py-1.5 rounded-lg hover:bg-[#0F6E56] transition-colors"
          >
            <UserPlus size={13} /> Invite manager
          </button>
        </div>

        {localMembers.length === 0 ? (
          <p className="text-center py-8 text-white/20 text-sm">No team members yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {localMembers.map(m => (
              <div key={m.id} className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-xs font-medium text-[#1D9E75] flex-shrink-0">
                  {(m.full_name ?? m.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{m.full_name ?? m.email}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      m.role === 'super_admin'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-white/5 text-white/30'
                    }`}>{m.role === 'super_admin' ? 'Super Admin' : 'Country Manager'}</span>
                    {!m.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Revoked</span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 mb-2">{m.email}</p>
                  {m.user_countries?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.user_countries.map(uc => (
                        <span key={uc.country} className="text-[10px] px-1.5 py-0.5 bg-[#1D9E75]/8 text-[#1D9E75]/60 rounded">
                          {uc.country}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.is_active && m.role !== 'super_admin' && (
                  <button onClick={() => revokeAccess(m.id)}
                    className="text-xs text-white/20 hover:text-red-400 transition-colors shrink-0">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {localInvites.length > 0 && (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
          <h2 className="text-sm font-medium px-5 py-4 border-b border-white/5">
            Pending invites <span className="text-white/30">({localInvites.length})</span>
          </h2>
          <div className="divide-y divide-white/5">
            {localInvites.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <Mail size={14} className="text-white/25 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">{inv.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {inv.countries?.map(c => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/30 rounded">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-white/20">
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-GB')}
                  </p>
                  <button onClick={() => cancelInvite(inv.id)}
                    className="text-[11px] text-white/20 hover:text-red-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && (
        <div className="bg-white/[0.03] border border-[#1D9E75]/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Invite a country manager</h2>
            <button onClick={() => setShowInviteForm(false)} className="text-white/25 hover:text-white/60">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/35 mb-1.5">Email address</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="manager@example.com"
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50" />
            </div>

            {/* Country picker */}
            <div>
              <label className="block text-xs text-white/35 mb-2">Assign countries</label>

              {/* Filters */}
              <div className="flex gap-2 mb-3 flex-wrap">
                <select value={confFilter} onChange={e => setConfFilter(e.target.value)}
                  className="bg-white/[0.05] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 focus:outline-none">
                  <option value="">All confederations</option>
                  {CONFEDERATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-white/40 cursor-pointer">
                  <input type="checkbox" checked={nonFifaVisible}
                    onChange={e => setNonFifaVisible(e.target.checked)}
                    className="rounded" />
                  Include non-FIFA territories
                </label>
              </div>

              {/* Territory grid */}
              <div className="max-h-52 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 pr-1">
                {filteredTerritories.map(t => {
                  const selected = selectedCountries.includes(t.name)
                  return (
                    <button key={t.name} onClick={() => toggleCountry(t.name)}
                      className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        selected
                          ? 'bg-[#1D9E75]/15 border-[#1D9E75]/30 text-[#1D9E75]'
                          : 'bg-white/[0.03] border-white/5 text-white/40 hover:border-white/15 hover:text-white/60'
                      }`}>
                      {t.name}
                      {!t.is_fifa_member && (
                        <span className="ml-1 text-[9px] opacity-50">non-FIFA</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedCountries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCountries.map(c => (
                    <span key={c} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#1D9E75]/15 text-[#1D9E75] rounded-full">
                      {c}
                      <button onClick={() => toggleCountry(c)} className="hover:opacity-70"><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                <AlertCircle size={12} /> {error}
              </div>
            )}

            <button onClick={sendInvite} disabled={sending}
              className="flex items-center gap-2 bg-[#1D9E75] text-black font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50 transition-colors">
              <Mail size={14} />
              {sending ? 'Sending…' : 'Send magic link invite'}
            </button>
            <p className="text-[11px] text-white/20">
              They'll receive an email with a magic link. No password needed. Link expires in 7 days.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
