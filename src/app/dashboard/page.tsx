import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/components/features/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch real KPIs
  const { data: kpis } = await supabase
    .from('kpis')
    .select('*')
    .order('date_recorded', { ascending: false })
    .limit(3)

  // Fetch real Tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(5)

  // Fetch real Deadlines
  const { data: deadlines } = await supabase
    .from('deadlines')
    .select('*')
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
    .limit(5)

  return (
    <DashboardClient 
      kpis={kpis || []} 
      tasks={tasks || []} 
      deadlines={deadlines || []}
      userName="Felipe Oyaneder"
    />
  )
}
