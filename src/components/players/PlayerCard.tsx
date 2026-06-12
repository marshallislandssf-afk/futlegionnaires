import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Play, CheckCircle } from 'lucide-react'
import type { Player } from '@/types'

const FLAG_MAP: Record<string, string> = {
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  France: '🇫🇷', Germany: '🇩🇪', Spain: '🇪🇸', Italy: '🇮🇹',
  Portugal: '🇵🇹', Netherlands: '🇳🇱', Belgium: '🇧🇪',
  Morocco: '🇲🇦', Algeria: '🇩🇿', Nigeria: '🇳🇬', Ghana: '🇬🇭',
  Senegal: '🇸🇳', Egypt: '🇪🇬', Cameroon: '🇨🇲', Mali: '🇲🇱',
  'Ivory Coast': '🇨🇮', 'Equatorial Guinea': '🇬🇶', Liberia: '🇱🇷',
  Brazil: '🇧🇷', Argentina: '🇦🇷', Colombia: '🇨🇴',
  Canada: '🇨🇦', 'United States': '🇺🇸', Mexico: '🇲🇽', Jamaica: '🇯🇲',
  Japan: '🇯🇵', 'South Korea': '🇰🇷', Australia: '🇦🇺',
  'Saudi Arabia': '🇸🇦', Turkey: '🇹🇷',
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
