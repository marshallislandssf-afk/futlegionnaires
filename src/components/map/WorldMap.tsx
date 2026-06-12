'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { MapStats, Confederation } from '@/types'

const CONF_COLOURS: Record<string, { fill: string; stroke: string }> = {
  UEFA:     { fill: '#1a3a5c', stroke: '#2a6496' },
  CAF:      { fill: '#3a2a0a', stroke: '#c47d0e' },
  CONMEBOL: { fill: '#0a2a1a', stroke: '#1D9E75' },
  CONCACAF: { fill: '#2a0a3a', stroke: '#8e44ad' },
  AFC:      { fill: '#3a0a0a', stroke: '#c0392b' },
  OFC:      { fill: '#0a2a3a', stroke: '#16a085' },
  default:  { fill: '#1a1a1a', stroke: '#2a2a2a' },
}

// ISO 3166-1 numeric → country name (matches TopoJSON world-atlas@2 exactly)
const ISO_NAMES: Record<string, string> = {
  '004':'Afghanistan','008':'Albania','012':'Algeria','024':'Angola',
  '028':'Antigua and Barbuda','032':'Argentina','036':'Australia','040':'Austria',
  '031':'Azerbaijan','044':'Bahamas','050':'Bangladesh','052':'Barbados',
  '112':'Belarus','056':'Belgium','084':'Belize','204':'Benin',
  '064':'Bhutan','068':'Bolivia','070':'Bosnia and Herzegovina','072':'Botswana',
  '076':'Brazil','096':'Brunei','100':'Bulgaria','854':'Burkina Faso',
  '108':'Burundi','116':'Cambodia','120':'Cameroon','124':'Canada',
  '132':'Cabo Verde','140':'Central African Republic','144':'Sri Lanka',
  '152':'Chile','156':'China','170':'Colombia','174':'Comoros',
  '178':'Republic of the Congo','180':'Democratic Republic of the Congo',
  '188':'Costa Rica','191':'Croatia','192':'Cuba','196':'Cyprus',
  '203':'Czech Republic','208':'Denmark','262':'Djibouti','212':'Dominica',
  '214':'Dominican Republic','218':'Ecuador','818':'Egypt','222':'El Salvador',
  '226':'Equatorial Guinea','232':'Eritrea','233':'Estonia','231':'Ethiopia',
  '246':'Finland','250':'France','266':'Gabon','270':'Gambia',
  '276':'Germany','288':'Ghana','300':'Greece','308':'Grenada',
  '320':'Guatemala','324':'Guinea','624':'Guinea-Bissau','328':'Guyana',
  '332':'Haiti','340':'Honduras','348':'Hungary','356':'India',
  '360':'Indonesia','364':'Iran','368':'Iraq','372':'Republic of Ireland',
  '376':'Israel','380':'Italy','388':'Jamaica','392':'Japan',
  '400':'Jordan','398':'Kazakhstan','404':'Kenya','296':'Kiribati',
  '410':'South Korea','408':'North Korea','414':'Kuwait','417':'Kyrgyzstan',
  '418':'Laos','428':'Latvia','422':'Lebanon','426':'Lesotho',
  '430':'Liberia','434':'Libya','440':'Lithuania','442':'Luxembourg',
  '450':'Madagascar','454':'Malawi','458':'Malaysia','466':'Mali',
  '478':'Mauritania','480':'Mauritius','484':'Mexico','583':'Federated States of Micronesia',
  '498':'Moldova','496':'Mongolia','504':'Morocco','508':'Mozambique',
  '516':'Namibia','520':'Nauru','524':'Nepal','528':'Netherlands',
  '540':'New Caledonia','554':'New Zealand','558':'Nicaragua','562':'Niger',
  '566':'Nigeria','578':'Norway','512':'Oman','586':'Pakistan',
  '585':'Palau','275':'Palestine','591':'Panama','598':'Papua New Guinea',
  '600':'Paraguay','604':'Peru','608':'Philippines','616':'Poland',
  '620':'Portugal','634':'Qatar','642':'Romania','643':'Russia',
  '646':'Rwanda','659':'Saint Kitts and Nevis','662':'Saint Lucia',
  '670':'Saint Vincent and the Grenadines','882':'Samoa',
  '678':'Sao Tome and Principe','682':'Saudi Arabia','686':'Senegal',
  '694':'Sierra Leone','703':'Slovakia','705':'Slovenia','090':'Solomon Islands',
  '706':'Somalia','710':'South Africa','728':'South Sudan','724':'Spain',
  '729':'Sudan','740':'Suriname','748':'Eswatini','752':'Sweden',
  '756':'Switzerland','760':'Syria','764':'Thailand','768':'Togo',
  '776':'Tonga','780':'Trinidad and Tobago','788':'Tunisia','792':'Turkey',
  '795':'Turkmenistan','798':'Tuvalu','800':'Uganda','804':'Ukraine',
  '784':'United Arab Emirates','826':'United Kingdom',
  '840':'United States of America','858':'Uruguay','860':'Uzbekistan',
  '548':'Vanuatu','862':'Venezuela','704':'Vietnam','887':'Yemen',
  '894':'Zambia','716':'Zimbabwe','051':'Armenia','292':'Gibraltar',
  '352':'Iceland','499':'Montenegro','807':'North Macedonia',  '148':'Chad','834':'Tanzania',
  '384':'Ivory Coast',  // Additional
  '060':'Bermuda','136':'Cayman Islands','531':'Curacao','533':'Aruba',
  '638':'Reunion','175':'Mayotte',
  '732':'Western Sahara','688':'Serbia',  '674':'San Marino','492':'Monaco','470':'Malta','438':'Liechtenstein',
  '336':'Vatican City','020':'Andorra','304':'Greenland',
}

