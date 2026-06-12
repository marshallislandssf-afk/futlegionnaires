'use client'

import { useState, useCallback, useRef } from 'react'
import { Nav } from '@/components/layout/Nav'
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Download, Eye, Info, ChevronDown, ChevronUp,
  Plus, Minus, ArrowRight
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type MergeStrategy = 'fill_gaps' | 'overwrite' | 'nationality_only'

interface DiffRow {
  name: string
  slug: string
  status: 'new' | 'updated' | 'unchanged'
  changes: Record<string, { from: unknown; to: unknown }>
}

interface ImportResult {
  dry_run?: boolean
  strategy?: string
  total_rows?: number
  mapped_players?: number
  new_players?: number
  updated_players?: number
  unchanged_players?: number
  skipped_no_changes?: number
  column_map?: Record<string, string>
  diff?: DiffRow[]
  preview?: Record<string, unknown>[]
  upserted?: number
  errors?: string[]
  error?: string
  detected_headers?: string[]
}

// ─── Strategy descriptions ────────────────────────────────────────────────────
const STRATEGIES: { value: MergeStrategy; label: string; description: string }[] = [
  {
    value: 'fill_gaps',
    label: 'Fill gaps only',
    description: 'Adds data to blank fields only. Never overwrites existing values. Safe for all batches — upload 4 countries then 5 more and nothing from the first upload is touched.',
  },
  {
    value: 'overwrite',
    label: 'Overwrite all',
    description: 'Replaces every field present in the new file, even if a value already exists. Use when your new file has fresher data (e.g. a player moved clubs).',
  },
  {
    value: 'nationality_only',
    label: 'Nationalities only',
    description: 'Only merges the nationality fields (1–5). Everything else — club, Instagram, position — is left completely untouched. Best for nationality-focused batch uploads.',
  },
]

// ─── Column reference ─────────────────────────────────────────────────────────
const COLUMNS = [
  { col: 'Player Name', required: true },
  { col: 'Primary Role', required: false },
  { col: 'Current Club', required: false },
  { col: 'Club Location Country', required: false },
  { col: 'Year of Birth', required: false },
  { col: 'Instagram Link', required: false },
  { col: 'Transfermarkt Link', required: false },
  { col: 'Notes', required: false },
  { col: 'Secondary Nation', required: false },
  { col: 'Tertiary Nation', required: false },
  { col: 'Fourth Nation', required: false },
  { col: 'Fifth Nation', required: false },
]

// ─── Small components ─────────────────────────────────────────────────────────
function StatusPill({ status }: { status: DiffRow['status'] }) {
  const styles = {
    new:       'bg-[#1D9E75]/15 text-[#1D9E75]',
    updated:   'bg-amber-500/15 text-amber-400',
    unchanged: 'bg-white/5 text-white/25',
  }
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}

