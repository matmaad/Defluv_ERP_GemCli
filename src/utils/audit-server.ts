import { createClient } from './supabase/server'

export async function logActionServer(
  actionType: string, 
  resourceType: string, 
  resourceId: string, 
  description: string,
  details: any = {}
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: actionType,
    resource_type: resourceType,
    resource_id: resourceId,
    justification: description, // We use justification column for description
    details,
    timestamp: new Date().toISOString()
  })
}
