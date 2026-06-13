import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Play, CheckCircle } from 'lucide-react'
import type { Player } from '@/types'

const FLAG_MAP: Record<string, string> = {
  // British home nations
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Northern Ireland': '🇬🇧',
  // UEFA
  France: '🇫🇷', Germany: '🇩🇪', Spain: '🇪🇸', Italy: '🇮🇹',
  Portugal: '🇵🇹', Netherlands: '🇳🇱', Belgium: '🇧🇪', Switzerland: '🇨🇭',
  Austria: '🇦🇹', Sweden: '🇸🇪', Norway: '🇳🇴', Denmark: '🇩🇰',
  Finland: '🇫🇮', Poland: '🇵🇱', Ukraine: '🇺🇦', Russia: '🇷🇺',
  Turkey: '🇹🇷', Greece: '🇬🇷', Croatia: '🇭🇷', Serbia: '🇷🇸',
  Romania: '🇷🇴', Hungary: '🇭🇺', Czechia: '🇨🇿', Slovakia: '🇸🇰',
  Bulgaria: '🇧🇬', Slovenia: '🇸🇮', Albania: '🇦🇱', Kosovo: '🇽🇰',
  'North Macedonia': '🇲🇰', Montenegro: '🇲🇪', 'Bosnia and Herzegovina': '🇧🇦',
  Ireland: '🇮🇪', 'Republic of Ireland': '🇮🇪', Iceland: '🇮🇸',
  Luxembourg: '🇱🇺', Malta: '🇲🇹', Cyprus: '🇨🇾', Israel: '🇮🇱',
  Armenia: '🇦🇲', Georgia: '🇬🇪', Azerbaijan: '🇦🇿', Kazakhstan: '🇰🇿',
  Moldova: '🇲🇩', Estonia: '🇪🇪', Latvia: '🇱🇻', Lithuania: '🇱🇹',
  Belarus: '🇧🇾', 'Czech Republic': '🇨🇿',
  // CAF
  Morocco: '🇲🇦', Algeria: '🇩🇿', Tunisia: '🇹🇳', Egypt: '🇪🇬',
  Libya: '🇱🇾', Sudan: '🇸🇩', Nigeria: '🇳🇬', Ghana: '🇬🇭',
  Senegal: '🇸🇳', 'Ivory Coast': '🇨🇮', Cameroon: '🇨🇲', Mali: '🇲🇱',
  'Burkina Faso': '🇧🇫', Guinea: '🇬🇳', Niger: '🇳🇪', Benin: '🇧🇯',
  Togo: '🇹🇬', 'Sierra Leone': '🇸🇱', Liberia: '🇱🇷', Gambia: '🇬🇲',
  'Guinea-Bissau': '🇬🇼', 'Cabo Verde': '🇨🇻', Mauritania: '🇲🇷',
  'Equatorial Guinea': '🇬🇶', Gabon: '🇬🇦', Congo: '🇨🇬',
  'DR Congo': '🇨🇩', Angola: '🇦🇴', 'Central African Republic': '🇨🇫',
  Chad: '🇹🇩', Ethiopia: '🇪🇹', Eritrea: '🇪🇷', Djibouti: '🇩🇯',
  Somalia: '🇸🇴', Kenya: '🇰🇪', Uganda: '🇺🇬', Tanzania: '🇹🇿',
  Rwanda: '🇷🇼', Burundi: '🇧🇮', 'South Sudan': '🇸🇸',
  Mozambique: '🇲🇿', Zimbabwe: '🇿🇼', Zambia: '🇿🇲', Malawi: '🇲🇼',
  'South Africa': '🇿🇦', Namibia: '🇳🇦', Botswana: '🇧🇼',
  Lesotho: '🇱🇸', Eswatini: '🇸🇿', Madagascar: '🇲🇬',
  Mauritius: '🇲🇺', Seychelles: '🇸🇨', Comoros: '🇰🇲',
  'Sao Tome and Principe': '🇸🇹',
  // CONMEBOL
  Brazil: '🇧🇷', Argentina: '🇦🇷', Colombia: '🇨🇴', Chile: '🇨🇱',
  Uruguay: '🇺🇾', Peru: '🇵🇪', Ecuador: '🇪🇨', Venezuela: '🇻🇪',
  Bolivia: '🇧🇴', Paraguay: '🇵🇾',
  // CONCACAF
  'United States': '🇺🇸', Canada: '🇨🇦', Mexico: '🇲🇽',
  Jamaica: '🇯🇲', Haiti: '🇭🇹', 'Trinidad and Tobago': '🇹🇹',
  Cuba: '🇨🇺', 'Dominican Republic': '🇩🇴', Guatemala: '🇬🇹',
  Honduras: '🇭🇳', 'El Salvador': '🇸🇻', Nicaragua: '🇳🇮',
  'Costa Rica': '🇨🇷', Panama: '🇵🇦', Belize: '🇧🇿',
  Barbados: '🇧🇧', Guyana: '🇬🇾', Suriname: '🇸🇷',
  Curacao: '🇨🇼', Guadeloupe: '🇬🇵', Martinique: '🇲🇶',
  'French Guiana': '🇬🇫', Grenada: '🇬🇩',
  'Saint Kitts and Nevis': '🇰🇳', 'Saint Lucia': '🇱🇨',
  'Saint Vincent and the Grenadines': '🇻🇨', Bermuda: '🇧🇲',
  // AFC
  Japan: '🇯🇵', 'South Korea': '🇰🇷', China: '🇨🇳', Australia: '🇦🇺',
  Iran: '🇮🇷', 'Saudi Arabia': '🇸🇦', Qatar: '🇶🇦', UAE: '🇦🇪',
  'United Arab Emirates': '🇦🇪', Iraq: '🇮🇶', Jordan: '🇯🇴',
  Kuwait: '🇰🇼', Bahrain: '🇧🇭', Oman: '🇴🇲', Yemen: '🇾🇪',
  Syria: '🇸🇾', Lebanon: '🇱🇧', Palestine: '🇵🇸',
  India: '🇮🇳', Pakistan: '🇵🇰', Bangladesh: '🇧🇩',
  'Sri Lanka': '🇱🇰', Nepal: '🇳🇵', Afghanistan: '🇦🇫',
  Indonesia: '🇮🇩', Philippines: '🇵🇭', Vietnam: '🇻🇳',
  Thailand: '🇹🇭', Malaysia: '🇲🇾', Singapore: '🇸🇬',
  Myanmar: '🇲🇲', Cambodia: '🇰🇭', Laos: '🇱🇦',
  'Timor-Leste': '🇹🇱', Brunei: '🇧🇳', Mongolia: '🇲🇳',
  Uzbekistan: '🇺🇿', Kazakhstan: '🇰🇿', Kyrgyzstan: '🇰🇬',
  Tajikistan: '🇹🇯', Turkmenistan: '🇹🇲',
  'North Korea': '🇰🇵', 'Hong Kong': '🇭🇰',
  // OFC
  'New Zealand': '🇳🇿', 'Papua New Guinea': '🇵🇬', Fiji: '🇫🇯',
  Vanuatu: '🇻🇺', 'Solomon Islands': '🇸🇧', Samoa: '🇼🇸',
  Tonga: '🇹🇴', Kiribati: '🇰🇮', Tuvalu: '🇹🇻',
  'Marshall Islands': '🇲🇭', Nauru: '🇳🇷', Palau: '🇵🇼',
}

