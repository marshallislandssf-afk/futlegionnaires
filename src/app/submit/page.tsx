import { createServerSupabaseClient } from '@/lib/supabase'
import { SubmitFormClient } from '@/components/players/SubmitFormClient'

export const metadata = {
  title: 'Submit a Player — FutLegionnaires',
  description: 'Submit a dual-heritage player profile to be listed in the FutLegionnaires database.',
}

export default async function SubmitPage() {
  const supabase = createServerSupabaseClient()
  const { data: territories } = await supabase
    .from('territories')
    .select('name, confederation, is_fifa_member')
    .order('name')

  return <SubmitFormClient territories={territories ?? []} />
}
