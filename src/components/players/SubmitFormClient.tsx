'use client'

import { useState } from 'react'
import { Nav } from '@/components/layout/Nav'
import { CheckCircle, Plus, X, Info } from 'lucide-react'
import type { PlayerSubmission, Position } from '@/types'

const POSITIONS: Position[] = [
  'Goalkeeper','Centre-Back','Right-Back','Left-Back',
  'Defensive Midfielder','Central Midfielder','Attacking Midfielder',
  'Right Winger','Left Winger','Second Striker','Centre-Forward',
]

interface Territory { name: string; confederation: string; is_fifa_member: boolean }

const inputClass = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50 transition-colors"

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-white/35 mb-1.5">
        {label} {required && <span className="text-[#1D9E75]">*</span>}
        {hint && <span className="text-white/20 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

export function SubmitFormClient({ territories }: { territories: Territory[] }) {
  const [submittingFor, setSubmittingFor] = useState<'self' | 'other'>('self')
  const [form, setForm] = useState<Partial<PlayerSubmission & { submitter_name: string }>>({})
  const [videoUrls, setVideoUrls] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  // Separate FIFA and non-FIFA for the nationality fields
  const fifaTerritories = territories.filter(t => t.is_fifa_member)
  const nonFifaTerritories = territories.filter(t => !t.is_fifa_member)

  async function handleSubmit() {
    if (!form.name || !form.nationality_1 || !form.submitter_email) {
      setError('Player name, primary nationality and your email are required.')
      return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          video_urls: videoUrls.filter(Boolean),
          submitting_for: submittingFor,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSubmitted(true)
    } catch (err: any) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-xl mx-auto px-4 py-20 text-center">
          <CheckCircle size={48} className="text-[#1D9E75] mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Profile submitted</h1>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Thanks! Our team will review the submission and get back to you at{' '}
            <span className="text-white/60">{form.submitter_email}</span>.
            Approved profiles go live within a few days.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-7">
          <div className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] mb-3">
            Free to submit
          </div>
          <h1 className="text-2xl font-semibold mb-1">Submit a player profile</h1>
          <p className="text-white/40 text-sm">
            Are you (or do you know) a player with dual heritage? Get discovered by scouts from nations they qualify for.
          </p>
        </div>

        {/* Submitting for self or someone else */}
        <div className="mb-6">
          <p className="text-xs text-white/35 mb-2">Who are you submitting for?</p>
          <div className="flex gap-2">
            {(['self','other'] as const).map(opt => (
              <button key={opt} onClick={() => setSubmittingFor(opt)}
                className={`flex-1 text-sm py-2.5 rounded-lg border transition-colors ${
                  submittingFor === opt
                    ? 'border-[#1D9E75]/40 bg-[#1D9E75]/8 text-[#1D9E75]'
                    : 'border-white/10 text-white/40 hover:border-white/20'
                }`}>
                {opt === 'self' ? 'Myself (I\'m the player)' : 'Someone else'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Player info */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
            <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Player details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" required>
                <input className={inputClass} placeholder="Player's full name"
                  onChange={e => set('name', e.target.value)} />
              </Field>
              <Field label="Year of birth">
                <input className={inputClass} placeholder="e.g. 2001" maxLength={4}
                  onChange={e => set('date_of_birth', e.target.value ? `${e.target.value}-01-01` : '')} />
              </Field>
              <Field label="Current club">
                <input className={inputClass} placeholder="Club name"
                  onChange={e => set('current_club', e.target.value)} />
              </Field>
              <Field label="Club country">
                <input className={inputClass} list="territories-all" placeholder="e.g. England"
                  onChange={e => set('current_club_country', e.target.value)} />
              </Field>
            </div>
            <Field label="Position">
              <select className={inputClass} onChange={e => set('position', e.target.value)}>
                <option value="">Select position…</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          {/* Nationalities */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-2">
              <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium flex-1">Nationalities</h2>
              <div className="flex items-center gap-1 text-[10px] text-white/20">
                <Info size={10} /> includes non-FIFA territories
              </div>
            </div>

            {(['nationality_1','nationality_2','nationality_3','nationality_4','nationality_5'] as const).map((key, i) => (
              <Field
                key={key}
                label={i === 0 ? 'Primary nationality' : `Nationality ${i + 1}`}
                required={i === 0}
                hint={i === 0 ? 'the nation they primarily identify with' : undefined}
              >
                <input
                  className={inputClass}
                  list="territories-all"
                  placeholder={i === 0 ? 'Start typing…' : 'Optional — start typing…'}
                  onChange={e => set(key, e.target.value)}
                />
              </Field>
            ))}

            {/* Datalist for all territories incl non-FIFA */}
            <datalist id="territories-all">
              <optgroup label="FIFA member nations">
                {fifaTerritories.map(t => <option key={t.name} value={t.name} />)}
              </optgroup>
              <optgroup label="Non-FIFA territories">
                {nonFifaTerritories.map(t => <option key={t.name} value={t.name} />)}
              </optgroup>
            </datalist>

            <p className="text-[11px] text-white/20">
              Includes non-FIFA territories such as Greenland, Marshall Islands, Kiribati and more.
              Start typing to search.
            </p>
          </div>

          {/* Social */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
            <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Social & media</h2>
            <Field label="Instagram URL">
              <input className={inputClass} placeholder="https://instagram.com/handle"
                onChange={e => set('instagram_url', e.target.value)} />
            </Field>
            <Field label="Transfermarkt profile URL" hint="optional but helpful">
              <input className={inputClass} placeholder="https://www.transfermarkt.com/..."
                onChange={e => set('transfermarkt_url', e.target.value)} />
            </Field>

            {/* Video clips */}
            <div>
              <label className="block text-xs text-white/35 mb-1.5">Video highlight clips</label>
              <div className="space-y-2">
                {videoUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={`${inputClass} flex-1`} value={url}
                      placeholder="https://youtube.com/..."
                      onChange={e => { const v = [...videoUrls]; v[i] = e.target.value; setVideoUrls(v) }} />
                    {videoUrls.length > 1 && (
                      <button onClick={() => setVideoUrls(v => v.filter((_, j) => j !== i))}
                        className="text-white/20 hover:text-white/60"><X size={14} /></button>
                    )}
                  </div>
                ))}
                {videoUrls.length < 5 && (
                  <button onClick={() => setVideoUrls(v => [...v, ''])}
                    className="flex items-center gap-1 text-xs text-white/25 hover:text-[#1D9E75] transition-colors">
                    <Plus size={11} /> Add another clip
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <Field label="Short bio or heritage story" hint="optional">
            <textarea className={`${inputClass} h-24 resize-none`}
              placeholder="A brief note about the player's heritage, career highlights, or anything you'd like scouts to know…"
              onChange={e => set('description', e.target.value)} />
          </Field>

          {/* Submitter info */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-3">
            <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">
              {submittingFor === 'self' ? 'Your contact details' : 'Your details (as the person submitting)'}
            </h2>
            {submittingFor === 'other' && (
              <Field label="Your name">
                <input className={inputClass} placeholder="Your full name"
                  onChange={e => set('submitter_name', e.target.value)} />
              </Field>
            )}
            <Field label={submittingFor === 'self' ? 'Your email' : 'Your email address'} required>
              <input type="email" className={inputClass}
                placeholder="So we can follow up with you"
                onChange={e => set('submitter_email', e.target.value)} />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-[#1D9E75] text-black font-medium text-sm py-3 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
          <p className="text-[11px] text-white/20 text-center pb-4">
            All submissions are reviewed by the FutLegionnaires team before going live.
          </p>
        </div>
      </main>
    </div>
  )
}
