'use client'

import { useEffect, useRef, useState } from 'react'
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

// ─── ISO 3166-1 numeric → country name ───────────────────────────────────────
// Cross-referenced against TopoJSON world-atlas@2 countries-110m.json
const ISO_NAMES: Record<string, string> = {
  '004': 'Afghanistan',             '008': 'Albania',
  '012': 'Algeria',                 '024': 'Angola',
  '028': 'Antigua and Barbuda',     '032': 'Argentina',
  '036': 'Australia',               '040': 'Austria',
  '031': 'Azerbaijan',              '044': 'Bahamas',
  '050': 'Bangladesh',              '052': 'Barbados',
  '112': 'Belarus',                 '056': 'Belgium',
  '084': 'Belize',                  '204': 'Benin',
  '064': 'Bhutan',                  '068': 'Bolivia',
  '070': 'Bosnia and Herzegovina',  '072': 'Botswana',
  '076': 'Brazil',                  '096': 'Brunei',
  '100': 'Bulgaria',                '854': 'Burkina Faso',
  '108': 'Burundi',                 '116': 'Cambodia',
  '120': 'Cameroon',                '124': 'Canada',
  '132': 'Cabo Verde',              '140': 'Central African Republic',
  '144': 'Sri Lanka',               '152': 'Chile',
  '156': 'China',                   '170': 'Colombia',
  '174': 'Comoros',                 '178': 'Congo',
  '180': 'DR Congo',                '188': 'Costa Rica',
  '191': 'Croatia',                 '192': 'Cuba',
  '196': 'Cyprus',                  '203': 'Czech Republic',
  '208': 'Denmark',                 '262': 'Djibouti',
  '212': 'Dominica',                '214': 'Dominican Republic',
  '218': 'Ecuador',                 '818': 'Egypt',
  '222': 'El Salvador',             '226': 'Equatorial Guinea',
  '232': 'Eritrea',                 '233': 'Estonia',
  '231': 'Ethiopia',                '238': 'Falkland Islands',
  '246': 'Finland',                 '250': 'France',
  '266': 'Gabon',                   '270': 'Gambia',
  '288': 'Ghana',                   '300': 'Greece',
  '308': 'Grenada',                 '320': 'Guatemala',
  '324': 'Guinea',                  '624': 'Guinea-Bissau',
  '328': 'Guyana',                  '332': 'Haiti',
  '340': 'Honduras',                '348': 'Hungary',
  '356': 'India',                   '360': 'Indonesia',
  '364': 'Iran',                    '368': 'Iraq',
  '372': 'Ireland',                 '376': 'Israel',
  '380': 'Italy',                   '388': 'Jamaica',
  '392': 'Japan',                   '400': 'Jordan',
  '398': 'Kazakhstan',              '404': 'Kenya',
  '296': 'Kiribati',                '410': 'South Korea',
  '408': 'North Korea',             '414': 'Kuwait',
  '417': 'Kyrgyzstan',              '418': 'Laos',
  '428': 'Latvia',                  '422': 'Lebanon',
  '426': 'Lesotho',                 '430': 'Liberia',
  '434': 'Libya',                   '440': 'Lithuania',
  '442': 'Luxembourg',              '450': 'Madagascar',
  '454': 'Malawi',                  '458': 'Malaysia',
  '466': 'Mali',                    '478': 'Mauritania',
  '480': 'Mauritius',               '175': 'Mayotte',
  '484': 'Mexico',                  '583': 'Micronesia',
  '498': 'Moldova',                 '496': 'Mongolia',
  '504': 'Morocco',                 '508': 'Mozambique',
  '516': 'Namibia',                 '520': 'Nauru',
  '524': 'Nepal',                   '528': 'Netherlands',
  '554': 'New Zealand',             '558': 'Nicaragua',
  '562': 'Niger',                   '566': 'Nigeria',
  '578': 'Norway',                  '586': 'Pakistan',
  '585': 'Palau',                   '275': 'Palestine',
  '591': 'Panama',                  '598': 'Papua New Guinea',
  '600': 'Paraguay',                '604': 'Peru',
  '608': 'Philippines',             '616': 'Poland',
  '620': 'Portugal',                '630': 'Puerto Rico',
  '634': 'Qatar',                   '638': 'Réunion',
  '642': 'Romania',                 '643': 'Russia',
  '646': 'Rwanda',                  '659': 'Saint Kitts and Nevis',
  '662': 'Saint Lucia',             '670': 'Saint Vincent and the Grenadines',
  '882': 'Samoa',                   '678': 'São Tomé and Príncipe',
  '682': 'Saudi Arabia',            '686': 'Senegal',
  '694': 'Sierra Leone',            '703': 'Slovakia',
  '705': 'Slovenia',                '090': 'Solomon Islands',
  '706': 'Somalia',                 '710': 'South Africa',
  '728': 'South Sudan',             '724': 'Spain',
  '729': 'Sudan',                   '740': 'Suriname',
  '748': 'Eswatini',               '752': 'Sweden',
  '756': 'Switzerland',             '760': 'Syria',
  '764': 'Thailand',                '768': 'Togo',
  '776': 'Tonga',                   '780': 'Trinidad and Tobago',
  '788': 'Tunisia',                 '792': 'Turkey',
  '795': 'Turkmenistan',            '798': 'Tuvalu',
  '800': 'Uganda',                  '804': 'Ukraine',
  '784': 'United Arab Emirates',    '826': 'United Kingdom',
  '840': 'United States of America','858': 'Uruguay',
  '860': 'Uzbekistan',              '548': 'Vanuatu',
  '862': 'Venezuela',               '704': 'Vietnam',
  '732': 'Western Sahara',          '887': 'Yemen',
  '894': 'Zambia',                  '716': 'Zimbabwe',
  '051': 'Armenia',
  '292': 'Gibraltar',               '336': 'Vatican City',
  '438': 'Liechtenstein',           '470': 'Malta',
  '492': 'Monaco',                  '499': 'Montenegro',
  '807': 'North Macedonia',         '674': 'San Marino',
  '688': 'Serbia',
  '531': 'Curaçao',
  '533': 'Aruba',                   '136': 'Cayman Islands',
  '060': 'Bermuda',
}

