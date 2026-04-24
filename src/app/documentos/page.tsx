import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import DocumentMatrixClient from '@/components/features/documents/DocumentMatrixClient'

// A small loader for the table area
function TableSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse p-8">
      <div className="h-10 bg-gray-200 rounded-xl w-1/4 mb-8"></div>
      <div className="h-64 bg-white border border-gray-100 rounded-2xl shadow-sm"></div>
    </div>
  )
}

async function DocumentDataLayer({ profile, user }: { profile: any, user: any }) {
  const supabase = await createClient()

  // ALL data fetching happens here in parallel
  const [
    departmentsResult,
    userPermissionsResult,
    masterRulesResult,
    documentsResult,
    profilesResult
  ] = await Promise.all([
    supabase.from('departments').select('*').order('name', { ascending: true }),
    supabase.from('permissions').select('department_id, can_view, can_edit, can_approve').eq('user_id', user?.id),
    (profile?.role === 'regular_user')
      ? supabase.from('document_master_matrix').select(`*, department:departments (name), responsible:profiles!assigned_to_profile_id (first_name, last_name, department:departments (name))`).eq('department_id', profile.department_id)
      : supabase.from('document_master_matrix').select(`*, department:departments (name), responsible:profiles!assigned_to_profile_id (first_name, last_name, department:departments (name))`),
    (profile?.role === 'regular_user')
      ? supabase.from('documents').select(`*, uploader:profiles!uploaded_by_user_id (first_name, last_name, department:departments (name)), department:departments (name)`).eq('department_id', profile.department_id).order('created_at', { ascending: false })
      : supabase.from('documents').select(`*, uploader:profiles!uploaded_by_user_id (first_name, last_name, department:departments (name)), department:departments (name)`).order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, first_name, last_name, department_id')
  ])

  return (
    <DocumentMatrixClient 
      initialDocuments={(documentsResult.data as any) || []} 
      masterRules={(masterRulesResult.data as any) || []}
      departments={departmentsResult.data || []}
      profiles={(profilesResult.data as any) || []}
      userRole={profile?.role || 'regular_user'}
      userDeptId={profile?.department_id || null}
      userPermissions={userPermissionsResult.data || []}
    />
  )
}

export default async function DocumentosPage() {
  const supabase = await createClient()

  // 1. Fetch only what's CRITICAL to determine the layout/permissions
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('id, role, department_id').eq('id', user?.id).single()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 2. We could render a Header here that is NOT inside Suspense */}
      <Suspense fallback={<TableSkeleton />}>
        <DocumentDataLayer profile={profile} user={user} />
      </Suspense>
    </div>
  )
}
