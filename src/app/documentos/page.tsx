import { createClient } from '@/utils/supabase/server'
import DocumentMatrixClient from '@/components/features/documents/DocumentMatrixClient'

export default async function DocumentosPage() {
  const supabase = await createClient()

  // 1. User & Profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user?.id).single()

  // 2. Fetch Departments for all filters
  const { data: departments } = await supabase.from('departments').select('*').order('name', { ascending: true })

  // 3. Fetch Master Rules (The "Standard")
  let masterQuery = supabase.from('document_master_matrix').select(`
    *,
    department:departments (name),
    responsible:profiles!assigned_to_profile_id (first_name, last_name)
  `)
  if (profile?.role === 'regular_user') {
    masterQuery = masterQuery.eq('department_id', profile.department_id)
  }
  const { data: masterRules } = await masterQuery

  // 4. Fetch Uploaded Documents (The "History") with Privacy
  let docQuery = supabase.from('documents').select(`
    *,
    uploader:profiles!uploaded_by_user_id (first_name, last_name),
    department:departments (name)
  `)
  
  if (profile?.role === 'regular_user') {
    docQuery = docQuery.eq('department_id', profile.department_id)
  }
  const { data: documents } = await docQuery.order('created_at', { ascending: false })

  // 5. Profiles for assignment in Admin Panel
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department_id')

  return (
    <DocumentMatrixClient 
      initialDocuments={(documents as any) || []} 
      masterRules={(masterRules as any) || []}
      departments={departments || []}
      profiles={(profiles as any) || []}
      userRole={profile?.role || 'regular_user'}
      userDeptId={profile?.department_id || null}
    />
  )
}
