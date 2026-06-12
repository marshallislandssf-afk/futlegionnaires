'use client'

import { useState } from 'react'
import { CheckCircle, Save, AlertCircle, Plus, X } from 'lucide-react'
import type { Player } from '@/types'
import type { UserRole } from '@/lib/auth'

const POSITIONS = [
  'Goalkeeper','Centre-Back','Right-Back','Left-Back',
  'Defensive Midfielder','Central Midfielder','Attacking Midfielder',
  'Right Winger','Left Winger','Second Striker','Centre-Forward',
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/35 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50 transition-colors"

export function PlayerEditForm({
  player,
  territories,
  userRole,
}: {
  player: Player
  territories: string[]
  userRole: UserRole
}) {
  const [form, setForm] = useState({ ...player })
  const [videoUrls, setVideoUrls] = useState<string[]>(player.video_urls ?? [''])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof Player, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch(`/api/admin/players/${player.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, video_urls: videoUrls.filter(Boolean) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
        <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Basic info</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name">
            <input className={inputClass} value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Date of birth">
            <input type="date" className={inputClass} value={form.date_of_birth ?? ''}
              onChange={e => set('date_of_birth', e.target.value)} />
          </Field>
          <Field label="Position">
            <select className={inputClass} value={form.position ?? ''}
              onChange={e => set('position', e.target.value)}>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status ?? 'Active'}
              onChange={e => set('status', e.target.value)}>
              <option>Active</option>
              <option>Free Agent</option>
              <option>Retired</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Club */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
        <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Current club</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Club name">
            <input className={inputClass} value={form.current_club ?? ''}
              onChange={e => set('current_club', e.target.value)} />
          </Field>
          <Field label="Club country">
            <input className={inputClass} value={form.current_club_country ?? ''}
              onChange={e => set('current_club_country', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Nationalities */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-3">
        <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Nationalities</h2>
        {(['nationality_1','nationality_2','nationality_3','nationality_4','nationality_5'] as const).map((key, i) => (
          <Field key={key} label={i === 0 ? 'Primary nationality' : `Nationality ${i + 1}`}>
            <input
              className={inputClass}
              list="territories-list"
              value={(form[key] as string) ?? ''}
              placeholder={i > 0 ? 'Optional' : ''}
              onChange={e => set(key, e.target.value)}
            />
          </Field>
        ))}
        <datalist id="territories-list">
          {territories.map(t => <option key={t} value={t} />)}
        </datalist>
        <p className="text-[11px] text-white/20">Start typing to see all territories including non-FIFA</p>
      </div>

      {/* Social / media */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
        <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Social & media</h2>
        <Field label="Instagram URL">
          <input className={inputClass} value={form.instagram_url ?? ''}
            placeholder="https://instagram.com/handle"
            onChange={e => set('instagram_url', e.target.value)} />
        </Field>
        <Field label="Transfermarkt URL">
          <input className={inputClass} value={form.transfermarkt_url ?? ''}
            placeholder="https://transfermarkt.com/..."
            onChange={e => set('transfermarkt_url', e.target.value)} />
        </Field>
        <Field label="Profile image URL">
          <input className={inputClass} value={form.profile_image_url ?? ''}
            placeholder="https://..."
            onChange={e => set('profile_image_url', e.target.value)} />
        </Field>
        <div>
          <label className="block text-xs text-white/35 mb-1.5">Video highlight URLs</label>
          <div className="space-y-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputClass} flex-1`} value={url} placeholder="https://youtube.com/..."
                  onChange={e => { const v = [...videoUrls]; v[i] = e.target.value; setVideoUrls(v) }} />
                {videoUrls.length > 1 && (
                  <button onClick={() => setVideoUrls(v => v.filter((_, j) => j !== i))}
                    className="text-white/25 hover:text-white/60"><X size={14} /></button>
                )}
              </div>
            ))}
            {videoUrls.length < 8 && (
              <button onClick={() => setVideoUrls(v => [...v, ''])}
                className="flex items-center gap-1 text-xs text-white/25 hover:text-[#1D9E75] transition-colors">
                <Plus size={11} /> Add video
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
        <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">Bio / description</h2>
        <textarea className={`${inputClass} h-28 resize-none`} value={form.description ?? ''}
          onChange={e => set('description', e.target.value)} />
      </div>

      {/* Flags (super admin only) */}
      {userRole === 'super_admin' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-3">
          <h2 className="text-xs text-white/30 uppercase tracking-wider font-medium">Platform flags</h2>
          {[
            { key: 'is_verified' as const, label: 'Verified profile' },
            { key: 'is_active' as const, label: 'Active (visible publicly)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set(key, !form[key])}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  form[key] ? 'bg-[#1D9E75]' : 'bg-white/10'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  form[key] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <span className="text-sm text-white/60">{label}</span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-lg px-4 py-3 text-sm text-[#1D9E75]">
          <CheckCircle size={14} /> Saved successfully
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-[#1D9E75] text-black font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-[#0F6E56] disabled:opacity-50 transition-colors">
        <Save size={14} />
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
