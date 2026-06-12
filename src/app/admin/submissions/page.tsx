import { requireAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SubmissionReviewClient } from '@/components/admin/SubmissionReviewClient'

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

  // Country managers only see submissions for their countries
  if (user.role === 'country_manager' && user.countries.length > 0) {
    query = query.or(
      user.countries.flatMap(c => [`nationality_1.eq.${c}`, `nationality_2.eq.${c}`]).join(',')
    )
  }

  const { data: submissions } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-0.5">Submissions</h1>
          <p className="text-white/30 text-sm">
            {submissions?.length ?? 0} {status} submission{submissions?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Status tabs */}
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
      <SubmissionReviewClient
        submissions={submissions ?? []}
        userRole={user.role}
      />
    </div>
  )
}
