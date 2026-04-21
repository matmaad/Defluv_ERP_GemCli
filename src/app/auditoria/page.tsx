import { createClient } from '@/utils/supabase/server'
import AuditClient from '@/components/features/audit/AuditClient'

export default async function AuditoriaPage() {
  const supabase = await createClient()

  // 1. Fetch audit logs with user details
  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles (first_name, last_name)
    `)
    .order('timestamp', { ascending: false })
    .limit(100)

  // 2. Fetch all profiles for the filter
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name', { ascending: true })

  return (
    <AuditClient 
      initialLogs={(logs as any) || []} 
      profiles={profiles || []}
    />
  )
}
