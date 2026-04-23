import { createClient } from '@/utils/supabase/server'
import DefluvotClient from '@/components/features/ai/DefluvotClient'

export default async function DefluvotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <DefluvotClient userName={user?.email || 'Usuario'} />
    </div>
  )
}
