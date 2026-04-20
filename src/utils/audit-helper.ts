import { createClient } from './supabase/cliente'

export async function logAction(
  actionType: string, 
  resourceType: string, 
  resourceId: string, 
  details: any = {}, 
  justification?: string
) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action_type: actionType,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    justification,
    timestamp: new Date().toISOString()
  })
}
