import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/features/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // 1. Fetch raw documents for dynamic KPI calculation on client
  const { data: allDocs } = await supabase
    .from('documents')
    .select('current_status, department_id')

  // 2. Fetch real Tasks with relations
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      department:departments (name),
      responsible:profiles!assigned_to_user_id (first_name, last_name)
    `)
    .order('due_date', { ascending: true })
    .limit(10)

  // 3. Fetch real Deadlines
  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(5)

  // 4. Fetch Departments and Users for Task Modal and Filtering
  const { data: departments } = await supabase.from('departments').select('id, name').order('name', { ascending: true })
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department_id')

  // Type-safe map for profiles to match DashboardClient expected props
  const formattedProfiles = profiles?.map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    department_id: p.department_id
  })) || []

  return (
    <DashboardClient 
      allDocs={allDocs || []}
      tasks={(tasks as any) || []} 
      deadlines={deadlines || []}
      userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
      userRole={profile?.role || 'regular_user'}
      userId={user?.id || ''}
      departments={departments || []}
      users={formattedProfiles}
    />
  )
}