function SummaryCard({ value, label, colour }: { value: number; label: string; colour: string }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3 text-center">
      <div className={`text-2xl font-semibold ${colour}`}>{value}</div>
      <div className="text-[11px] text-white/30 mt-0.5">{label}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [adminSecret, setAdminSecret] = useState('')
  const [batchLabel, setBatchLabel] = useState('')
  const [strategy, setStrategy] = useState<MergeStrategy>('fill_gaps')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f); setPreviewResult(null); setImportResult(null)
    setError(null); setStep('upload')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [])

  async function sendRequest(dryRun: boolean) {
    if (!file) { setError('Select a file first.'); return }
    if (!adminSecret) { setError('Admin secret required.'); return }
    setLoading(true); setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('dry_run', String(dryRun))
    form.append('merge_strategy', strategy)
    form.append('batch_label', batchLabel || file.name)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'x-admin-secret': adminSecret },
        body: form,
      })
      const data: ImportResult = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Upload failed')
      } else if (dryRun) {
        setPreviewResult(data); setStep('preview')
      } else {
        setImportResult(data); setStep('done')
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  function toggleRow(slug: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  function reset() {
    setFile(null); setPreviewResult(null); setImportResult(null)
    setError(null); setStep('upload'); setBatchLabel('')
  }

  const diff = previewResult?.diff ?? []
  const visibleDiff = showAll ? diff : diff.slice(0, 20)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 mb-3">
            Admin only
          </div>
          <h1 className="text-2xl font-semibold mb-1">Batch import</h1>
          <p className="text-white/40 text-sm">
            Upload multiple spreadsheets — each batch merges safely into the existing database.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs">
          {(['upload','preview','done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-[11px] ${
                step === s ? 'bg-[#1D9E75] text-black' :
                ['upload','preview','done'].indexOf(step) > i ? 'bg-[#1D9E75]/20 text-[#1D9E75]' :
                'bg-white/5 text-white/20'
              }`}>{i + 1}</div>
              <span className={step === s ? 'text-white/70' : 'text-white/25'}>
                {s === 'upload' ? 'Configure' : s === 'preview' ? 'Preview diff' : 'Complete'}
              </span>
              {i < 2 && <ArrowRight size={12} className="text-white/15" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Upload & configure ── */}
        {step === 'upload' && (
          <>
            {/* Merge strategy */}
            <div className="mb-5">
              <label className="block text-xs text-white/40 mb-2">Merge strategy</label>
              <div className="space-y-2">
                {STRATEGIES.map(s => (
                  <label
                    key={s.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      strategy === s.value
                        ? 'border-[#1D9E75]/40 bg-[#1D9E75]/5'
                        : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      strategy === s.value ? 'border-[#1D9E75]' : 'border-white/20'
                    }`}>
                      {strategy === s.value && <div className="w-2 h-2 rounded-full bg-[#1D9E75]" />}
                    </div>
                    <div>
                      <input type="radio" className="sr-only" checked={strategy === s.value}
                        onChange={() => setStrategy(s.value)} />
                      <p className="text-sm font-medium mb-0.5">{s.label}</p>
                      <p className="text-xs text-white/35">{s.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Batch label */}
            <div className="mb-5">
              <label className="block text-xs text-white/40 mb-1.5">
                Batch label <span className="text-white/20">(optional — helps identify this upload later)</span>
              </label>
              <input
                type="text"
                value={batchLabel}
                onChange={e => setBatchLabel(e.target.value)}
                placeholder='e.g. "UEFA nations batch 1" or "CAF upload May 2025"'
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#1D9E75]/50"
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-5 ${
                dragging ? 'border-[#1D9E75]/60 bg-[#1D9E75]/5' :
                file ? 'border-[#1D9E75]/30 bg-[#1D9E75]/5' :
                'border-white/10 hover:border-white/20'
              }`}
            >
              <input ref={inputRef} type="file" accept=".csv,.tsv" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={28} className="text-[#1D9E75]" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-white/30">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={28} className="text-white/20" />
                  <p className="text-sm text-white/40">Drop your CSV here</p>
                  <p className="text-xs text-white/20">or click to browse · .csv and .tsv supported</p>
                </div>
              )}
            </div>

            {/* Admin secret */}
            <div className="mb-5">
              <label className="block text-xs text-white/40 mb-1.5">Admin secret <span className="text-amber-400">*</span></label>
              <input type="password" value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                placeholder="ADMIN_SECRET from your Vercel env vars"
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/40" />
            </div>

            {/* Column reference */}
            <details className="mb-5 group">
              <summary className="flex items-center gap-2 text-xs text-white/30 cursor-pointer hover:text-white/50 list-none">
                <Info size={12} /> Expected column names
                <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-4">
                {COLUMNS.map(({ col, required }) => (
                  <div key={col} className="flex items-center gap-1.5 text-xs text-white/40">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${required ? 'bg-[#1D9E75]' : 'bg-white/15'}`} />
                    {col}{required && <span className="text-[#1D9E75]">*</span>}
                  </div>
                ))}
              </div>
              <a href="/api/admin/template" className="inline-flex items-center gap-1.5 mt-3 ml-4 text-xs text-[#1D9E75]/60 hover:text-[#1D9E75] transition-colors">
                <Download size={11} /> Download template CSV
              </a>
            </details>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-5 text-sm text-red-400">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            <button onClick={() => sendRequest(true)} disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm border border-white/15 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Eye size={15} />
              {loading ? 'Analysing…' : 'Preview what will change →'}
            </button>
          </>
        )}

        {/* ── STEP 2: Preview diff ── */}
        {step === 'preview' && previewResult && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium">What this upload will do</h2>
              <button onClick={() => setStep('upload')} className="text-xs text-white/30 hover:text-white/60">
                ← Change settings
              </button>
            </div>

            {/* Summary counts */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <SummaryCard value={previewResult.total_rows ?? 0}    label="rows in file"  colour="text-white/60" />
              <SummaryCard value={previewResult.new_players ?? 0}    label="new players"   colour="text-[#1D9E75]" />
              <SummaryCard value={previewResult.updated_players ?? 0} label="will update"  colour="text-amber-400" />
              <SummaryCard value={previewResult.unchanged_players ?? 0} label="no change"  colour="text-white/25" />
            </div>

            {/* Strategy + column map */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 mb-5 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/30">Strategy:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-medium">
                  {STRATEGIES.find(s => s.value === previewResult.strategy)?.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1.5">Columns detected</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(previewResult.column_map ?? {}).map(([field, header]) => (
                    <div key={field} className="text-[11px] text-white/40">
                      <span className="text-white/20">{field}</span>
                      <span className="text-white/15 mx-1">←</span>
                      <span className="text-[#1D9E75]/60">"{header}"</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Per-player diff */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40">Player-by-player breakdown</p>
                <span className="text-[11px] text-white/25">{diff.length} players</span>
              </div>
              <div className="space-y-1.5">
                {visibleDiff.map(row => (
                  <div key={row.slug} className="bg-white/[0.03] border border-white/8 rounded-lg overflow-hidden">
                    <button
                      onClick={() => row.change_count > 0 && toggleRow(row.slug)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span className="text-sm flex-1 truncate font-medium">{row.name}</span>
                      <StatusPill status={row.status} />
                      {row.status !== 'unchanged' && (
                        <span className="text-[11px] text-white/25">
                          {Object.keys(row.changes).length} field{Object.keys(row.changes).length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {Object.keys(row.changes).length > 0 && (
                        expandedRows.has(row.slug)
                          ? <ChevronUp size={12} className="text-white/20 flex-shrink-0" />
                          : <ChevronDown size={12} className="text-white/20 flex-shrink-0" />
                      )}
                    </button>
                    {expandedRows.has(row.slug) && Object.keys(row.changes).length > 0 && (
                      <div className="border-t border-white/5 px-3 py-2 space-y-1">
                        {Object.entries(row.changes).map(([field, { from, to }]) => (
                          <div key={field} className="flex items-start gap-2 text-[11px]">
                            <span className="text-white/25 w-32 shrink-0">{field}</span>
                            {from !== null && from !== '' && (
                              <>
                                <span className="text-red-400/60 flex items-center gap-1">
                                  <Minus size={10} />{String(from)}
                                </span>
                                <ArrowRight size={9} className="text-white/15 mt-0.5 shrink-0" />
                              </>
                            )}
                            <span className="text-[#1D9E75]/70 flex items-center gap-1">
                              <Plus size={10} />{String(to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {diff.length > 20 && (
                <button onClick={() => setShowAll(v => !v)}
                  className="mt-2 text-xs text-white/30 hover:text-white/60 w-full text-center py-2">
                  {showAll ? 'Show less' : `Show all ${diff.length} players`}
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-sm text-red-400">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('upload')}
                className="px-4 py-2.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                Back
              </button>
              <button onClick={() => sendRequest(false)} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm bg-[#1D9E75] text-black font-medium rounded-lg hover:bg-[#0F6E56] disabled:opacity-50 transition-colors">
                <Upload size={15} />
                {loading ? 'Importing…' : `Confirm — import ${(previewResult.new_players ?? 0) + (previewResult.updated_players ?? 0)} records`}
              </button>
            </div>
            <p className="text-[11px] text-white/20 text-center mt-2">
              {previewResult.unchanged_players ?? 0} unchanged records will be skipped.
            </p>
          </>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 'done' && importResult && (
          <div>
            <div className="bg-[#1D9E75]/8 border border-[#1D9E75]/25 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} className="text-[#1D9E75]" />
                <h2 className="text-sm font-medium text-[#1D9E75]">Import complete</h2>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <SummaryCard value={importResult.new_players ?? 0}      label="new players added"   colour="text-[#1D9E75]" />
                <SummaryCard value={importResult.updated_players ?? 0}   label="records updated"     colour="text-amber-400" />
                <SummaryCard value={importResult.unchanged_players ?? 0} label="skipped (no change)" colour="text-white/25" />
              </div>
              {importResult.errors?.map(e => (
                <p key={e} className="text-xs text-red-400 mt-1">{e}</p>
              ))}
              <p className="text-xs text-white/35 mt-3">
                This batch has been logged. The nightly SportsDB cron will enrich any new players with profile images overnight.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 py-2.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                Upload another batch
              </button>
              <a href="/players"
                className="flex-1 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/8 transition-colors text-center">
                View players →
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
