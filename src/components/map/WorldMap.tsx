'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapStats, Confederation } from '@/types'

// Confederation colour map
const CONF_COLOURS: Record<string, { fill: string; stroke: string }> = {
  UEFA:     { fill: '#1a3a5c', stroke: '#2a6496' },
  CAF:      { fill: '#3a2a0a', stroke: '#c47d0e' },
  CONMEBOL: { fill: '#0a2a1a', stroke: '#1D9E75' },
  CONCACAF: { fill: '#2a0a3a', stroke: '#8e44ad' },
  AFC:      { fill: '#3a0a0a', stroke: '#c0392b' },
  OFC:      { fill: '#0a2a3a', stroke: '#16a085' },
  default:  { fill: '#1a1a1a', stroke: '#333333' },
}

// Map country names from TopoJSON to confederations
const COUNTRY_CONF: Record<string, Confederation> = {
  // UEFA
  'France': 'UEFA', 'Germany': 'UEFA', 'United Kingdom': 'UEFA', 'Spain': 'UEFA',
  'Italy': 'UEFA', 'Portugal': 'UEFA', 'Netherlands': 'UEFA', 'Belgium': 'UEFA',
  'Poland': 'UEFA', 'Sweden': 'UEFA', 'Norway': 'UEFA', 'Finland': 'UEFA',
  'Denmark': 'UEFA', 'Switzerland': 'UEFA', 'Austria': 'UEFA', 'Czech Republic': 'UEFA',
  'Slovakia': 'UEFA', 'Hungary': 'UEFA', 'Romania': 'UEFA', 'Bulgaria': 'UEFA',
  'Greece': 'UEFA', 'Croatia': 'UEFA', 'Serbia': 'UEFA', 'Bosnia and Herzegovina': 'UEFA',
  'Slovenia': 'UEFA', 'Albania': 'UEFA', 'North Macedonia': 'UEFA', 'Montenegro': 'UEFA',
  'Kosovo': 'UEFA', 'Ukraine': 'UEFA', 'Belarus': 'UEFA', 'Moldova': 'UEFA',
  'Lithuania': 'UEFA', 'Latvia': 'UEFA', 'Estonia': 'UEFA', 'Iceland': 'UEFA',
  'Ireland': 'UEFA', 'Turkey': 'UEFA', 'Russia': 'UEFA', 'Cyprus': 'UEFA',
  'Luxembourg': 'UEFA', 'Malta': 'UEFA', 'Armenia': 'UEFA', 'Georgia': 'UEFA',
  'Azerbaijan': 'UEFA', 'Kazakhstan': 'UEFA',
  // CAF
  'Nigeria': 'CAF', 'Ethiopia': 'CAF', 'Egypt': 'CAF', 'DR Congo': 'CAF',
  'Tanzania': 'CAF', 'Kenya': 'CAF', 'Uganda': 'CAF', 'Algeria': 'CAF',
  'Sudan': 'CAF', 'Morocco': 'CAF', 'Angola': 'CAF', 'Mozambique': 'CAF',
  'Ghana': 'CAF', 'Madagascar': 'CAF', 'Cameroon': 'CAF', 'Côte d\'Ivoire': 'CAF',
  'Niger': 'CAF', 'Burkina Faso': 'CAF', 'Mali': 'CAF', 'Malawi': 'CAF',
  'Zambia': 'CAF', 'Senegal': 'CAF', 'Chad': 'CAF', 'Somalia': 'CAF',
  'Zimbabwe': 'CAF', 'Guinea': 'CAF', 'Rwanda': 'CAF', 'Benin': 'CAF',
  'Burundi': 'CAF', 'Tunisia': 'CAF', 'South Sudan': 'CAF', 'Togo': 'CAF',
  'Sierra Leone': 'CAF', 'Libya': 'CAF', 'Congo': 'CAF', 'Liberia': 'CAF',
  'Central African Republic': 'CAF', 'Mauritania': 'CAF', 'Eritrea': 'CAF',
  'Namibia': 'CAF', 'Gambia': 'CAF', 'Botswana': 'CAF', 'Gabon': 'CAF',
  'Lesotho': 'CAF', 'Guinea-Bissau': 'CAF', 'Equatorial Guinea': 'CAF',
  'Mauritius': 'CAF', 'Eswatini': 'CAF', 'Djibouti': 'CAF', 'Réunion': 'CAF',
  'Comoros': 'CAF', 'Western Sahara': 'CAF', 'Cape Verde': 'CAF',
  'São Tomé and Príncipe': 'CAF', 'Seychelles': 'CAF', 'South Africa': 'CAF',
  // CONMEBOL
  'Brazil': 'CONMEBOL', 'Argentina': 'CONMEBOL', 'Colombia': 'CONMEBOL',
  'Bolivia': 'CONMEBOL', 'Chile': 'CONMEBOL', 'Peru': 'CONMEBOL',
  'Venezuela': 'CONMEBOL', 'Ecuador': 'CONMEBOL', 'Paraguay': 'CONMEBOL',
  'Uruguay': 'CONMEBOL',
  // CONCACAF
  'United States of America': 'CONCACAF', 'Mexico': 'CONCACAF', 'Canada': 'CONCACAF',
  'Guatemala': 'CONCACAF', 'Honduras': 'CONCACAF', 'El Salvador': 'CONCACAF',
  'Nicaragua': 'CONCACAF', 'Costa Rica': 'CONCACAF', 'Panama': 'CONCACAF',
  'Cuba': 'CONCACAF', 'Haiti': 'CONCACAF', 'Dominican Republic': 'CONCACAF',
  'Jamaica': 'CONCACAF', 'Trinidad and Tobago': 'CONCACAF', 'Belize': 'CONCACAF',
  'Puerto Rico': 'CONCACAF', 'Greenland': 'CONCACAF',
  // AFC
  'China': 'AFC', 'India': 'AFC', 'Indonesia': 'AFC', 'Pakistan': 'AFC',
  'Bangladesh': 'AFC', 'Japan': 'AFC', 'Philippines': 'AFC', 'Vietnam': 'AFC',
  'Iran': 'AFC', 'Thailand': 'AFC', 'Myanmar': 'AFC', 'South Korea': 'AFC',
  'Iraq': 'AFC', 'Afghanistan': 'AFC', 'Saudi Arabia': 'AFC', 'Uzbekistan': 'AFC',
  'Malaysia': 'AFC', 'Yemen': 'AFC', 'Nepal': 'AFC', 'North Korea': 'AFC',
  'Syria': 'AFC', 'Sri Lanka': 'AFC', 'Cambodia': 'AFC', 'Jordan': 'AFC',
  'United Arab Emirates': 'AFC', 'Tajikistan': 'AFC',
  'Israel': 'UEFA', 'Laos': 'AFC', 'Singapore': 'AFC', 'Oman': 'AFC',
  'State of Palestine': 'AFC', 'Kuwait': 'AFC', 'Mongolia': 'AFC',
  'Kyrgyzstan': 'AFC', 'Turkmenistan': 'AFC', 'Qatar': 'AFC', 'Bahrain': 'AFC',
  'Timor-Leste': 'AFC', 'Lebanon': 'AFC', 'Brunei': 'AFC',
  'Australia': 'AFC', 'New Zealand': 'OFC',
  // OFC
  'Papua New Guinea': 'OFC', 'Fiji': 'OFC', 'Solomon Islands': 'OFC',
  'Vanuatu': 'OFC', 'Samoa': 'OFC', 'Kiribati': 'OFC', 'Tonga': 'OFC',
  'Micronesia': 'OFC', 'Palau': 'OFC', 'Marshall Islands': 'OFC', 'Tuvalu': 'OFC',
  'Nauru': 'OFC',
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
      // Dynamic imports — only runs client-side
      const [{ geoNaturalEarth1, geoPath }, { feature }] = await Promise.all([
        import('d3-geo'),
        import('topojson-client'),
      ])

      // Fetch Natural Earth 110m TopoJSON from CDN
      const topoRes = await fetch(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      )
      const topo = await topoRes.json()

      // Also fetch country name lookup
      const namesRes = await fetch(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      )

      if (cancelled || !svgRef.current) return

      const svg = svgRef.current
      const width = svg.clientWidth || 800
      const height = svg.clientHeight || 400

      const projection = geoNaturalEarth1()
        .scale(width / 6.5)
        .translate([width / 2, height / 2])

      const path = geoPath(projection)

      // Get countries as GeoJSON features
      const countries = feature(topo, topo.objects.countries)

      // Name lookup from numeric ISO → name using a simple embedded map
      const ISO_NAMES: Record<string, string> = {
        '004': 'Afghanistan', '008': 'Albania', '012': 'Algeria', '024': 'Angola',
        '032': 'Argentina', '036': 'Australia', '040': 'Austria', '050': 'Bangladesh',
        '056': 'Belgium', '068': 'Bolivia', '076': 'Brazil', '100': 'Bulgaria',
        '116': 'Cambodia', '120': 'Cameroon', '124': 'Canada', '140': 'Central African Republic',
        '144': 'Sri Lanka', '152': 'Chile', '156': 'China', '170': 'Colombia',
        '180': 'DR Congo', '188': 'Costa Rica', '191': 'Croatia', '192': 'Cuba',
        '196': 'Cyprus', '203': 'Czech Republic', '208': 'Denmark', '214': 'Dominican Republic',
        '218': 'Ecuador', '818': 'Egypt', '222': 'El Salvador', '232': 'Eritrea',
        '233': 'Estonia', '231': 'Ethiopia', '238': 'Falkland Islands', '246': 'Finland',
        '250': 'France', '266': 'Gabon', '288': 'Ghana', '300': 'Greece',
        '320': 'Guatemala', '324': 'Guinea', '332': 'Haiti', '340': 'Honduras',
        '348': 'Hungary', '356': 'India', '360': 'Indonesia', '364': 'Iran',
        '368': 'Iraq', '372': 'Ireland', '376': 'Israel', '380': 'Italy',
        '388': 'Jamaica', '392': 'Japan', '400': 'Jordan', '398': 'Kazakhstan',
        '404': 'Kenya', '410': 'South Korea', '408': 'North Korea', '414': 'Kuwait',
        '418': 'Laos', '428': 'Latvia', '422': 'Lebanon', '430': 'Liberia',
        '434': 'Libya', '440': 'Lithuania', '442': 'Luxembourg', '454': 'Malawi',
        '458': 'Malaysia', '466': 'Mali', '478': 'Mauritania', '484': 'Mexico',
        '496': 'Mongolia', '504': 'Morocco', '508': 'Mozambique', '516': 'Namibia',
        '524': 'Nepal', '528': 'Netherlands', '540': 'New Caledonia', '554': 'New Zealand',
        '558': 'Nicaragua', '562': 'Niger', '566': 'Nigeria', '578': 'Norway',
        '586': 'Pakistan', '591': 'Panama', '598': 'Papua New Guinea', '600': 'Paraguay',
        '604': 'Peru', '608': 'Philippines', '616': 'Poland', '620': 'Portugal',
        '630': 'Puerto Rico', '634': 'Qatar', '642': 'Romania', '643': 'Russia',
        '646': 'Rwanda', '682': 'Saudi Arabia', '686': 'Senegal', '694': 'Sierra Leone',
        '703': 'Slovakia', '705': 'Slovenia', '706': 'Somalia', '710': 'South Africa',
        '728': 'South Sudan', '724': 'Spain', '729': 'Sudan', '752': 'Sweden',
        '756': 'Switzerland', '760': 'Syria', '764': 'Thailand', '768': 'Togo',
        '780': 'Trinidad and Tobago', '788': 'Tunisia', '792': 'Turkey', '800': 'Uganda',
        '804': 'Ukraine', '784': 'United Arab Emirates', '826': 'United Kingdom',
        '840': 'United States of America', '858': 'Uruguay', '860': 'Uzbekistan',
        '862': 'Venezuela', '704': 'Vietnam', '887': 'Yemen', '894': 'Zambia',
        '716': 'Zimbabwe', '096': 'Brunei', '104': 'Myanmar',
        '072': 'Botswana', '064': 'Bhutan',
      }

      // Clear any previous render
      while (svg.firstChild) svg.removeChild(svg.firstChild)

      // Background
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bg.setAttribute('width', String(width))
      bg.setAttribute('height', String(height))
      bg.setAttribute('fill', '#0a0f0d')
      svg.appendChild(bg)

      // Graticule (grid lines)
      const { geoGraticule } = await import('d3-geo')
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

      // Draw countries
      const featuresArr = (countries as any).features as any[]
      for (const feat of featuresArr) {
        const numId = feat.id?.toString().padStart(3, '0')
        const name = ISO_NAMES[numId] ?? ''
        const conf = COUNTRY_CONF[name] ?? null
        const isSelected = selectedConf === conf
        const isDimmed = selectedConf && conf !== selectedConf

        const colours = conf ? CONF_COLOURS[conf] : CONF_COLOURS.default
        const pathData = path(feat)
        if (!pathData) continue

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', pathData)
        el.setAttribute('fill', isDimmed ? '#111' : colours.fill)
        el.setAttribute('stroke', isDimmed ? '#222' : colours.stroke)
        el.setAttribute('stroke-width', isSelected ? '1.5' : '0.5')
        el.setAttribute('opacity', isDimmed ? '0.3' : '1')
        el.style.cursor = conf ? 'pointer' : 'default'
        el.style.transition = 'all 0.2s'

        if (conf) {
          el.addEventListener('mouseenter', (e) => {
            el.setAttribute('fill', CONF_COLOURS[conf].stroke)
            const count = confCounts[conf] ?? 0
            setTooltip({
              x: (e as MouseEvent).offsetX,
              y: (e as MouseEvent).offsetY,
              name,
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
      const sphere = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const spherePath = path({ type: 'Sphere' } as any)
      if (spherePath) {
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
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/20 text-sm">Loading map…</p>
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full rounded-xl"
        style={{ height: '420px', background: '#0a0f0d' }}
        viewBox="0 0 800 420"
        preserveAspectRatio="xMidYMid meet"
      />
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-black/90 border border-white/10 rounded-lg px-3 py-2 text-xs z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-medium text-white">{tooltip.name}</p>
          <p className="text-white/40">{tooltip.conf}</p>
          <p className="text-[#1D9E75]">{tooltip.count} players</p>
        </div>
      )}
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 px-1">
        {Object.entries(CONF_COLOURS).filter(([k]) => k !== 'default').map(([conf, c]) => (
          <button
            key={conf}
            onClick={() => onSelectConf(selectedConf === conf as Confederation ? null : conf as Confederation)}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: selectedConf && selectedConf !== conf ? 0.35 : 1 }}
          >
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.stroke }} />
            <span className="text-white/50">{conf}</span>
            <span className="text-white/25">({confCounts[conf] ?? 0})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