// Country name → confederation (using exact TopoJSON name matches)
const COUNTRY_CONF: Record<string, Confederation> = {
  // UEFA
  'Albania':'UEFA','Andorra':'UEFA','Armenia':'UEFA','Austria':'UEFA',
  'Azerbaijan':'UEFA','Belarus':'UEFA','Belgium':'UEFA',
  'Bosnia and Herzegovina':'UEFA','Bulgaria':'UEFA','Croatia':'UEFA',
  'Cyprus':'UEFA','Czech Republic':'UEFA','Denmark':'UEFA',
  'Estonia':'UEFA','Finland':'UEFA','France':'UEFA','Georgia':'UEFA',
  'Germany':'UEFA','Gibraltar':'UEFA','Greece':'UEFA','Hungary':'UEFA',
  'Iceland':'UEFA','Republic of Ireland':'UEFA','Ireland':'UEFA',
  'Israel':'UEFA','Italy':'UEFA','Kazakhstan':'UEFA','Kosovo':'UEFA',
  'Latvia':'UEFA','Liechtenstein':'UEFA','Lithuania':'UEFA',
  'Luxembourg':'UEFA','Malta':'UEFA','Moldova':'UEFA','Monaco':'UEFA',
  'Montenegro':'UEFA','Netherlands':'UEFA','North Macedonia':'UEFA',
  'Norway':'UEFA','Poland':'UEFA','Portugal':'UEFA','Romania':'UEFA',
  'Russia':'UEFA','San Marino':'UEFA','Serbia':'UEFA','Slovakia':'UEFA',
  'Slovenia':'UEFA','Spain':'UEFA','Sweden':'UEFA','Switzerland':'UEFA',
  'Turkey':'UEFA','Ukraine':'UEFA','United Kingdom':'UEFA',
  'Greenland':'UEFA', // associate/observer, shown UEFA geographically

  // CAF — using exact TopoJSON name variants
  'Algeria':'CAF','Angola':'CAF','Benin':'CAF','Botswana':'CAF',
  'Burkina Faso':'CAF','Burundi':'CAF','Cabo Verde':'CAF','Cameroon':'CAF',
  'Central African Republic':'CAF','Chad':'CAF','Comoros':'CAF',
  'Republic of the Congo':'CAF','Democratic Republic of the Congo':'CAF',
  'Djibouti':'CAF','Egypt':'CAF','Equatorial Guinea':'CAF','Eritrea':'CAF',
  'Eswatini':'CAF','Ethiopia':'CAF','Gabon':'CAF','Gambia':'CAF',
  'Ghana':'CAF','Guinea':'CAF','Guinea-Bissau':'CAF',
  "Ivory Coast":'CAF',"Côte d'Ivoire":'CAF',
  'Kenya':'CAF','Lesotho':'CAF','Liberia':'CAF','Libya':'CAF',
  'Madagascar':'CAF','Malawi':'CAF','Mali':'CAF','Mauritania':'CAF',
  'Mauritius':'CAF','Mayotte':'CAF','Morocco':'CAF','Mozambique':'CAF',
  'Namibia':'CAF','Niger':'CAF','Nigeria':'CAF','Rwanda':'CAF',
  'Sao Tome and Principe':'CAF','São Tomé and Príncipe':'CAF',
  'Senegal':'CAF','Seychelles':'CAF','Sierra Leone':'CAF',
  'Somalia':'CAF','South Africa':'CAF','South Sudan':'CAF','Sudan':'CAF',
  'Tanzania':'CAF','Togo':'CAF','Tunisia':'CAF','Uganda':'CAF',
  'Western Sahara':'CAF','Zambia':'CAF','Zimbabwe':'CAF',
  'Reunion':'CAF',

  // CONMEBOL
  'Argentina':'CONMEBOL','Bolivia':'CONMEBOL','Brazil':'CONMEBOL',
  'Chile':'CONMEBOL','Colombia':'CONMEBOL','Ecuador':'CONMEBOL',
  'Paraguay':'CONMEBOL','Peru':'CONMEBOL','Uruguay':'CONMEBOL',
  'Venezuela':'CONMEBOL',

  // CONCACAF
  'Antigua and Barbuda':'CONCACAF','Aruba':'CONCACAF','Bahamas':'CONCACAF',
  'Barbados':'CONCACAF','Belize':'CONCACAF','Bermuda':'CONCACAF',
  'Canada':'CONCACAF','Cayman Islands':'CONCACAF','Costa Rica':'CONCACAF',
  'Cuba':'CONCACAF','Curacao':'CONCACAF','Dominica':'CONCACAF',
  'Dominican Republic':'CONCACAF','El Salvador':'CONCACAF',
  'Grenada':'CONCACAF','Guatemala':'CONCACAF','Guyana':'CONCACAF',
  'Haiti':'CONCACAF','Honduras':'CONCACAF','Jamaica':'CONCACAF',
  'Mexico':'CONCACAF','Nicaragua':'CONCACAF','Panama':'CONCACAF',
  'Puerto Rico':'CONCACAF','Saint Kitts and Nevis':'CONCACAF',
  'Saint Lucia':'CONCACAF',
  'Saint Vincent and the Grenadines':'CONCACAF',
  'Suriname':'CONCACAF','Trinidad and Tobago':'CONCACAF',
  'United States of America':'CONCACAF',

  // AFC
  'Afghanistan':'AFC','Australia':'AFC','Bahrain':'AFC','Bangladesh':'AFC',
  'Bhutan':'AFC','Brunei':'AFC','Cambodia':'AFC','China':'AFC',
  'India':'AFC','Indonesia':'AFC','Iran':'AFC','Iraq':'AFC',
  'Japan':'AFC','Jordan':'AFC','Kuwait':'AFC','Kyrgyzstan':'AFC',
  'Laos':'AFC','Lebanon':'AFC','Malaysia':'AFC','Maldives':'AFC',
  'Mongolia':'AFC','Myanmar':'AFC','Nepal':'AFC','North Korea':'AFC',
  'Oman':'AFC','Pakistan':'AFC','Palestine':'AFC','Philippines':'AFC',
  'Qatar':'AFC','Saudi Arabia':'AFC','Singapore':'AFC',
  'South Korea':'AFC','Sri Lanka':'AFC','Syria':'AFC','Tajikistan':'AFC',
  'Thailand':'AFC','Timor-Leste':'AFC','Turkmenistan':'AFC',
  'United Arab Emirates':'AFC','Uzbekistan':'AFC','Vietnam':'AFC',
  'Yemen':'AFC','Federated States of Micronesia':'AFC',

  // OFC
  'Fiji':'OFC','Kiribati':'OFC','Marshall Islands':'OFC',
  'Nauru':'OFC','New Caledonia':'OFC','New Zealand':'OFC',
  'Papua New Guinea':'OFC','Samoa':'OFC','Solomon Islands':'OFC',
  'Tonga':'OFC','Tuvalu':'OFC','Vanuatu':'OFC',
  'Palau':'OFC',
}

