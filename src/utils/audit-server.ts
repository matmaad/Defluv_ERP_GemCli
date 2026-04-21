import { createClient } from './supabase/server'

export async function logActionServer(
  actionType: string, 
  resourceType: string, 
  resourceId: string, 
  description: string,
  details: any = {}
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId.toString(),
      justification: description, 
      details,
      timestamp: new Date().toISOString()
    })

    if (error) {
      console.error('Audit Log Server Error:', error.message)
    }
  } catch (err) {
    console.error('Failed to log action from server:', err)
  }
}
