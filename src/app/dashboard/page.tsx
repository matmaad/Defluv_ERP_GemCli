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

  // 3. Fetch Pending Document Deadlines (The "Smart Deadlines")
  // Documents with due_date in future but NO storage_path (no file uploaded yet)
  const now = new Date().toISOString()
  const { data: pendingDocs } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      due_date,
      document_type,
      department:departments (name)
    `)
    .not('due_date', 'is', null)
    .is('storage_path', null) // No file yet
    .gte('due_date', now)     // Not yet expired
    .order('due_date', { ascending: true })
    .limit(10)

  // Transform pendingDocs to match the visual expectation of "deadlines"
  const deadlines = pendingDocs?.map(doc => ({
    id: doc.id,
    name: doc.title,
    type: (doc.department as any)?.name || doc.document_type || 'DOCUMENTO',
    due_date: doc.due_date
  })) || []

  // 4. Fetch Departments and Users for Task Modal and Filtering
  const { data: departments } = await supabase.from('departments').select('id, name').order('name', { ascending: true })
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department_id')

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
      deadlines={deadlines as any}
      userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
      userRole={profile?.role || 'regular_user'}
      userId={user?.id || ''}
      departments={departments || []}
      users={formattedProfiles}
    />
  )
}
