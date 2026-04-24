import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import AuditClient from '@/components/features/audit/AuditClient'

function AuditSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex gap-4 mb-8">
        <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
      </div>
      <div className="h-[600px] bg-white border border-gray-100 rounded-2xl shadow-sm"></div>
    </div>
  )
}

async function AuditDataLayer({ profile }: { profile: any }) {
  const supabase = await createClient()

  const [profilesResult, logsResult] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name'),
    (profile?.role === 'regular_user')
      ? supabase.from('audit_logs').select(`*, user:profiles!user_id (first_name, last_name, department_id)`).eq('user.department_id', profile.department_id).order('timestamp', { ascending: false }).limit(500)
      : supabase.from('audit_logs').select(`*, user:profiles!user_id (first_name, last_name, department_id)`).order('timestamp', { ascending: false }).limit(500)
  ])

  return (
    <AuditClient 
      initialLogs={(logsResult.data as any) || []} 
      profiles={profilesResult.data || []}
      userRole={profile?.role || 'regular_user'}
    />
  )
}

export default async function AuditoriaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user?.id).single()

  return (
    <div className="min-h-full bg-gray-50 pt-8">
      <Suspense fallback={<AuditSkeleton />}>
        <AuditDataLayer profile={profile} />
      </Suspense>
    </div>
  )
}
