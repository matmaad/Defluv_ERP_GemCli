import { createClient } from '@/utils/supabase/server'
import AuditClient from '@/components/features/audit/AuditClient'

export default async function AuditoriaPage() {
  const supabase = await createClient()

  // 1. User Info & Role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user?.id).single()

  // 2. Fetch Profiles for Filter
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name')

  // 3. Fetch Logs with SECURITY ENFORCEMENT
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!user_id (first_name, last_name, department_id)
    `)
  
  if (profile?.role === 'regular_user') {
    // TIER 3: Only see logs related to their own department activity or documents
    query = query.eq('user.department_id', profile.department_id)
  }

  const { data: logs } = await query.order('timestamp', { ascending: false }).limit(500)

  return (
    <div className="min-h-full bg-gray-50 pt-8">
      <AuditClient 
        initialLogs={(logs as any) || []} 
        profiles={profiles || []}
        userRole={profile?.role || 'regular_user'}
      />
    </div>
  )
}
