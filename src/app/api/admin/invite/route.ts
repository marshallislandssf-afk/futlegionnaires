import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createAuthClient } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getAdminUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { email, countries } = await request.json()
  if (!email || !countries?.length) {
    return NextResponse.json({ error: 'email and countries required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Upsert invite record (idempotent — re-inviting the same email refreshes it)
  const { data: rawInvite, error: inviteError } = await supabase
    .from('invites')
    .upsert({
      email,
      role: 'country_manager',
      countries,
      invited_by: user.id,
      accepted_at: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    } as any, { onConflict: 'email' })
    .select()
    .single()
  const invite = rawInvite as unknown as { id: string; email: string; countries: string[] } | null

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Send the magic link via Supabase Auth
  // shouldCreateUser: true here because we want Supabase to create the auth record
  // The handle_new_user trigger will create user_profiles and assign countries
  const authClient = createAuthClient()
  const { error: authError } = await authClient.auth.admin.inviteUserByEmail(email, {
    data: { invited_by: user.id },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (authError) {
    // Clean up the invite if the auth call failed
    if (invite?.id) await supabase.from('invites').delete().eq('id', invite.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, invite }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const user = await getAdminUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(request.url)
  const inviteId = searchParams.get('id')

  if (inviteId) {
    // Cancel a pending invite
    await supabase.from('invites').delete().eq('id', inviteId)
    return NextResponse.json({ success: true })
  }

  // Revoke an active user's access
  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  await supabase.from('user_profiles').update({ is_active: false } as any).eq('id', user_id)
  return NextResponse.json({ success: true })
}
