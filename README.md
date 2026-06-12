# FutLegionnaires

> The global database of dual-heritage football players — built for scouts, federations and players themselves.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Deployment | Vercel (Edge Runtime) |
| Database | Supabase (Postgres + RLS) |
| Player data | TheSportsDB v2 API |
| Styling | Tailwind CSS |
| Language | TypeScript |

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/futlegionnaires.git
cd futlegionnaires
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

```
SPORTSDB_API_KEY=xthIt7HuQ73sacI479PgBrAnXgVPAM77rmph5ZxT

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CRON_SECRET=generate_a_random_secret_here
```

Find your Supabase keys in: **Supabase Dashboard → Project Settings → API**

### 3. Run the database migration

Open **Supabase Dashboard → SQL Editor → New Query**, paste the contents of:

```
supabase/migrations/001_initial_schema.sql
```

Run the query. This creates all tables, indexes, RLS policies and seed data.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── players/          # GET  /api/players?q=&position=&confederation=
│   │   ├── player/[slug]/    # GET  /api/player/:slug
│   │   ├── search/           # GET  /api/search?name=  (SportsDB proxy)
│   │   ├── submit/           # POST /api/submit
│   │   ├── map-stats/        # GET  /api/map-stats
│   │   └── cron/
│   │       └── enrich-players/  # Nightly SportsDB data refresh
│   ├── map/                  # World map page
│   ├── players/              # Player listing page
│   ├── player/[slug]/        # Individual player profile
│   ├── scout/                # Scout intelligence view
│   └── submit/               # Player self-submission form
├── components/
│   ├── layout/Nav.tsx
│   ├── map/MapClient.tsx     # Confederation overview + D3 map scaffold
│   └── players/
│       ├── PlayerCard.tsx
│       └── PlayerSearch.tsx  # Search + filter UI
├── lib/
│   ├── sportsdb.ts           # TheSportsDB API client (server-side only)
│   ├── supabase.ts           # Supabase client (browser + server variants)
│   └── players.ts            # Player service — all DB operations
└── types/
    └── index.ts              # TypeScript types for the whole platform
```

---

## Importing from your spreadsheets

There are two ways to do the initial import. Both accept your existing column names — they map automatically.

### Option A — CLI script (recommended for first import)

Best for large files or if you want to enrich with SportsDB images in the same pass.

```bash
# Install script dependencies (one-time)
npm install papaparse xlsx dotenv

# Dry run first — preview without writing anything
node scripts/import-players.mjs path/to/your-sheet.csv --dry-run

# If the preview looks right, run for real
node scripts/import-players.mjs path/to/your-sheet.csv

# With SportsDB enrichment (pulls profile images — slower, ~1 per second)
node scripts/import-players.mjs path/to/your-sheet.csv --enrich

# XLSX with a specific sheet name
node scripts/import-players.mjs path/to/your-sheet.xlsx --sheet="Sheet2"
```

**Supported file types:** `.csv` `.tsv` `.xlsx` `.xls` `.ods`

### Option B — Admin UI in the browser

Go to `/admin/import` on your deployed site.

1. Drag and drop your CSV
2. Enter your `ADMIN_SECRET` (set this in Vercel env vars)
3. Click **Preview mapping** — see exactly how columns are detected
4. Click **Import to Supabase** to commit

The admin UI supports CSV only. For XLSX use the CLI script.

### Column name flexibility

Your column headers don't need to match exactly. The importer understands:

| Your column header | Maps to |
|---|---|
| "Player Name", "Name", "Full Name" | `name` |
| "Primary Role", "Role", "Position" | `position` |
| "Current Club", "Club", "Team" | `current_club` |
| "Club Location Country", "Country" | `current_club_country` |
| "Year of Birth", "Born", "YOB" | `date_of_birth` |
| "Instagram Link", "Instagram", "IG" | `instagram_url` |
| "Transfermarkt Link", "TM Link" | `transfermarkt_url` |
| "Notes", "Comments" | `description` |
| "Secondary Nation", "Nation 2" | `nationality_2` |
| "Tertiary Nation", "Nation 3" | `nationality_3` |
| "Fourth Nation", "Nation 4" | `nationality_4` |
| "Fifth Nation", "Nation 5" | `nationality_5` |

### How updates work after the initial import

The import uses **upsert on player slug** (generated from the name). So:

- Running the import again with the same file is safe — it updates existing records, doesn't duplicate
- After the initial import, the nightly SportsDB cron keeps club data current automatically
- For manual updates (e.g. a player moves clubs), just edit the row in Supabase directly, or re-run the script with the updated CSV

### Adding ADMIN_SECRET

Generate a secret and add it to your Vercel env vars:

```bash
openssl rand -hex 32
# → add the output as ADMIN_SECRET in Vercel Dashboard → Settings → Environment Variables
```

---



### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_ORG/futlegionnaires)

### Manual

```bash
npm i -g vercel
vercel login
vercel --prod
```

Add your environment variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

The `CRON_SECRET` is used to authenticate the nightly cron job — generate one with:
```bash
openssl rand -hex 32
```

---

## Data pipeline

### How player data flows

```
TheSportsDB API (v2)
        ↓
  /api/search proxy        ← Browser never sees the API key
        ↓
  normaliseSportsDBPlayer() ← Maps SportsDB fields → our Player type
        ↓
  Supabase players table    ← Canonical store; curated nationality data lives here
        ↓
  /api/players              ← Filtered, paginated, cached
        ↓
  PlayerCard / PlayerPage   ← UI
```

### Adding a player manually

1. Go to Supabase Dashboard → Table Editor → `players`
2. Insert a row with the required fields
3. Or use the admin import script:

```typescript
import { importPlayerFromSportsDB } from '@/lib/players'

// Searches SportsDB by name, normalises, inserts into Supabase
await importPlayerFromSportsDB('Achraf Hakimi', {
  nationality_2: 'Morocco',   // Add extra nationalities SportsDB doesn't know
  is_verified: true,
})
```

### Nightly enrichment cron

Vercel Cron runs `/api/cron/enrich-players` at 2am UTC daily.
It refreshes club data for up to 50 players per run (respects SportsDB's 100 req/min rate limit).
Add `CRON_SECRET` to your Vercel environment variables.

---

## Switching data providers

The SportsDB integration is isolated in `src/lib/sportsdb.ts`.

To swap it for another provider (e.g. API-Football, Sportmonks, or a Transfermarkt licence):

1. Create a new file e.g. `src/lib/apifootball.ts`
2. Implement the same exported functions:
   - `searchPlayersByName(name: string): Promise<RawPlayer[]>`
   - `lookupPlayerById(id: string): Promise<RawPlayer | null>`
   - `normalisePlayer(raw: RawPlayer): Partial<Player>`
3. Update the imports in `src/lib/players.ts`

The rest of the stack (Supabase, UI, API routes) stays identical.

---

## Supabase RLS summary

| Operation | Who can do it |
|---|---|
| Read active players | Everyone (public) |
| Write / update players | Service role only (server-side) |
| Submit a profile | Everyone (public) |
| Read submissions | Service role only (admin) |

---

## Roadmap suggestions

- [ ] D3 choropleth world map (wire up `d3-geo` + Natural Earth TopoJSON)
- [ ] Admin dashboard for reviewing player submissions
- [ ] Player authentication (players can edit their own profiles)
- [ ] Email notifications to scouts when new players matching their saved searches are added
- [ ] Bulk import from CSV / spreadsheet
- [ ] Market value data (pending Transfermarkt licensing or alternative)
- [ ] Mobile app (React Native / Expo using the same `/api/*` endpoints)