interface TooltipState {
  x: number; y: number; name: string; conf: string; count: number
}

interface Props {
  stats: MapStats
  selectedConf: Confederation | null
  onSelectConf: (conf: Confederation | null) => void
}

export function WorldMap({ stats, selectedConf, onSelectConf }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ name: string; conf: Confederation }[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const featuresRef = useRef<{ el: SVGPathElement; name: string; conf: Confederation | null }[]>([])

  const confCounts = Object.fromEntries(
    stats.confederations.map(c => [c.confederation, c.player_count])
  )

  // ── Search ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const q = search.toLowerCase()
    const results = Object.entries(COUNTRY_CONF)
      .filter(([name]) => name.toLowerCase().includes(q))
      .map(([name, conf]) => ({ name, conf }))
      .slice(0, 8)
    setSearchResults(results)
  }, [search])

  function flyToCountry(name: string, conf: Confederation) {
    setSearch('')
    setSearchResults([])
    onSelectConf(conf)
    // Highlight by re-colouring
    featuresRef.current.forEach(f => {
      if (f.name === name) {
        f.el.setAttribute('fill', CONF_COLOURS[conf]?.stroke ?? '#fff')
        setTimeout(() => {
          f.el.setAttribute('fill', CONF_COLOURS[conf]?.fill ?? '#222')
        }, 1500)
      }
    })
  }

  // ── Zoom controls ────────────────────────────────────────────────────────
  function applyZoom(delta: number) {
    setZoom(z => Math.min(8, Math.max(1, z + delta)))
  }

  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // ── Scroll to zoom ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      applyZoom(e.deltaY < 0 ? 0.3 : -0.3)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // ── Pan handlers ──────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return
    isPanning.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isPanning.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }
  function onMouseUp() { isPanning.current = false }

  // Touch pan/zoom
  const lastTouchDist = useRef(0)
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx*dx + dy*dy)
    } else if (e.touches.length === 1) {
      isPanning.current = true
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx*dx + dy*dy)
      applyZoom((dist - lastTouchDist.current) * 0.01)
      lastTouchDist.current = dist
    } else if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - lastPos.current.x
      const dy = e.touches[0].clientY - lastPos.current.y
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    }
  }
  function onTouchEnd() { isPanning.current = false }

  // ── Draw map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    featuresRef.current = []

    async function drawMap() {
      const [{ geoNaturalEarth1, geoPath, geoGraticule }, { feature }] = await Promise.all([
        import('d3-geo'),
        import('topojson-client'),
      ])
      const topoRes = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      const topo = await topoRes.json()
      if (cancelled || !svgRef.current || !gRef.current) return

      const g = gRef.current
      while (g.firstChild) g.removeChild(g.firstChild)

      const projection = geoNaturalEarth1().scale(153).translate([400, 215])
      const path = geoPath(projection)
      const countries = feature(topo, topo.objects.countries)

      // Graticule
      const graticule = geoGraticule()
      const graticulePath = path(graticule())
      if (graticulePath) {
        const gEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        gEl.setAttribute('d', graticulePath)
        gEl.setAttribute('fill', 'none')
        gEl.setAttribute('stroke', '#1a2520')
        gEl.setAttribute('stroke-width', '0.3')
        g.appendChild(gEl)
      }

      // Countries
      const featuresArr = (countries as any).features as any[]
      for (const feat of featuresArr) {
        const numId = String(feat.id ?? '').padStart(3, '0')
        const name = ISO_NAMES[numId] ?? ''
        const conf = name ? (COUNTRY_CONF[name] ?? null) : null
        const isSelected = selectedConf === conf
        const isDimmed = selectedConf !== null && conf !== selectedConf
        const colours = conf ? CONF_COLOURS[conf] : CONF_COLOURS.default
        const pathData = path(feat)
        if (!pathData) continue

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', pathData)
        el.setAttribute('fill', isDimmed ? '#111' : colours.fill)
        el.setAttribute('stroke', isDimmed ? '#1a1a1a' : colours.stroke)
        el.setAttribute('stroke-width', isSelected ? '1.5' : '0.5')
        el.setAttribute('opacity', isDimmed ? '0.25' : '1')
        el.style.transition = 'fill 0.15s, opacity 0.15s'
        if (conf) el.style.cursor = 'pointer'

        if (conf) {
          el.addEventListener('mouseenter', (e) => {
            if (isPanning.current) return
            el.setAttribute('fill', CONF_COLOURS[conf].stroke)
            const rect = svgRef.current!.getBoundingClientRect()
            setTooltip({
              x: (e as MouseEvent).clientX - rect.left,
              y: (e as MouseEvent).clientY - rect.top,
              name: name || 'Unknown', conf,
              count: confCounts[conf] ?? 0,
            })
          })
          el.addEventListener('mouseleave', () => {
            el.setAttribute('fill', isDimmed ? '#111' : colours.fill)
            setTooltip(null)
          })
          el.addEventListener('click', () => {
            if (isPanning.current) return
            onSelectConf(selectedConf === conf ? null : conf)
          })
        }

        g.appendChild(el)
        if (conf) featuresRef.current.push({ el, name, conf })
      }

      // Sphere
      const spherePath = path({ type: 'Sphere' } as any)
      if (spherePath) {
        const sphere = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        sphere.setAttribute('d', spherePath)
        sphere.setAttribute('fill', 'none')
        sphere.setAttribute('stroke', '#1D9E75')
        sphere.setAttribute('stroke-width', '0.8')
        sphere.setAttribute('opacity', '0.4')
        g.appendChild(sphere)
      }

      setLoaded(true)
    }

    drawMap().catch(console.error)
    return () => { cancelled = true }
  }, [selectedConf, stats])

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`

  return (
    <div className="space-y-3">
      {/* Search + controls row */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Country search */}
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for a country…"
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#1D9E75]/50"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1a16] border border-white/15 rounded-lg overflow-hidden z-20 shadow-xl">
              {searchResults.map(r => (
                <button
                  key={r.name}
                  onClick={() => flyToCountry(r.name, r.conf)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: CONF_COLOURS[r.conf].stroke }}
                  />
                  <span className="text-white/80">{r.name}</span>
                  <span className="text-white/30 text-xs ml-auto">{r.conf}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => applyZoom(0.5)}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-lg font-light flex items-center justify-center">
            +
          </button>
          <button onClick={() => applyZoom(-0.5)}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-lg font-light flex items-center justify-center">
            −
          </button>
          <button onClick={resetView}
            className="px-3 h-8 rounded-lg bg-white/[0.05] border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors text-xs">
            Reset
          </button>
          <span className="text-xs text-white/20 ml-1">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-white/10"
        style={{ background: '#0a0f0d', cursor: zoom > 1 ? 'grab' : 'default' }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ height: 420 }}>
            <p className="text-white/20 text-sm">Loading map…</p>
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox="0 0 800 420"
          preserveAspectRatio="xMidYMid meet"
          className="w-full block select-none"
          style={{ height: 420 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <rect width="800" height="420" fill="#0a0f0d" />
          <g
            ref={gRef}
            style={{
              transform,
              transformOrigin: '400px 215px',
              transition: isPanning.current ? 'none' : 'transform 0.15s ease',
            }}
          />
        </svg>

        {/* Zoom hint */}
        {loaded && zoom === 1 && (
          <div className="absolute bottom-2 right-3 text-[10px] text-white/20 pointer-events-none">
            Scroll to zoom · drag to pan
          </div>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-black/90 border border-white/10 rounded-lg px-3 py-2 text-xs z-10"
            style={{ left: Math.min(tooltip.x + 12, 680), top: Math.max(tooltip.y - 10, 5) }}
          >
            <p className="font-medium text-white">{tooltip.name}</p>
            <p className="text-white/40">{tooltip.conf}</p>
            <p className="text-[#1D9E75]">{tooltip.count} players tracked</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        {(Object.keys(CONF_COLOURS).filter(k => k !== 'default') as Confederation[]).map(conf => (
          <button
            key={conf}
            onClick={() => onSelectConf(selectedConf === conf ? null : conf)}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: selectedConf && selectedConf !== conf ? 0.3 : 1 }}
          >
            <span className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: CONF_COLOURS[conf as string].stroke }} />
            <span className="text-white/50">{conf}</span>
            <span className="text-white/25">({confCounts[conf] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* French Guiana note */}
      <p className="text-[11px] text-white/20 px-1">
        * French Guiana (CONCACAF) displays as France — the TopoJSON dataset groups overseas territories with their parent country geometrically.
      </p>
    </div>
  )
}
