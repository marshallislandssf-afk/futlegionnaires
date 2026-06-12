#!/usr/bin/env node
/**
 * FutLegionnaires — Spreadsheet import script
 *
 * Reads your CSV/TSV, maps columns to the Supabase schema,
 * enriches with TheSportsDB data where possible, then upserts.
 *
 * Usage:
 *   node scripts/import-players.mjs path/to/your-sheet.csv
 *   node scripts/import-players.mjs path/to/your-sheet.csv --dry-run
 *   node scripts/import-players.mjs path/to/your-sheet.csv --enrich
 *
 * Flags:
 *   --dry-run   Preview the mapped rows — don't write to Supabase
 *   --enrich    Also call TheSportsDB per player to fill profile image,
 *               bio, SportsDB ID (slower — one API call per player)
 *   --sheet     If your xlsx has multiple sheets, specify by name
 *
 * Supported formats: .csv  .tsv  .xlsx  .xls  .ods
 *
 * Requirements:
 *   npm install @supabase/supabase-js papaparse xlsx dotenv
 */

import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const filePath = args.find(a => !a.startsWith('--'))
const DRY_RUN = args.includes('--dry-run')
const ENRICH = args.includes('--enrich')
const SHEET_NAME = args.find(a => a.startsWith('--sheet='))?.split('=')[1]

if (!filePath) {
  console.error('Usage: node scripts/import-players.mjs <path-to-file> [--dry-run] [--enrich]')
  process.exit(1)
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role — can bypass RLS
)

const SPORTSDB_KEY = process.env.SPORTSDB_API_KEY

// ─── Column name aliases ──────────────────────────────────────────────────────
// Maps every reasonable variation of your spreadsheet header → our field name.
// Add more here if your sheet uses different names.
const COLUMN_ALIASES = {
  // Player name
  name:                    ['player name', 'name', 'full name', 'player', 'footballer'],
  position:                ['primary role', 'role', 'position', 'pos'],
  current_club:            ['current club', 'club', 'team'],
  current_club_country:    ['club location country', 'club country', 'country', 'league country', 'club location'],
  year_of_birth:           ['year of birth', 'birth year', 'yob', 'born'],
  instagram_url:           ['instagram link', 'instagram', 'ig', 'ig link', 'instagram url'],
  transfermarkt_url:       ['transfermarkt link', 'transfermarkt', 'tm link', 'tm url', 'transfermarkt url'],
  notes:                   ['notes', 'note', 'comments', 'comment', 'extra'],
  nationality_1:           ['primary nation', 'nation 1', 'nationality', 'primary nationality', 'nat 1'],
  nationality_2:           ['secondary nation', 'nation 2', 'secondary nationality', 'nat 2', 'second nationality'],
  nationality_3:           ['tertiary nation', 'nation 3', 'tertiary nationality', 'nat 3', 'third nationality'],
  nationality_4:           ['fourth nation', 'nation 4', 'fourth nationality', 'nat 4'],
  nationality_5:           ['fifth nation', 'nation 5', 'fifth nationality', 'nat 5'],
}

// ─── Position normaliser ──────────────────────────────────────────────────────
const POSITION_MAP = {
  'gk': 'Goalkeeper', 'goalkeeper': 'Goalkeeper', 'keeper': 'Goalkeeper',
  'cb': 'Centre-Back', 'centre-back': 'Centre-Back', 'center-back': 'Centre-Back', 'cb/rb': 'Centre-Back',
  'rb': 'Right-Back', 'right-back': 'Right-Back', 'right back': 'Right-Back',
  'lb': 'Left-Back', 'left-back': 'Left-Back', 'left back': 'Left-Back',
  'dm': 'Defensive Midfielder', 'cdm': 'Defensive Midfielder', 'defensive mid': 'Defensive Midfielder',
  'cm': 'Central Midfielder', 'central mid': 'Central Midfielder', 'midfielder': 'Central Midfielder',
  'am': 'Attacking Midfielder', 'cam': 'Attacking Midfielder', 'attacking mid': 'Attacking Midfielder',
  'rw': 'Right Winger', 'right winger': 'Right Winger', 'right wing': 'Right Winger',
  'lw': 'Left Winger', 'left winger': 'Left Winger', 'left wing': 'Left Winger',
  'ss': 'Second Striker', 'second striker': 'Second Striker',
  'st': 'Centre-Forward', 'cf': 'Centre-Forward', 'striker': 'Centre-Forward',
  'fw': 'Centre-Forward', 'forward': 'Centre-Forward', 'centre-forward': 'Centre-Forward',
  'center-forward': 'Centre-Forward',
  'winger': 'Right Winger',
}

