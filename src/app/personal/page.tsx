import { createClient } from '@/utils/supabase/server'
import PersonnelClient from '@/components/features/personnel/PersonnelClient'

export default async function PersonalPage() {
  const supabase = await createClient()

  // 1. User & Privacy
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user?.id).single()

  // 2. Fetch Departments for Modals
  const { data: departments } = await supabase.from('departments').select('*').order('name', { ascending: true })

  // 3. Fetch Personnel with SECURITY ENFORCEMENT
  let query = supabase.from('personal_records').select('*')
  
  if (profile?.role === 'regular_user' && profile.department_id) {
    // TIER 3: Only manage personnel from their own department
    query = query.eq('department_id', profile.department_id)
  }

  const { data: records } = await query.order('last_name', { ascending: true })

  return (
    <div className="min-h-full bg-gray-50 pt-8">
      <PersonnelClient 
        initialRecords={(records as any) || []} 
        departments={departments || []}
        userRole={profile?.role || 'regular_user'}
        userDeptId={profile?.department_id || null}
      />
    </div>
  )
}