// ─── Country name → FIFA confederation ───────────────────────────────────────
// Sources: FIFA.com confederation membership lists + CAF/UEFA/AFC/CONMEBOL/CONCACAF/OFC official sites
const COUNTRY_CONF: Record<string, Confederation> = {
  // ── UEFA (55 members) ─────────────────────────────────────────────────────
  'Albania': 'UEFA', 'Andorra': 'UEFA', 'Armenia': 'UEFA', 'Austria': 'UEFA',
  'Azerbaijan': 'UEFA', 'Belarus': 'UEFA', 'Belgium': 'UEFA',
  'Bosnia and Herzegovina': 'UEFA', 'Bulgaria': 'UEFA', 'Croatia': 'UEFA',
  'Cyprus': 'UEFA', 'Czech Republic': 'UEFA', 'Denmark': 'UEFA', 'England': 'UEFA',
  'Estonia': 'UEFA', 'Faroe Islands': 'UEFA', 'Finland': 'UEFA', 'France': 'UEFA',
  'Georgia': 'UEFA', 'Germany': 'UEFA', 'Gibraltar': 'UEFA', 'Greece': 'UEFA',
  'Hungary': 'UEFA', 'Iceland': 'UEFA', 'Ireland': 'UEFA', 'Israel': 'UEFA',
  'Italy': 'UEFA', 'Kazakhstan': 'UEFA', 'Kosovo': 'UEFA', 'Latvia': 'UEFA',
  'Liechtenstein': 'UEFA', 'Lithuania': 'UEFA', 'Luxembourg': 'UEFA', 'Malta': 'UEFA',
  'Moldova': 'UEFA', 'Monaco': 'UEFA', 'Montenegro': 'UEFA', 'Netherlands': 'UEFA',
  'North Macedonia': 'UEFA', 'Northern Ireland': 'UEFA', 'Norway': 'UEFA',
  'Poland': 'UEFA', 'Portugal': 'UEFA', 'Romania': 'UEFA', 'Russia': 'UEFA',
  'San Marino': 'UEFA', 'Scotland': 'UEFA', 'Serbia': 'UEFA', 'Slovakia': 'UEFA',
  'Slovenia': 'UEFA', 'Spain': 'UEFA', 'Sweden': 'UEFA', 'Switzerland': 'UEFA',
  'Turkey': 'UEFA', 'Ukraine': 'UEFA', 'United Kingdom': 'UEFA', 'Wales': 'UEFA',

  // ── CAF (54 members) ─────────────────────────────────────────────────────
  'Algeria': 'CAF', 'Angola': 'CAF', 'Benin': 'CAF', 'Botswana': 'CAF',
  'Burkina Faso': 'CAF', 'Burundi': 'CAF', 'Cabo Verde': 'CAF', 'Cameroon': 'CAF',
  'Central African Republic': 'CAF', 'Chad': 'CAF', 'Comoros': 'CAF', 'Congo': 'CAF',
  'DR Congo': 'CAF', 'Djibouti': 'CAF', 'Egypt': 'CAF', 'Equatorial Guinea': 'CAF',
  'Eritrea': 'CAF', 'Eswatini': 'CAF', 'Ethiopia': 'CAF', 'Gabon': 'CAF',
  'Gambia': 'CAF', 'Ghana': 'CAF', 'Guinea': 'CAF', 'Guinea-Bissau': 'CAF',
  "Côte d'Ivoire": 'CAF', 'Kenya': 'CAF', 'Lesotho': 'CAF', 'Liberia': 'CAF',
  'Libya': 'CAF', 'Madagascar': 'CAF', 'Malawi': 'CAF', 'Mali': 'CAF',
  'Mauritania': 'CAF', 'Mauritius': 'CAF', 'Mayotte': 'CAF', 'Morocco': 'CAF',
  'Mozambique': 'CAF', 'Namibia': 'CAF', 'Niger': 'CAF', 'Nigeria': 'CAF',
  'Rwanda': 'CAF', 'São Tomé and Príncipe': 'CAF', 'Senegal': 'CAF',
  'Seychelles': 'CAF', 'Sierra Leone': 'CAF', 'Somalia': 'CAF', 'South Africa': 'CAF',
  'South Sudan': 'CAF', 'Sudan': 'CAF', 'Tanzania': 'CAF', 'Togo': 'CAF',
  'Tunisia': 'CAF', 'Uganda': 'CAF', 'Western Sahara': 'CAF', 'Zambia': 'CAF',
  'Zimbabwe': 'CAF', 'Réunion': 'CAF',

  // ── CONMEBOL (10 members) ─────────────────────────────────────────────────
  'Argentina': 'CONMEBOL', 'Bolivia': 'CONMEBOL', 'Brazil': 'CONMEBOL',
  'Chile': 'CONMEBOL', 'Colombia': 'CONMEBOL', 'Ecuador': 'CONMEBOL',
  'Paraguay': 'CONMEBOL', 'Peru': 'CONMEBOL', 'Uruguay': 'CONMEBOL',
  'Venezuela': 'CONMEBOL',

  // ── CONCACAF (41 members + territories) ──────────────────────────────────
  'Antigua and Barbuda': 'CONCACAF', 'Aruba': 'CONCACAF', 'Bahamas': 'CONCACAF',
  'Barbados': 'CONCACAF', 'Belize': 'CONCACAF', 'Bermuda': 'CONCACAF',
  'Canada': 'CONCACAF', 'Cayman Islands': 'CONCACAF', 'Costa Rica': 'CONCACAF',
  'Cuba': 'CONCACAF', 'Curaçao': 'CONCACAF', 'Dominica': 'CONCACAF',
  'Dominican Republic': 'CONCACAF', 'El Salvador': 'CONCACAF',
  'French Guiana': 'CONCACAF', 'Greenland': 'CONCACAF', 'Grenada': 'CONCACAF',
  'Guadeloupe': 'CONCACAF', 'Guatemala': 'CONCACAF', 'Guyana': 'CONCACAF',
  'Haiti': 'CONCACAF', 'Honduras': 'CONCACAF', 'Jamaica': 'CONCACAF',
  'Martinique': 'CONCACAF', 'Mexico': 'CONCACAF', 'Montserrat': 'CONCACAF',
  'Nicaragua': 'CONCACAF', 'Panama': 'CONCACAF', 'Puerto Rico': 'CONCACAF',
  'Saint Kitts and Nevis': 'CONCACAF', 'Saint Lucia': 'CONCACAF',
  'Saint Martin': 'CONCACAF', 'Saint Vincent and the Grenadines': 'CONCACAF',
  'Sint Maarten': 'CONCACAF', 'Suriname': 'CONCACAF',
  'Trinidad and Tobago': 'CONCACAF', 'Turks and Caicos Islands': 'CONCACAF',
  'United States of America': 'CONCACAF', 'United States Virgin Islands': 'CONCACAF',
  'British Virgin Islands': 'CONCACAF',

  // ── AFC (47 members) ─────────────────────────────────────────────────────
  'Afghanistan': 'AFC', 'Australia': 'AFC', 'Bahrain': 'AFC', 'Bangladesh': 'AFC',
  'Bhutan': 'AFC', 'Brunei': 'AFC', 'Cambodia': 'AFC', 'China': 'AFC',
  'Chinese Taipei': 'AFC', 'Guam': 'AFC', 'Hong Kong': 'AFC', 'India': 'AFC',
  'Indonesia': 'AFC', 'Iran': 'AFC', 'Iraq': 'AFC', 'Japan': 'AFC',
  'Jordan': 'AFC', 'Kuwait': 'AFC', 'Kyrgyzstan': 'AFC', 'Laos': 'AFC',
  'Lebanon': 'AFC', 'Macau': 'AFC', 'Malaysia': 'AFC', 'Maldives': 'AFC',
  'Mongolia': 'AFC', 'Myanmar': 'AFC', 'Nepal': 'AFC', 'North Korea': 'AFC',
  'Northern Mariana Islands': 'AFC', 'Oman': 'AFC', 'Pakistan': 'AFC',
  'Palestine': 'AFC', 'Philippines': 'AFC', 'Qatar': 'AFC', 'Saudi Arabia': 'AFC',
  'Singapore': 'AFC', 'South Korea': 'AFC', 'Sri Lanka': 'AFC', 'Syria': 'AFC',
  'Tajikistan': 'AFC', 'Thailand': 'AFC', 'Timor-Leste': 'AFC',
  'Turkmenistan': 'AFC', 'United Arab Emirates': 'AFC', 'Uzbekistan': 'AFC',
  'Vietnam': 'AFC', 'Yemen': 'AFC',
  // State of Palestine (alt name in TopoJSON)
  'State of Palestine': 'AFC',

  // ── OFC (11 members + non-FIFA) ───────────────────────────────────────────
  'American Samoa': 'OFC', 'Cook Islands': 'OFC', 'Fiji': 'OFC',
  'Kiribati': 'OFC', 'Marshall Islands': 'OFC', 'Micronesia': 'OFC',
  'Nauru': 'OFC', 'New Caledonia': 'OFC', 'New Zealand': 'OFC', 'Niue': 'OFC',
  'Norfolk Island': 'OFC', 'Palau': 'OFC', 'Papua New Guinea': 'OFC',
  'Samoa': 'OFC', 'Solomon Islands': 'OFC', 'Tahiti': 'OFC', 'Tonga': 'OFC',
  'Tuvalu': 'OFC', 'Vanuatu': 'OFC',
}

