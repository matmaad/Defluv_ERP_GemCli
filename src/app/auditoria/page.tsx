import { createClient } from '@/utils/supabase/server'
import AuditClient from '@/components/features/audit/AuditClient'

export default async function AuditoriaPage() {
  const supabase = await createClient()

  // Fetch real audit logs
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50)

  return (
    <AuditClient 
      initialLogs={logs || []} 
    />
  )
}
