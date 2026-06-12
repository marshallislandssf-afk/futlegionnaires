import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SubmissionReviewClient } from '@/components/admin/SubmissionReviewClient'

interface Submission {
  id: string
  created_at: string
  status: string
  name: string
  date_of_birth?: string
  position?: string
  current_club?: string
  current_club_country?: string
  nationality_1: string
  nationality_2?: string
  nationality_3?: string
  nationality_4?: string
  nationality_5?: string
  instagram_url?: string
  transfermarkt_url?: string
  video_urls?: string[]
  description?: string
  submitter_email: string
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const user = await requireAdmin()
  const supabase = createServerSupabaseClient()
  const status = searchParams.status ?? 'pending'

  let query = supabase
    .from('player_submissions')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  if (user.role === 'country_manager' && user.countries.length > 0) {
    query = query.or(
      user.countries.flatMap(c => [`nationality_1.eq.${c}`, `nationality_2.eq.${c}`]).join(',')
    )
  }

  const { data: rawSubmissions } = await query
  const submissions = (rawSubmissions ?? []) as unknown as Submission[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-0.5">Submissions</h1>
          <p className="text-white/30 text-sm">
            {submissions.length} {status} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          {['pending','approved','rejected'].map(s => (
            <a key={s} href={`?status=${s}`}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                status === s
                  ? 'bg-[#1D9E75]/15 text-[#1D9E75]'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}>{s}</a>
          ))}
        </div>
      </div>
      <SubmissionReviewClient submissions={submissions} userRole={user.role} />
    </div>
  )
}