interface Props {
  stats: MapStats
  selectedConf: Confederation | null
  onSelectConf: (conf: Confederation | null) => void
}

export function WorldMap({ stats, selectedConf, onSelectConf }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; conf: string; count: number } | null>(null)

  const confCounts = Object.fromEntries(
    stats.confederations.map(c => [c.confederation, c.player_count])
  )

  useEffect(() => {
    let cancelled = false

    async function drawMap() {
      const [{ geoNaturalEarth1, geoPath, geoGraticule }, { feature }] = await Promise.all([
        import('d3-geo'),
        import('topojson-client'),
      ])

      const topoRes = await fetch(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      )
      const topo = await topoRes.json()

      if (cancelled || !svgRef.current) return

      const svg = svgRef.current
      const W = 800
      const H = 420

      const projection = geoNaturalEarth1()
        .scale(153)
        .translate([400, 215])

      const path = geoPath(projection)
      const countries = feature(topo, topo.objects.countries)

      // Clear
      while (svg.firstChild) svg.removeChild(svg.firstChild)

      // Background
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bg.setAttribute('width', '800')
      bg.setAttribute('height', '420')
      bg.setAttribute('fill', '#0a0f0d')
      svg.appendChild(bg)

      // Graticule
      const graticule = geoGraticule()
      const graticulePath = path(graticule())
      if (graticulePath) {
        const gEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        gEl.setAttribute('d', graticulePath)
        gEl.setAttribute('fill', 'none')
        gEl.setAttribute('stroke', '#1a2520')
        gEl.setAttribute('stroke-width', '0.3')
        svg.appendChild(gEl)
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
        el.style.transition = 'all 0.2s'
        if (conf) el.style.cursor = 'pointer'

        if (conf) {
          el.addEventListener('mouseenter', (e) => {
            el.setAttribute('fill', CONF_COLOURS[conf].stroke)
            const count = confCounts[conf] ?? 0
            const rect = svg.getBoundingClientRect()
            setTooltip({
              x: (e as MouseEvent).clientX - rect.left,
              y: (e as MouseEvent).clientY - rect.top,
              name: name || 'Unknown',
              conf,
              count,
            })
          })
          el.addEventListener('mouseleave', () => {
            el.setAttribute('fill', isDimmed ? '#111' : colours.fill)
            setTooltip(null)
          })
          el.addEventListener('click', () => {
            onSelectConf(selectedConf === conf ? null : conf)
          })
        }

        svg.appendChild(el)
      }

      // Sphere outline
      const spherePath = path({ type: 'Sphere' } as any)
      if (spherePath) {
        const sphere = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        sphere.setAttribute('d', spherePath)
        sphere.setAttribute('fill', 'none')
        sphere.setAttribute('stroke', '#1D9E75')
        sphere.setAttribute('stroke-width', '0.8')
        sphere.setAttribute('opacity', '0.4')
        svg.appendChild(sphere)
      }

      setLoaded(true)
    }

    drawMap().catch(console.error)
    return () => { cancelled = true }
  }, [selectedConf, stats])

  return (
    <div className="relative w-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ height: '420px' }}>
          <p className="text-white/20 text-sm">Loading map…</p>
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full rounded-xl"
        style={{ background: '#0a0f0d', display: 'block' }}
        viewBox="0 0 800 420"
        preserveAspectRatio="xMidYMid meet"
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/90 border border-white/10 rounded-lg px-3 py-2 text-xs z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-medium text-white">{tooltip.name}</p>
          <p className="text-white/40">{tooltip.conf}</p>
          <p className="text-[#1D9E75]">{confCounts[tooltip.conf] ?? 0} players</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-3 px-1">
        {(Object.keys(CONF_COLOURS).filter(k => k !== 'default') as Confederation[]).map(conf => (
          <button
            key={conf}
            onClick={() => onSelectConf(selectedConf === conf ? null : conf)}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: selectedConf && selectedConf !== conf ? 0.35 : 1 }}
          >
            <span className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: CONF_COLOURS[conf as string].stroke }} />
            <span className="text-white/50">{conf}</span>
            <span className="text-white/25">({confCounts[conf] ?? 0})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