// ─── Confederation lookup ─────────────────────────────────────────────────────
const CONF_MAP = {
  UEFA: ['england','scotland','wales','northern ireland','ireland','france','germany','spain','italy',
    'portugal','netherlands','belgium','turkey','russia','poland','sweden','norway','denmark',
    'switzerland','austria','greece','croatia','serbia','ukraine','czechia','hungary','romania',
    'bulgaria','slovakia','slovenia','albania','north macedonia','montenegro','bosnia','kosovo',
    'armenia','georgia','moldova','luxembourg','malta','cyprus','iceland','finland','estonia',
    'latvia','lithuania','andorra','liechtenstein','san marino','monaco','faroe islands','gibraltar'],
  CAF: ['nigeria','ghana','senegal','morocco','egypt','algeria','tunisia','ivory coast','cameroon',
    'mali','zambia','zimbabwe','kenya','ethiopia','tanzania','dr congo','congo','gabon','guinea',
    'cape verde','burkina faso','togo','benin','rwanda','uganda','equatorial guinea','liberia',
    'sierra leone','gambia','mozambique','angola','south africa','namibia','botswana','lesotho',
    'swaziland','eswatini','madagascar','mauritius','seychelles','comoros','djibouti','eritrea',
    'somalia','south sudan','sudan','chad','niger','central african republic','sao tome'],
  CONMEBOL: ['brazil','argentina','colombia','chile','uruguay','peru','ecuador','venezuela','bolivia','paraguay'],
  CONCACAF: ['united states','usa','mexico','canada','jamaica','haiti','trinidad and tobago','trinidad',
    'honduras','costa rica','el salvador','guatemala','panama','cuba','guadeloupe','martinique',
    'suriname','curacao','barbados','belize','nicaragua','dominican republic','puerto rico',
    'antigua','st kitts','grenada','dominica','st lucia','st vincent'],
  AFC: ['japan','south korea','korea','china','australia','iran','saudi arabia','qatar','uae',
    'united arab emirates','iraq','jordan','india','pakistan','philippines','indonesia',
    'vietnam','thailand','malaysia','singapore','uzbekistan','kazakhstan','kyrgyzstan',
    'tajikistan','turkmenistan','afghanistan','bangladesh','sri lanka','nepal','myanmar',
    'cambodia','laos','mongolia','north korea','bahrain','kuwait','oman','syria','lebanon',
    'palestine','yemen'],
  OFC: ['new zealand','papua new guinea','fiji','vanuatu','solomon islands','samoa',
    'tahiti','tonga','new caledonia','cook islands','american samoa'],
}

function getConfederation(country) {
  if (!country) return 'UEFA'
  const c = country.toLowerCase().trim()
  for (const [conf, countries] of Object.entries(CONF_MAP)) {
    if (countries.includes(c)) return conf
  }
  return 'UEFA' // Fallback
}

