import { requireSuperAdmin } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { TeamClient } from '@/components/admin/TeamClient'

interface TeamMember {
  id: string
  email: string
  full_name?: string
  role: string
  is_active: boolean
  created_at: string
  user_countries: { country: string }[]
}

interface PendingInvite {
  id: string
  email: string
  role: string
  countries: string[]
  created_at: string
  expires_at: string
}

interface Territory {
  name: string
  confederation: string
  is_fifa_member: boolean
}

export default async function TeamPage() {
  await requireSuperAdmin()
  const supabase = createServerSupabaseClient()

  const [{ data: rawMembers }, { data: rawInvites }, { data: rawTerritories }] = await Promise.all([
    supabase.from('user_profiles').select(`*, user_countries(country)`).order('created_at'),
    supabase.from('invites').select('*').is('accepted_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
    supabase.from('territories').select('name, confederation, is_fifa_member').order('name'),
  ])

  const members = (rawMembers ?? []) as unknown as TeamMember[]
  const pendingInvites = (rawInvites ?? []) as unknown as PendingInvite[]
  const territories = (rawTerritories ?? []) as unknown as Territory[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-0.5">Team</h1>
        <p className="text-white/30 text-sm">Invite country managers and manage their country access</p>
      </div>
      <TeamClient
        members={members}
        pendingInvites={pendingInvites}
        territories={territories}
      />
    </div>
  )
}
