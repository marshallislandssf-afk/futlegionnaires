'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import type { UserRole } from '@/lib/auth'

interface Submission {
  id: string
  created_at: string
  status: string
  name: string
  date_of_birth?: string
  position?: string
  current_club?: string
  current_club_country?: string
  nationality_1: string
  nationality_2?: string
  nationality_3?: string
  nationality_4?: string
  nationality_5?: string
  instagram_url?: string
  transfermarkt_url?: string
  video_urls?: string[]
  description?: string
  submitter_email: string
}

function NatBadge({ nat, primary }: { nat: string; primary?: boolean }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
      primary ? 'bg-[#1D9E75]/15 text-[#1D9E75]' : 'bg-white/5 text-white/40'
    }`}>{nat}</span>
  )
}

function SubmissionCard({ sub, onAction }: {
  sub: Submission
  onAction: (id: string, action: 'approve' | 'reject', notes?: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const nats = [sub.nationality_1, sub.nationality_2, sub.nationality_3,
    sub.nationality_4, sub.nationality_5].filter(Boolean) as string[]

  async function act(action: 'approve' | 'reject') {
    setLoading(true)
    await onAction(sub.id, action, notes)
    setLoading(false)
  }

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{sub.name}</span>
            {sub.position && (
              <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/30 rounded">{sub.position}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {nats.map((n, i) => <NatBadge key={n} nat={n} primary={i === 0} />)}
            {sub.current_club && (
              <span className="text-[11px] text-white/25">{sub.current_club}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-white/25 mb-1">
            {new Date(sub.created_at).toLocaleDateString('en-GB')}
          </p>
          {expanded ? <ChevronUp size={14} className="text-white/25 ml-auto" />
                    : <ChevronDown size={14} className="text-white/25 ml-auto" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { l: 'Date of birth', v: sub.date_of_birth },
              { l: 'Club country', v: sub.current_club_country },
              { l: 'Instagram', v: sub.instagram_url },
              { l: 'Transfermarkt', v: sub.transfermarkt_url },
              { l: 'Submitter email', v: sub.submitter_email },
            ].filter(f => f.v).map(({ l, v }) => (
              <div key={l}>
                <p className="text-white/25 mb-0.5">{l}</p>
                <p className="text-white/60 truncate">{v}</p>
              </div>
            ))}
          </div>

          {sub.video_urls?.length ? (
            <div>
              <p className="text-xs text-white/25 mb-1">Videos</p>
              {sub.video_urls.map(u => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                  className="block text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] truncate">{u}</a>
              ))}
            </div>
          ) : null}

          {sub.description && (
            <div>
              <p className="text-xs text-white/25 mb-1">Notes from submitter</p>
              <p className="text-xs text-white/50">{sub.description}</p>
            </div>
          )}

          {/* Reviewer notes + actions */}
          {sub.status === 'pending' && (
            <div className="border-t border-white/5 pt-3 space-y-3">
              <div>
                <label className="block text-xs text-white/25 mb-1.5">Reviewer notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Reason for rejection, or notes on approval…"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#1D9E75]/40 resize-none h-20"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => act('approve')} disabled={loading}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/25 rounded-lg hover:bg-[#1D9E75]/25 disabled:opacity-50 transition-colors">
                  <CheckCircle size={14} /> Approve & add player
                </button>
                <button onClick={() => act('reject')} disabled={loading}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          )}

          {sub.status !== 'pending' && (
            <p className={`text-xs font-medium ${sub.status === 'approved' ? 'text-[#1D9E75]' : 'text-red-400'}`}>
              {sub.status === 'approved' ? '✓ Approved and added to player database' : '✗ Rejected'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function SubmissionReviewClient({
  submissions,
  userRole,
}: {
  submissions: Submission[]
  userRole: UserRole
}) {
  const [items, setItems] = useState(submissions)

  async function handleAction(id: string, action: 'approve' | 'reject', notes?: string) {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reviewer_notes: notes }),
    })
    if (res.ok) {
      setItems(prev => prev.filter(s => s.id !== id))
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-white/20 text-sm">
        No submissions in this category.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(sub => (
        <SubmissionCard key={sub.id} sub={sub} onAction={handleAction} />
      ))}
    </div>
  )
}
