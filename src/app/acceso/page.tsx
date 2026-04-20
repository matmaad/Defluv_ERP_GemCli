import { createClient } from '@/utils/supabase/server'
import AccessControlClient from '@/components/features/access/AccessControlClient'

export default async function AccesoPage() {
  const supabase = await createClient()

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name', { ascending: true })

  // Fetch departments
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  // Fetch permissions
  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')

  return (
    <AccessControlClient 
      profiles={profiles || []} 
      departments={departments || []}
      permissions={permissions || []}
    />
  )
}
