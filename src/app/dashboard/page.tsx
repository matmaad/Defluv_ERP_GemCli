import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/features/dashboard/DashboardClient'

// Loader sutil para el dashboard
function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-white rounded-3xl border border-gray-100 shadow-sm"></div>
        <div className="h-96 bg-white rounded-3xl border border-gray-100 shadow-sm"></div>
      </div>
    </div>
  )
}

async function DashboardDataLayer({ user, profile }: { user: any, profile: any }) {
  const supabase = await createClient()
  const isRegularUser = profile?.role === 'regular_user'
  const now = new Date().toISOString()

  const [
    docsResult,
    tasksResult,
    pendingDocsResult,
    departmentsResult,
    profilesResult
  ] = await Promise.all([
    (isRegularUser && profile?.department_id) 
      ? supabase.from('documents').select('current_status, department_id').eq('department_id', profile.department_id)
      : supabase.from('documents').select('current_status, department_id'),
    
    (isRegularUser)
      ? supabase.from('tasks').select('*, department:departments (name), responsible:profiles!assigned_to_user_id (first_name, last_name)').eq('assigned_to_user_id', user?.id).order('due_date', { ascending: true }).limit(10)
      : supabase.from('tasks').select('*, department:departments (name), responsible:profiles!assigned_to_user_id (first_name, last_name)').order('due_date', { ascending: true }).limit(10),

    (isRegularUser && profile?.department_id)
      ? supabase.from('documents').select('id, title, due_date, document_type, department:departments (name)').not('due_date', 'is', null).is('storage_path', null).gte('due_date', now).eq('department_id', profile.department_id).order('due_date', { ascending: true }).limit(10)
      : supabase.from('documents').select('id, title, due_date, document_type, department:departments (name)').not('due_date', 'is', null).is('storage_path', null).gte('due_date', now).order('due_date', { ascending: true }).limit(10),

    supabase.from('departments').select('id, name').order('name', { ascending: true }),
    supabase.from('profiles').select('id, first_name, last_name, department_id')
  ])

  const deadlines = pendingDocsResult.data?.map(doc => ({
    id: doc.id,
    name: doc.title,
    type: (doc.department as any)?.name || doc.document_type || 'DOCUMENTO',
    due_date: doc.due_date
  })) || []

  return (
    <DashboardClient 
      allDocs={docsResult.data || []}
      tasks={(tasksResult.data as any) || []} 
      deadlines={deadlines as any}
      userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
      userRole={profile?.role || 'regular_user'}
      userId={user?.id || ''}
      departments={departmentsResult.data || []}
      users={(profilesResult.data as any) || []}
    />
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, department_id')
    .eq('id', user?.id)
    .single()

  return (
    <div className="min-h-full bg-gray-50/50">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLayer user={user} profile={profile} />
      </Suspense>
    </div>
  )
}
