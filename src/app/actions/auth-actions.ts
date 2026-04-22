'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { logActionServer } from '@/utils/audit-server'

export async function updateEmailAction(newEmail: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no encontrada' }

    if (user.email === newEmail) return { success: true }

    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) {
      console.error('Update Email Error:', error)
      return { error: error.message }
    }
    
    await logActionServer(
      'CAMBIO DE CORREO',
      'Perfil',
      user.id,
      `Usuario solicitó cambio de correo a ${newEmail}`,
      { oldEmail: user.email, newEmail }
    )

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al procesar el cambio de correo' }
  }
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no encontrada' }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }

    await logActionServer(
      'CAMBIO DE CONTRASEÑA',
      'Perfil',
      user.id,
      'Usuario cambió su contraseña'
    )

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al actualizar la contraseña' }
  }
}

export async function registerUserAction(userData: any) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })

    if (authError) return { error: authError.message }

    // 2. Create Profile with Department
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        department_id: userData.department_id || null,
        is_active: true
      })

    if (profileError) return { error: 'Auth creado, pero el perfil falló: ' + profileError.message }

    // 3. AUTO-ASSIGN PERMISSIONS BASED ON TIER
    const userId = authData.user.id
    const deptId = userData.department_id

    if (userData.role === 'sub_admin') {
      // TIER 2: View access to ALL departments
      const { data: depts } = await supabaseAdmin.from('departments').select('id')
      if (depts) {
        const perms = depts.map(d => ({
          user_id: userId,
          department_id: d.id,
          can_view: true,
          can_edit: false,
          can_approve: false
        }))
        await supabaseAdmin.from('permissions').insert(perms)
      }
    } else if (userData.role === 'regular_user' && deptId) {
      // TIER 3: View and Edit access to OWN department
      await supabaseAdmin.from('permissions').insert({
        user_id: userId,
        department_id: deptId,
        can_view: true,
        can_edit: true,
        can_approve: false
      })
    }

    await logActionServer(
      'REGISTRO DE USUARIO',
      'Perfil',
      userId,
      `Se registró un nuevo operador (${userData.role}): ${userData.first_name} ${userData.last_name}`,
      { role: userData.role, dept: deptId }
    )

    return { success: true }
    
  } catch (err: any) {
    console.error('Admin Registration Error:', err)
    return { error: 'Error inesperado del servidor al registrar' }
  }
}

export async function updateUserAction(userId: string, updates: any) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: currentProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()

    if (updates.email && updates.email !== currentProfile?.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: updates.email,
        email_confirm: true
      })
      if (authError) return { error: 'Error en Autenticación: ' + authError.message }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: updates.first_name,
        last_name: updates.last_name,
        role: updates.role,
        email: updates.email,
        department_id: updates.department_id || currentProfile?.department_id
      })
      .eq('id', userId)

    if (profileError) return { error: 'Error en Perfil: ' + profileError.message }

    await logActionServer(
      'ACTUALIZACIÓN',
      'Perfil',
      userId,
      `Actualización de usuario: ${updates.first_name} ${updates.last_name}`,
      updates
    )

    return { success: true }
  } catch (err: any) {
    console.error('Update User Error:', err)
    return { error: 'Error crítico al actualizar el usuario' }
  }
}

export async function deleteUserAction(userId: string, userName: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    await logActionServer('ELIMINACIÓN', 'Perfil', userId, `Se eliminó permanentemente al usuario: ${userName}`)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) return { error: 'Error al eliminar en Autenticación: ' + authError.message }
    return { success: true }
  } catch (err: any) {
    console.error('Delete User Error:', err)
    return { error: 'Error crítico al eliminar el usuario' }
  }
}
