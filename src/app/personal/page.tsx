import { createClient } from '@/utils/supabase/server'
import PersonnelClient from '@/components/features/personnel/PersonnelClient'

export default async function PersonnelPage() {
  const supabase = await createClient()

  // 1. Fetch current user role
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let currentUserRole = 'regular_user'
  
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()
    if (profile) currentUserRole = profile.role
  }

  // 2. Fetch real personal records
  const { data: records } = await supabase
    .from('personal_records')
    .select('*')
    .order('last_name', { ascending: true })

  return (
    <PersonnelClient 
      records={records || []} 
      userRole={currentUserRole}
    />
  )
}