export function flag(nationality: string): string {
  return FLAG_MAP[nationality] ?? '🌐'
}

function Initials({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-full h-full flex items-center justify-center text-[#1D9E75] font-semibold text-lg bg-[#1D9E75]/10">
      {initials}
    </div>
  )
}

export function PlayerCard({ player }: { player: Player }) {
  const nationalities = [
    player.nationality_1,
    player.nationality_2,
    player.nationality_3,
    player.nationality_4,
    player.nationality_5,
  ].filter(Boolean) as string[]

  return (
    <Link
      href={`/player/${player.slug}`}
      className="group block bg-white/[0.04] border border-white/10 rounded-xl p-4 hover:border-[#1D9E75]/40 hover:bg-white/[0.06] transition-all duration-150"
    >
      {/* Avatar */}
      <div className="w-14 h-14 rounded-full overflow-hidden mb-3 border border-white/10 flex-shrink-0">
        {player.profile_image_url ? (
          <Image
            src={player.profile_image_url}
            alt={player.name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <Initials name={player.name} />
        )}
      </div>

      {/* Name + verified */}
      <div className="flex items-start gap-1.5 mb-0.5">
        <span className="text-sm font-medium leading-tight line-clamp-1">{player.name}</span>
        {player.is_verified && (
          <CheckCircle size={13} className="text-[#1D9E75] mt-0.5 flex-shrink-0" />
        )}
      </div>

      {/* Club */}
      <p className="text-xs text-white/40 mb-2 line-clamp-1">
        {player.current_club} · {player.current_club_country}
      </p>

      {/* Position badge */}
      <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] mb-2.5">
        {player.position}
      </span>

      {/* Nationality flags */}
      <div className="flex gap-1 flex-wrap mb-2.5">
        {nationalities.map((nat, i) => (
          <span key={nat} title={nat} className="text-base" aria-label={nat}>
            {flag(nat)}
          </span>
        ))}
      </div>

      {/* Meta */}
      <p className="text-[11px] text-white/30 mb-2.5">
        Born {new Date(player.date_of_birth).getFullYear()} · Age {player.age}
      </p>

      {/* Quick links */}
      <div className="flex gap-3">
        {player.instagram_url && (
          <a
            href={player.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#1D9E75] transition-colors"
            aria-label="Instagram profile"
          >
            <Instagram size={12} />
            <span>Instagram</span>
          </a>
        )}
        {(player.video_urls?.length || player.youtube_url) && (
          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <Play size={12} />
            <span>Video</span>
          </span>
        )}
      </div>
    </Link>
  )
}
