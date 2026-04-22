import { createClient } from '@/utils/supabase/server'
import SettingsClient from '@/components/features/options/SettingsClient'

export default async function OpcionesPage() {
  const supabase = await createClient()

  // 1. Fetch auth user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch full profile including role
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-full bg-gray-50 pt-8">
      <SettingsClient
        currentEmail={user?.email || ''}
        userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
        userRole={profile?.role || 'regular_user'}
      />
    </div>
  )
}
