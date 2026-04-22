import { createClient } from '@/utils/supabase/server'
import AccessControlClient from '@/components/features/access/AccessControlClient'

export default async function AccesoPage() {
  const supabase = await createClient()

  // 1. Fetch current user role safely
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let currentUserRole = 'regular_user'
  
  if (authUser) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle() // Use maybeSingle to avoid crash if profile missing
      if (profile) currentUserRole = profile.role
    } catch (e) {
      console.error('Error fetching current user role:', e)
    }
  }

  // 2. Fetch profiles safely
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name', { ascending: true })

  if (pError) console.error('Profiles fetch error:', pError)

  // 3. Fetch departments safely
  const { data: departments, error: dError } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  if (dError) console.error('Departments fetch error:', dError)

  // 4. Fetch permissions safely
  const { data: permissions, error: permError } = await supabase
    .from('permissions')
    .select('*')

  if (permError) console.error('Permissions fetch error:', permError)

  return (
    <AccessControlClient 
      profiles={profiles || []} 
      departments={departments || []}
      permissions={permissions || []}
      currentUserRole={currentUserRole}
    />
  )
}
