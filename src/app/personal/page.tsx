import { createClient } from '@/utils/supabase/server'
import PersonnelClient from '@/components/features/personnel/PersonnelClient'

export default async function PersonnelPage() {
  const supabase = await createClient()

  // Fetch real personal records
  const { data: records } = await supabase
    .from('personal_records')
    .select('*')
    .order('last_name', { ascending: true })

  return (
    <PersonnelClient 
      records={records || []} 
    />
  )
}
