'use server'

import { createClient } from '@/utils/supabase/server'
import { logActionServer } from '@/utils/audit-server'

export async function createMasterRuleAction(formData: any) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('document_master_matrix')
      .insert({
        title: formData.title,
        description: formData.description,
        department_id: formData.department_id,
        assigned_to_profile_id: formData.assigned_to_profile_id,
        frequency: formData.frequency,
        standard_due_time: formData.standard_due_time,
        template_storage_path: formData.template_storage_path,
        due_date: formData.due_date || null, // New Date field
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    await logActionServer(
      'CREACIÓN MAESTRA',
      'Configuración',
      data.id,
      `Se creó nueva regla permanente: ${data.title}`,
      { frequency: data.frequency }
    )

    return { success: true }
  } catch (err: any) {
    console.error('Master Rule Action Error:', err)
    return { error: err.message || 'Error al crear la regla maestra' }
  }
}

export async function updateMasterRuleAction(id: string, formData: any) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('document_master_matrix')
      .update({
        title: formData.title,
        description: formData.description,
        department_id: formData.department_id,
        assigned_to_profile_id: formData.assigned_to_profile_id,
        frequency: formData.frequency,
        standard_due_time: formData.standard_due_time,
        template_storage_path: formData.template_storage_path,
        due_date: formData.due_date || null, // Updated Date
        is_active: formData.is_active
      })
      .eq('id', id)

    if (error) throw error

    await logActionServer(
      'EDICIÓN MAESTRA',
      'Configuración',
      id,
      `Se actualizó la regla permanente: ${formData.title}`,
      formData
    )

    return { success: true }
  } catch (err: any) {
    console.error('Update Master Rule Error:', err)
    return { error: err.message || 'Error al actualizar la regla maestra' }
  }
}

export async function deleteMasterRuleAction(id: string, title: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('document_master_matrix')
      .delete()
      .eq('id', id)

    if (error) throw error

    await logActionServer(
      'ELIMINACIÓN MAESTRA',
      'Configuración',
      id,
      `Se eliminó la regla permanente: ${title}`
    )

    return { success: true }
  } catch (err: any) {
    console.error('Delete Master Rule Error:', err)
    return { error: err.message || 'Error al eliminar la regla maestra' }
  }
}
