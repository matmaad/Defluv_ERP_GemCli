import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/features/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, department_id')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // PRIVACY ENFORCEMENT: Filter based on user permissions
  // If Regular User, filter by their department. If Admin/Sub-Admin, show more.
  const isRegularUser = profile?.role === 'regular_user'
  
  let docsQuery = supabase.from('documents').select('current_status, department_id')
  if (isRegularUser && profile?.department_id) {
    docsQuery = docsQuery.eq('department_id', profile.department_id)
  }
  const { data: allDocs } = await docsQuery

  // Fetch real Tasks with relations (Filtered if regular user)
  let tasksQuery = supabase.from('tasks').select(`
    *,
    department:departments (name),
    responsible:profiles!assigned_to_user_id (first_name, last_name)
  `)
  if (isRegularUser) {
    tasksQuery = tasksQuery.eq('assigned_to_user_id', user?.id)
  }
  const { data: tasks } = await tasksQuery.order('due_date', { ascending: true }).limit(10)

  // Fetch Pending Document Deadlines (Filtered if regular user)
  const now = new Date().toISOString()
  let pendingQuery = supabase.from('documents').select(`
    id, title, due_date, document_type, department:departments (name)
  `).not('due_date', 'is', null).is('storage_path', null).gte('due_date', now)
  
  if (isRegularUser && profile?.department_id) {
    pendingQuery = pendingQuery.eq('department_id', profile.department_id)
  }
  const { data: pendingDocs } = await pendingQuery.order('due_date', { ascending: true }).limit(10)

  const deadlines = pendingDocs?.map(doc => ({
    id: doc.id,
    name: doc.title,
    type: (doc.department as any)?.name || doc.document_type || 'DOCUMENTO',
    due_date: doc.due_date
  })) || []

  // Metadata for modals
  const { data: departments } = await supabase.from('departments').select('id, name').order('name', { ascending: true })
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department_id')

  return (
    <DashboardClient 
      allDocs={allDocs || []}
      tasks={(tasks as any) || []} 
      deadlines={deadlines as any}
      userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
      userRole={profile?.role || 'regular_user'}
      userId={user?.id || ''}
      departments={departments || []}
      users={(profiles as any) || []}
    />
  )
}