function normalisePosition(raw) {
  if (!raw) return 'Centre-Forward'
  const key = raw.toLowerCase().trim()
  return POSITION_MAP[key] ?? raw // Return as-is if not in map
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ─── Parse the file ───────────────────────────────────────────────────────────
function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const absolutePath = path.resolve(filePath)

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`)
    process.exit(1)
  }

  console.log(`\nReading ${ext} file: ${path.basename(filePath)}`)

  if (ext === '.csv' || ext === '.tsv') {
    const content = fs.readFileSync(absolutePath, 'utf8')
    const sep = ext === '.tsv' ? '\t' : ','
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      delimiter: sep,
    })
    if (result.errors.length) {
      console.warn('CSV parse warnings:', result.errors.slice(0, 3))
    }
    return result.data
  }

  if (['.xlsx', '.xls', '.ods'].includes(ext)) {
    const workbook = XLSX.readFile(absolutePath)
    const sheetName = SHEET_NAME ?? workbook.SheetNames[0]
    console.log(`Using sheet: "${sheetName}" (available: ${workbook.SheetNames.join(', ')})`)
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      console.error(`Sheet "${sheetName}" not found. Available: ${workbook.SheetNames.join(', ')}`)
      process.exit(1)
    }
    return XLSX.utils.sheet_to_json(sheet, { defval: '' })
  }

  console.error(`Unsupported file type: ${ext}. Supported: .csv .tsv .xlsx .xls .ods`)
  process.exit(1)
}

// ─── Map columns → our schema ─────────────────────────────────────────────────
function buildColumnMap(headers) {
  const map = {}
  const lowerHeaders = headers.map(h => h.toLowerCase().trim())

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = lowerHeaders.indexOf(alias.toLowerCase())
      if (idx !== -1) {
        map[field] = headers[idx] // Store the original cased header
        break
      }
    }
  }
  return map
}

function getVal(row, colMap, field) {
  const header = colMap[field]
  if (!header) return undefined
  const val = row[header]
  return typeof val === 'string' ? val.trim() : val
}

// ─── TheSportsDB enrichment (optional) ───────────────────────────────────────
async function enrichFromSportsDB(name) {
  if (!SPORTSDB_KEY) return {}
  try {
    const query = encodeURIComponent(name.replace(/\s+/g, '_'))
    const res = await fetch(`https://www.thesportsdb.com/api/v2/json/search/player/${query}`, {
      headers: { 'X-API-KEY': SPORTSDB_KEY }
    })
    if (!res.ok) return {}
    const data = await res.json()
    const p = data.players?.[0]
    if (!p) return {}

    let instagram_url
    if (p.strInstagram) {
      const handle = p.strInstagram.replace(/^.*instagram\.com\/?/, '').replace(/^@/, '').replace(/\/$/, '')
      instagram_url = handle ? `https://instagram.com/${handle}` : undefined
    }

    return {
      sportsdb_id: p.idPlayer,
      sportsdb_team_id: p.idTeam,
      profile_image_url: p.strThumb ?? undefined,
      cutout_image_url: p.strCutout ?? undefined,
      description: p.strDescriptionEN ?? undefined,
      instagram_url_sportsdb: instagram_url,
      transfermarkt_id: p.idTransferMkt ?? undefined,
    }
  } catch {
    return {}
  }
}

