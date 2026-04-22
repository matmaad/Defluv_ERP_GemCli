import { createClient } from '@/utils/supabase/server'
import AccessControlClient from '@/components/features/access/AccessControlClient'

export default async function AccesoPage() {
  const supabase = await createClient()

  // 1. Fetch current user role for UI logic
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()

  // 2. Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name', { ascending: true })

  // 3. Fetch all departments for the matrix
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  // 4. Fetch all permissions
  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')

  // 5. Fetch Session Stats (Aggregated)
  // We'll calculate the sum of duration_seconds for each user
  const { data: sessionStats } = await supabase
    .from('user_sessions')
    .select('user_id, duration_seconds')

  // Group stats locally
  const statsMap: Record<string, number> = {}
  sessionStats?.forEach(s => {
    statsMap[s.user_id] = (statsMap[s.user_id] || 0) + (s.duration_seconds || 0)
  })

  // 6. Fetch Recent Sessions for Activity Tab
  const { data: recentSessions } = await supabase
    .from('user_sessions')
    .select('*')
    .order('login_at', { ascending: false })
    .limit(100)

  return (
    <AccessControlClient 
      profiles={profiles || []}
      departments={departments || []}
      permissions={permissions || []}
      currentUserRole={profile?.role || 'regular_user'}
      sessionStats={statsMap}
      recentSessions={recentSessions || []}
    />
  )
}
