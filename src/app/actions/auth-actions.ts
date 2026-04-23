'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { logActionServer } from '@/utils/audit-server'

export async function updateEmailAction(newEmail: string) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no encontrada' }
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) return { error: error.message }
    await logActionServer('CAMBIO DE CORREO', 'Perfil', user.id, `Usuario cambió correo a ${newEmail}`, { oldEmail: user.email, newEmail })
    return { success: true }
  } catch (err: any) { return { error: 'Error al procesar el cambio de correo' } }
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no encontrada' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    await logActionServer('CAMBIO DE CONTRASEÑA', 'Perfil', user.id, 'Usuario cambió su contraseña')
    return { success: true }
  } catch (err: any) { return { error: 'Error al actualizar la contraseña' } }
}

export async function registerUserAction(userData: any) {
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })
    if (authError) return { error: authError.message }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      department_id: userData.department_id || null,
      is_active: true
    })
    if (profileError) return { error: 'Perfil falló: ' + profileError.message }

    const userId = authData.user.id
    if (userData.role === 'admin') {
      const { data: depts } = await supabaseAdmin.from('departments').select('id')
      if (depts) {
        const perms = depts.map(d => ({ user_id: userId, department_id: d.id, can_view: true, can_edit: true, can_approve: true }))
        await supabaseAdmin.from('permissions').insert(perms)
      }
    } else if (userData.role === 'sub_admin') {
      const { data: depts } = await supabaseAdmin.from('departments').select('id')
      if (depts) {
        const perms = depts.map(d => ({ user_id: userId, department_id: d.id, can_view: true, can_edit: false, can_approve: false }))
        await supabaseAdmin.from('permissions').insert(perms)
      }
    } else if (userData.role === 'regular_user' && userData.department_id) {
      await supabaseAdmin.from('permissions').insert({ user_id: userId, department_id: userData.department_id, can_view: true, can_edit: true, can_approve: false })
    }

    await logActionServer('REGISTRO', 'Perfil', userId, `Nuevo usuario: ${userData.first_name}`)
    return { success: true }
  } catch (err: any) { return { error: 'Error inesperado al registrar' } }
}

export async function updateUserAction(userId: string, updates: any) {
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    if (updates.email) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { email: updates.email, email_confirm: true })
    }
    const { error } = await supabaseAdmin.from('profiles').update({
      first_name: updates.first_name,
      last_name: updates.last_name,
      role: updates.role,
      email: updates.email,
      department_id: updates.department_id
    }).eq('id', userId)
    if (error) return { error: error.message }
    await logActionServer('ACTUALIZACIÓN', 'Perfil', userId, `Actualización de: ${updates.first_name}`)
    return { success: true }
  } catch (err: any) { return { error: 'Error al actualizar usuario' } }
}

export async function deleteUserAction(userId: string, userName: string) {
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  try {
    await logActionServer('ELIMINACIÓN', 'Perfil', userId, `Se eliminó al usuario: ${userName}`)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      return { error: 'Eliminado de perfil, pero Auth reportó: ' + authError.message }
    }
    return { success: true }
  } catch (err: any) { return { error: 'Error crítico al eliminar' } }
}

export async function deleteDepartmentAction(deptId: string, deptName: string) {
  const supabase = await createClient()
  try {
    const { error } = await supabase.from('departments').delete().eq('id', deptId)
    if (error) {
      if (error.code === '23503') return { error: 'Departamento en uso. Reasigne registros primero.' }
      throw error
    }
    await logActionServer('ELIMINACIÓN', 'Configuración', deptId, `Se eliminó depto: ${deptName}`)
    return { success: true }
  } catch (err: any) { return { error: 'Error al eliminar departamento' } }
}