// ─── Main import ──────────────────────────────────────────────────────────────
async function main() {
  const rawRows = parseFile(filePath)
  console.log(`Found ${rawRows.length} rows`)

  if (rawRows.length === 0) {
    console.log('No data rows found.')
    process.exit(0)
  }

  // Build column map from the first row's keys (headers)
  const headers = Object.keys(rawRows[0])
  const colMap = buildColumnMap(headers)

  console.log('\nColumn mapping detected:')
  for (const [field, header] of Object.entries(colMap)) {
    console.log(`  ${field.padEnd(25)} ← "${header}"`)
  }

  const unmapped = Object.keys(COLUMN_ALIASES).filter(f => !colMap[f])
  if (unmapped.length) {
    console.log(`\nColumns NOT found in sheet (will be left blank): ${unmapped.join(', ')}`)
  }

  if (!colMap.name) {
    console.error('\nERROR: Could not find a "Player Name" column. Check your headers.')
    process.exit(1)
  }

  // Build player records
  const players = []
  const skipped = []

  for (const row of rawRows) {
    const name = getVal(row, colMap, 'name')
    if (!name) { skipped.push('(empty name)'); continue }

    const yob = getVal(row, colMap, 'year_of_birth')
    const dobFromYob = yob ? `${yob}-01-01` : null

    const clubCountry = getVal(row, colMap, 'current_club_country') ?? ''
    const rawInstagram = getVal(row, colMap, 'instagram_url') ?? ''
    const rawTm = getVal(row, colMap, 'transfermarkt_url') ?? ''

    // Normalise Instagram to a full URL
    let instagram_url = undefined
    if (rawInstagram) {
      if (rawInstagram.startsWith('http')) {
        instagram_url = rawInstagram
      } else if (rawInstagram.startsWith('@')) {
        instagram_url = `https://instagram.com/${rawInstagram.slice(1)}`
      } else if (!rawInstagram.includes('/')) {
        instagram_url = `https://instagram.com/${rawInstagram}`
      } else {
        instagram_url = rawInstagram
      }
    }

    const player = {
      slug: generateSlug(name),
      name,
      date_of_birth: dobFromYob,
      position: normalisePosition(getVal(row, colMap, 'position')),
      current_club: getVal(row, colMap, 'current_club') ?? '',
      current_club_country: clubCountry,
      current_club_confederation: getConfederation(clubCountry),
      nationality_1: getVal(row, colMap, 'nationality_1') ?? undefined,
      nationality_2: getVal(row, colMap, 'nationality_2') ?? undefined,
      nationality_3: getVal(row, colMap, 'nationality_3') ?? undefined,
      nationality_4: getVal(row, colMap, 'nationality_4') ?? undefined,
      nationality_5: getVal(row, colMap, 'nationality_5') ?? undefined,
      instagram_url: instagram_url || undefined,
      transfermarkt_url: rawTm || undefined,
      description: getVal(row, colMap, 'notes') ?? undefined,
      is_verified: false,
      is_self_submitted: false,
      is_active: true,
      status: 'Active',
    }

    // Remove undefined fields so Supabase doesn't complain
    Object.keys(player).forEach(k => player[k] === undefined && delete player[k])

    players.push(player)
  }

  console.log(`\nMapped: ${players.length} players`)
  if (skipped.length) console.log(`Skipped: ${skipped.length} rows (empty name)`)

  // Preview first 3
  console.log('\n── Sample rows ──────────────────────────────────────────')
  players.slice(0, 3).forEach(p => {
    const nats = [p.nationality_1, p.nationality_2, p.nationality_3].filter(Boolean).join(' / ')
    console.log(`  ${p.name.padEnd(28)} ${(p.position ?? '').padEnd(22)} ${p.current_club ?? ''} (${p.current_club_confederation}) [${nats}]`)
  })
  console.log('─────────────────────────────────────────────────────────\n')

  if (DRY_RUN) {
    console.log('DRY RUN — no data written to Supabase.')
    console.log('Remove --dry-run to perform the actual import.')
    process.exit(0)
  }

  // Optionally enrich from SportsDB
  if (ENRICH) {
    console.log('Enriching from TheSportsDB (this may take a while)...')
    for (const player of players) {
      const enriched = await enrichFromSportsDB(player.name)
      // Our sheet data takes priority — only fill blanks
      if (!player.profile_image_url && enriched.profile_image_url)
        player.profile_image_url = enriched.profile_image_url
      if (!player.cutout_image_url && enriched.cutout_image_url)
        player.cutout_image_url = enriched.cutout_image_url
      if (!player.description && enriched.description)
        player.description = enriched.description
      if (!player.instagram_url && enriched.instagram_url_sportsdb)
        player.instagram_url = enriched.instagram_url_sportsdb
      if (!player.transfermarkt_id && enriched.transfermarkt_id)
        player.transfermarkt_id = enriched.transfermarkt_id
      if (enriched.sportsdb_id) player.sportsdb_id = enriched.sportsdb_id
      if (enriched.sportsdb_team_id) player.sportsdb_team_id = enriched.sportsdb_team_id

      process.stdout.write(`  ✓ ${player.name}\n`)
      await new Promise(r => setTimeout(r, 700)) // Rate limit: ~85 req/min
    }
    console.log('')
  }

  // Upsert in batches of 50
  const BATCH_SIZE = 50
  let inserted = 0
  let updated = 0
  let failed = 0

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from('players')
      .upsert(batch, {
        onConflict: 'slug',                      // Match by slug (player name)
        ignoreDuplicates: false,                  // Update existing records
      })
      .select('id, name, slug')

    if (error) {
      console.error(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      failed += batch.length
    } else {
      inserted += data?.length ?? batch.length
      process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(players.length / BATCH_SIZE)} — ${inserted} upserted so far\n`)
    }
  }

  console.log(`\n── Import complete ───────────────────────────────────────`)
  console.log(`  Upserted : ${inserted}`)
  console.log(`  Failed   : ${failed}`)
  console.log(`  Total    : ${players.length}`)
  console.log(`─────────────────────────────────────────────────────────\n`)

  if (inserted > 0) {
    console.log('Players are now live in Supabase.')
    console.log('Run the nightly cron or use --enrich next time to pull SportsDB images.\n')
  }
}

main().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
