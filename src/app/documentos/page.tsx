import { createClient } from '@/utils/supabase/server'
import DocumentMatrixClient from '@/components/features/documents/DocumentMatrixClient'

export default async function DocumentosPage() {
  const supabase = await createClient()

  // 1. User & Profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('id, role, department_id').eq('id', user?.id).single()

  // 2. Fetch Departments
  const { data: departments } = await supabase.from('departments').select('*').order('name', { ascending: true })

  // 3. Fetch User Permissions (To enforce can_edit in UI)
  const { data: userPermissions } = await supabase
    .from('permissions')
    .select('department_id, can_view, can_edit, can_approve')
    .eq('user_id', user?.id)

  // 4. Fetch Master Rules (The "Standard")
  let masterQuery = supabase.from('document_master_matrix').select(`
    *,
    department:departments (name),
    responsible:profiles!assigned_to_profile_id (first_name, last_name)
  `)
  if (profile?.role === 'regular_user') {
    masterQuery = masterQuery.eq('department_id', profile.department_id)
  }
  const { data: masterRules } = await masterQuery

  // 5. Fetch Uploaded Documents (The "History")
  let docQuery = supabase.from('documents').select(`
    *,
    uploader:profiles!uploaded_by_user_id (first_name, last_name),
    department:departments (name)
  `)
  
  if (profile?.role === 'regular_user') {
    docQuery = docQuery.eq('department_id', profile.department_id)
  }
  const { data: documents } = await docQuery.order('created_at', { ascending: false })

  // 6. Profiles for Admin Panel
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department_id')

  return (
    <DocumentMatrixClient 
      initialDocuments={(documents as any) || []} 
      masterRules={(masterRules as any) || []}
      departments={departments || []}
      profiles={(profiles as any) || []}
      userRole={profile?.role || 'regular_user'}
      userDeptId={profile?.department_id || null}
      userPermissions={userPermissions || []}
    />
  )
}
