import { createClient } from './supabase/cliente'

export async function logAction(
  actionType: string, 
  resourceType: string, 
  resourceId: string, 
  details: any = {}, 
  description?: string
) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId.toString(),
      details,
      justification: description, // Mapping description to justification column
      timestamp: new Date().toISOString()
    })

    if (error) {
      console.error('Audit Log Error:', error.message)
    }
  } catch (err) {
    console.error('Failed to log action:', err)
  }
}
