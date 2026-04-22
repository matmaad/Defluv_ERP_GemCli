import { createClient } from '@/utils/supabase/server'
import DocumentMatrixClient from '@/components/features/documents/DocumentMatrixClient'

export default async function DocumentosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user?.id).single()

  // 1. Fetch departments for filters
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  // 2. Fetch documents with PRIVACY ENFORCEMENT
  let query = supabase
    .from('documents')
    .select(`
      *,
      uploader:profiles!uploaded_by_user_id (first_name, last_name),
      department:departments (name)
    `)
  
  if (profile?.role === 'regular_user') {
    // TIER 3: Only see documents from departments where they have 'can_view' permission
    const { data: allowedDepts } = await supabase
      .from('permissions')
      .select('department_id')
      .eq('user_id', user?.id)
      .eq('can_view', true)
    
    const allowedIds = allowedDepts?.map(p => p.department_id) || []
    query = query.in('department_id', allowedIds)
  }

  const { data: documents } = await query.order('created_at', { ascending: false })

  return (
    <DocumentMatrixClient 
      initialDocuments={documents || []} 
      departments={departments || []}
      userRole={profile?.role || 'regular_user'}
    />
  )
}
