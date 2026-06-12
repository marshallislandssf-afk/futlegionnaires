import { requireSuperAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { TeamClient } from '@/components/admin/TeamClient'

export default async function TeamPage() {
  await requireSuperAdmin()
  const supabase = createServerSupabaseClient()

  const [{ data: members }, { data: pendingInvites }, { data: territories }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select(`*, user_countries(country)`)
      .order('created_at'),
    supabase
      .from('invites')
      .select('*')
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('territories')
      .select('name, confederation, is_fifa_member')
      .order('name'),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-0.5">Team</h1>
        <p className="text-white/30 text-sm">Invite country managers and manage their country access</p>
      </div>
      <TeamClient
        members={members ?? []}
        pendingInvites={pendingInvites ?? []}
        territories={territories ?? []}
      />
    </div>
  )
}
