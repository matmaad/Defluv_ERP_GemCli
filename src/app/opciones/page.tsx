import { createClient } from '@/utils/supabase/server'
import SettingsClient from '@/components/features/options/SettingsClient'

export default async function OpcionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-full bg-gray-50 pt-8">
      <SettingsClient 
        currentEmail={user?.email || ''} 
        userName={profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
      />
    </div>
  )
}
