/**
 * POST /api/admin/import
 *
 * Accepts a CSV file upload, parses it, and upserts players to Supabase.
 *
 * Merge behaviour (controlled by merge_strategy form field):
 *   "fill_gaps"   — only write fields that are blank in the existing record (DEFAULT)
 *                   Safe for batches: e.g. upload 2 adds nationality_3 without
 *                   touching club/instagram set by upload 1.
 *   "overwrite"   — always overwrite every field present in the new file.
 *                   Use when you know the new file has fresher data.
 *   "nationality_only" — only merge nationality_1..5 fields, leave everything else.
 *                   Useful for nationality-focused batches.
 *
 * dry_run=true returns a full diff (what would change per player) without writing.
 *
 * Protected by ADMIN_SECRET header.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/players'
import { getConfederation } from '@/lib/sportsdb'

type MergeStrategy = 'fill_gaps' | 'overwrite' | 'nationality_only'

function isAuthorised(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

// ─── Column aliases ───────────────────────────────────────────────────────────
const COLUMN_ALIASES: Record<string, string[]> = {
  name:                 ['player name', 'name', 'full name', 'player'],
  position:             ['primary role', 'role', 'position', 'pos'],
  current_club:         ['current club', 'club', 'team'],
  current_club_country: ['club location country', 'club country', 'country', 'club location'],
  year_of_birth:        ['year of birth', 'birth year', 'yob', 'born'],
  instagram_url:        ['instagram link', 'instagram', 'ig link', 'instagram url'],
  transfermarkt_url:    ['transfermarkt link', 'transfermarkt', 'tm link', 'transfermarkt url'],
  notes:                ['notes', 'note', 'comments'],
  nationality_1:        ['primary nation', 'nation 1', 'nationality', 'primary nationality', 'nat 1'],
  nationality_2:        ['secondary nation', 'nation 2', 'secondary nationality', 'nat 2'],
  nationality_3:        ['tertiary nation', 'nation 3', 'tertiary nationality', 'nat 3'],
  nationality_4:        ['fourth nation', 'nation 4', 'fourth nationality', 'nat 4'],
  nationality_5:        ['fifth nation', 'nation 5', 'fifth nationality', 'nat 5'],
}

const NATIONALITY_FIELDS = ['nationality_1','nationality_2','nationality_3','nationality_4','nationality_5']

const POSITION_MAP: Record<string, string> = {
  'gk':'Goalkeeper','goalkeeper':'Goalkeeper','keeper':'Goalkeeper',
  'cb':'Centre-Back','centre-back':'Centre-Back','center-back':'Centre-Back',
  'rb':'Right-Back','right-back':'Right-Back','right back':'Right-Back',
  'lb':'Left-Back','left-back':'Left-Back','left back':'Left-Back',
  'dm':'Defensive Midfielder','cdm':'Defensive Midfielder','defensive mid':'Defensive Midfielder',
  'cm':'Central Midfielder','midfielder':'Central Midfielder','central mid':'Central Midfielder',
  'am':'Attacking Midfielder','cam':'Attacking Midfielder','attacking mid':'Attacking Midfielder',
  'rw':'Right Winger','right winger':'Right Winger','right wing':'Right Winger',
  'lw':'Left Winger','left winger':'Left Winger','left wing':'Left Winger',
  'st':'Centre-Forward','cf':'Centre-Forward','striker':'Centre-Forward',
  'forward':'Centre-Forward','centre-forward':'Centre-Forward','winger':'Right Winger',
}

function buildColumnMap(headers: string[]) {
  const map: Record<string,string> = {}
  const lower = headers.map(h => h.toLowerCase().trim())
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = lower.indexOf(alias)
      if (idx !== -1) { map[field] = headers[idx]; break }
    }
  }
  return map
}

function getVal(row: Record<string,string>, colMap: Record<string,string>, field: string) {
  const h = colMap[field]; if (!h) return ''
  return (row[h] ?? '').toString().trim()
}

function normaliseInstagram(raw: string): string | undefined {
  if (!raw) return undefined
  if (raw.startsWith('http')) return raw
  if (raw.startsWith('@')) return `https://instagram.com/${raw.slice(1)}`
  if (!raw.includes('/')) return `https://instagram.com/${raw}`
  return raw
}

function parseCSV(text: string): Record<string,string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  function parseLine(line: string) {
    const result: string[] = []; let cur = ''; let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { if (inQ && line[i+1]==='"') { cur+='"'; i++ } else inQ=!inQ }
      else if (ch === ',' && !inQ) { result.push(cur); cur='' }
      else cur += ch
    }
    result.push(cur); return result
  }
  const headers = parseLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseLine(line)
    const row: Record<string,string> = {}
    headers.forEach((h,i) => { row[h] = vals[i] ?? '' })
    return row
  })
}

function rowToPlayerFields(row: Record<string,string>, colMap: Record<string,string>) {
  const name = getVal(row, colMap, 'name'); if (!name) return null
  const yob = getVal(row, colMap, 'year_of_birth')
  const clubCountry = getVal(row, colMap, 'current_club_country')
  const rawPos = getVal(row, colMap, 'position')
  const rawIG = getVal(row, colMap, 'instagram_url')
  const fields: Record<string,unknown> = {
    slug: generateSlug(name), name,
    date_of_birth: yob ? `${yob}-01-01` : undefined,
    position: (POSITION_MAP[rawPos.toLowerCase()] ?? rawPos) || undefined,
    current_club: getVal(row, colMap, 'current_club') || undefined,
    current_club_country: clubCountry || undefined,
    current_club_confederation: clubCountry ? getConfederation(clubCountry) : undefined,
    nationality_1: getVal(row, colMap, 'nationality_1') || undefined,
    nationality_2: getVal(row, colMap, 'nationality_2') || undefined,
    nationality_3: getVal(row, colMap, 'nationality_3') || undefined,
    nationality_4: getVal(row, colMap, 'nationality_4') || undefined,
    nationality_5: getVal(row, colMap, 'nationality_5') || undefined,
    instagram_url: normaliseInstagram(rawIG),
    transfermarkt_url: getVal(row, colMap, 'transfermarkt_url') || undefined,
    description: getVal(row, colMap, 'notes') || undefined,
  }
  // Drop undefined so we can diff cleanly
  Object.keys(fields).forEach(k => fields[k] === undefined && delete fields[k])
  return fields
}

// ─── Merge: apply strategy to produce the final record ───────────────────────
function applyMerge(
  existing: Record<string,unknown> | null,
  incoming: Record<string,unknown>,
  strategy: MergeStrategy
): { merged: Record<string,unknown>; changes: Record<string,{from:unknown;to:unknown}> } {
  const merged: Record<string,unknown> = { ...(existing ?? {}) }
  const changes: Record<string,{from:unknown;to:unknown}> = {}

  const fieldsToConsider = strategy === 'nationality_only'
    ? [...NATIONALITY_FIELDS, 'name', 'slug']
    : Object.keys(incoming)

  for (const key of fieldsToConsider) {
    if (!(key in incoming)) continue
    const newVal = incoming[key]
    const oldVal = existing?.[key]

    if (strategy === 'fill_gaps') {
      // Only write if the existing value is blank / null / undefined
      if (oldVal === null || oldVal === undefined || oldVal === '') {
        if (newVal !== undefined && newVal !== '') {
          merged[key] = newVal
          changes[key] = { from: oldVal ?? null, to: newVal }
        }
      }
    } else {
      // overwrite or nationality_only — always apply non-empty incoming values
      if (newVal !== undefined && newVal !== '') {
        if (newVal !== oldVal) {
          merged[key] = newVal
          changes[key] = { from: oldVal ?? null, to: newVal }
        }
      }
    }
  }

  // Always set these on new records
  if (!existing) {
    merged.is_verified = false
    merged.is_self_submitted = false
    merged.is_active = true
    merged.status = 'Active'
  }

  return { merged, changes }
}

export async function POST(request: NextRequest) {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const dryRun = formData.get('dry_run') === 'true'
  const strategy = (formData.get('merge_strategy') as MergeStrategy) ?? 'fill_gaps'
  const batchLabel = (formData.get('batch_label') as string) ?? ''

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json({ error: 'Only .csv supported via browser. Use the CLI for .xlsx' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (!rows.length) return NextResponse.json({ error: 'No data rows found' }, { status: 400 })

  const headers = Object.keys(rows[0])
  const colMap = buildColumnMap(headers)
  if (!colMap.name) {
    return NextResponse.json({ error: 'Could not find a player name column', detected_headers: headers }, { status: 400 })
  }

  // Parse all rows into incoming player field maps
  const incoming = rows.map(r => rowToPlayerFields(r, colMap)).filter(Boolean) as Record<string,unknown>[]
  const slugs = incoming.map(p => p.slug as string)

  // Fetch existing records for these slugs in one query
  const supabase = createServerSupabaseClient()
  const { data: existingRows } = await supabase
    .from('players').select('*').in('slug', slugs)
  const existingMap = Object.fromEntries((existingRows ?? []).map((r: any) => [r.slug, r]))

  // Build diff for every player
  const diffResults = incoming.map(fields => {
    const slug = fields.slug as string
    const existing = existingMap[slug] ?? null
    const { merged, changes } = applyMerge(existing, fields, strategy)
    return {
      slug,
      name: fields.name as string,
      is_new: !existing,
      change_count: Object.keys(changes).length,
      changes,
      merged,
    }
  })

  const newCount = diffResults.filter(r => r.is_new).length
  const updatedCount = diffResults.filter(r => !r.is_new && r.change_count > 0).length
  const unchangedCount = diffResults.filter(r => !r.is_new && r.change_count === 0).length

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      strategy,
      batch_label: batchLabel,
      total_rows: rows.length,
      mapped_players: incoming.length,
      new_players: newCount,
      updated_players: updatedCount,
      unchanged_players: unchangedCount,
      column_map: colMap,
      diff: diffResults.map(r => ({
        name: r.name, slug: r.slug,
        status: r.is_new ? 'new' : r.change_count > 0 ? 'updated' : 'unchanged',
        changes: r.changes,
      })),
      preview: diffResults.slice(0, 5).map(r => r.merged),
    })
  }

  // Only upsert records that have actual changes (or are new)
  const toWrite = diffResults.filter(r => r.is_new || r.change_count > 0).map(r => r.merged)

  let upserted = 0
  const errors: string[] = []
  const BATCH = 50

  for (let i = 0; i < toWrite.length; i += BATCH) {
    const batch = toWrite.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('players')
      .upsert(batch, { onConflict: 'slug' })
      .select('id')
    if (error) errors.push(`Batch ${Math.floor(i/BATCH)+1}: ${error.message}`)
    else upserted += data?.length ?? batch.length
  }

  // Log this import batch to the import_log table (best-effort)
  await supabase.from('import_log').insert({
    batch_label: batchLabel || file.name,
    strategy,
    file_name: file.name,
    rows_in_file: rows.length,
    new_players: newCount,
    updated_players: updatedCount,
    unchanged_players: unchangedCount,
    errors: errors.length ? errors : null,
  }).then(() => {}).catch(() => {})

  return NextResponse.json({
    success: true,
    strategy,
    upserted,
    new_players: newCount,
    updated_players: updatedCount,
    unchanged_players: unchangedCount,
    skipped_no_changes: unchangedCount,
    errors: errors.length ? errors : undefined,
  })
}
