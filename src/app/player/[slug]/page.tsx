import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Play, ExternalLink, ChevronLeft, CheckCircle } from 'lucide-react'
import { Nav } from '@/components/layout/Nav'
import { getPlayerBySlug } from '@/lib/players'
import { flag } from '@/components/players/PlayerCard'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const player = await getPlayerBySlug(params.slug)
  if (!player) return { title: 'Player not found — FutLegionnaires' }
  return {
    title: `${player.name} — FutLegionnaires`,
    description: `${player.name} plays for ${player.current_club}. Dual heritage: ${[player.nationality_1, player.nationality_2].filter(Boolean).join(' & ')}.`,
    openGraph: {
      images: player.profile_image_url ? [player.profile_image_url] : [],
    },
  }
}

function InfoField({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="bg-white/[0.04] rounded-lg px-4 py-3">
      <div className="text-[11px] text-white/30 mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export default async function PlayerPage({ params }: { params: { slug: string } }) {
  const player = await getPlayerBySlug(params.slug)
  if (!player) notFound()

  const nationalities = [
    player.nationality_1, player.nationality_2, player.nationality_3,
    player.nationality_4, player.nationality_5,
  ].filter(Boolean) as string[]

  const videos = [
    ...(player.video_urls ?? []),
    ...(player.youtube_url ? [player.youtube_url] : []),
  ]

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/players" className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 mb-6 transition-colors">
          <ChevronLeft size={15} /> Back to players
        </Link>

        <div className="grid sm:grid-cols-[auto,1fr] gap-6 mb-8">
          {/* Photo */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-[#1D9E75]/10 flex items-center justify-center">
            {player.profile_image_url ? (
              <Image
                src={player.profile_image_url}
                alt={player.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-[#1D9E75]">
                {player.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold">{player.name}</h1>
              {player.is_verified && (
                <CheckCircle size={18} className="text-[#1D9E75]" aria-label="Verified profile" />
              )}
            </div>
            <p className="text-white/40 text-sm mb-3">
              {player.current_club} · {player.current_club_country} · {player.current_club_confederation}
            </p>

            {/* Nationality badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {nationalities.map((nat, i) => (
                <span
                  key={nat}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border ${
                    i === 0
                      ? 'bg-[#1D9E75]/10 border-[#1D9E75]/30 text-[#1D9E75]'
                      : 'bg-white/[0.04] border-white/10 text-white/60'
                  }`}
                >
                  <span>{flag(nat)}</span>
                  <span>{nat}</span>
                  {i === 0 && <span className="text-[10px] opacity-60">(primary)</span>}
                </span>
              ))}
            </div>

            {/* Social links */}
            <div className="flex flex-wrap gap-2">
              {player.instagram_url && (
                <a
                  href={player.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:border-[#1D9E75]/40 hover:text-[#1D9E75] transition-colors"
                >
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {player.transfermarkt_url && (
                <a
                  href={player.transfermarkt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:border-[#1D9E75]/40 hover:text-[#1D9E75] transition-colors"
                >
                  <ExternalLink size={14} /> Transfermarkt
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <InfoField label="Position" value={player.position} />
          <InfoField label="Date of birth" value={player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
          <InfoField label="Age" value={player.age} />
          <InfoField label="Status" value={player.status} />
          {player.height_cm && <InfoField label="Height" value={`${player.height_cm} cm`} />}
          {player.birth_location && <InfoField label="Born in" value={player.birth_location} />}
        </div>

        {/* Video highlights */}
        {videos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-3">Video highlights</h2>
            <div className="flex flex-wrap gap-2">
              {videos.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 hover:border-[#1D9E75]/40 hover:text-[#1D9E75] transition-colors"
                >
                  <Play size={13} /> Clip {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {player.description && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium mb-3">About</h2>
            <p className="text-sm text-white/60 leading-relaxed">{player.description}</p>
          </div>
        )}
      </main>
    </div>
  )
}
