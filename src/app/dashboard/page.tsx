import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/features/dashboard/DashboardClient'
import { KPI } from '@/app/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // 1. Fetch real documents for KPI calculation
  const { data: allDocs } = await supabase
    .from('documents')
    .select('current_status')

  const totalDocs = allDocs?.length || 0
  const approvedDocs = allDocs?.filter(d => d.current_status === 'Aprobado').length || 0
  const complianceRate = totalDocs > 0 ? (approvedDocs / totalDocs) * 100 : 0

  // 2. Fetch Alerts (Rechazados + No Cumple)
  const alertCount = allDocs?.filter(d => d.current_status === 'Rechazado' || d.current_status === 'No Cumple').length || 0

  // 3. Fetch real Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(5)

  // 4. Fetch real Deadlines
  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(5)

  // 5. Fetch Departments and Users for Task Modal
  const { data: departments } = await supabase.from('departments').select('id, name')
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department_id')

  // Format real KPIs for the client
  const now = new Date().toISOString()
  const kpis: KPI[] = [
    { id: '1', kpi_name: 'Cumplimiento Protocolos', value: parseFloat(complianceRate.toFixed(1)), unit: '%', date_recorded: now, created_at: now, updated_at: now },
    { id: '2', kpi_name: 'Alertas de Calidad', value: alertCount, unit: '', date_recorded: now, created_at: now, updated_at: now },
    { id: '3', kpi_name: 'Documentos Totales', value: totalDocs, unit: '', date_recorded: now, created_at: now, updated_at: now },
  ]

  // Type-safe map for profiles to match DashboardClient expected props
  const formattedProfiles = profiles?.map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    department_id: p.department_id
  })) || []

  return (
    <DashboardClient 
      kpis={kpis} 
      tasks={tasks || []} 
      deadlines={deadlines || []}
      userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
      userRole={profile?.role || 'regular_user'}
      departments={departments || []}
      users={formattedProfiles}
    />
  )
}
