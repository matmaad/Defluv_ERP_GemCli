'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { logActionServer } from '@/utils/audit-server'

export async function updateEmailAction(newEmail: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) return { error: error.message }
    
    if (user) {
      await logActionServer(
        'CAMBIO DE CORREO',
        'Perfil',
        user.id,
        `Usuario cambió su correo a ${newEmail}`,
        { newEmail }
      )
    }

    return { success: true }
  } catch (err) {
    return { error: 'Error al actualizar el correo' }
  }
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }

    if (user) {
      await logActionServer(
        'CAMBIO DE CONTRASEÑA',
        'Perfil',
        user.id,
        'Usuario cambió su contraseña'
      )
    }

    return { success: true }
  } catch (err) {
    return { error: 'Error al actualizar la contraseña' }
  }
}

export async function registerUserAction(userData: any) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    })

    if (authError) return { error: authError.message }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        is_active: true
      })

    if (profileError) {
      return { error: 'Auth created, but profile failed: ' + profileError.message }
    }

    await logActionServer(
      'REGISTRO DE USUARIO',
      'Perfil',
      authData.user.id,
      `Se registró un nuevo operador: ${userData.first_name} ${userData.last_name} (${userData.email})`,
      { role: userData.role }
    )

    return { success: true }
    
  } catch (err: any) {
    console.error('Admin Registration Error:', err)
    return { error: 'Error inesperado del servidor' }
  }
}

export async function updateUserAction(userId: string, updates: any) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Update Auth Email if changed (Admin can do this)
    if (updates.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: updates.email,
        email_confirm: true
      })
      if (authError) return { error: 'Error al actualizar email en Auth: ' + authError.message }
    }

    // 2. Update Profile Table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: updates.first_name,
        last_name: updates.last_name,
        role: updates.role,
        email: updates.email // Keep sync
      })
      .eq('id', userId)

    if (profileError) return { error: 'Error al actualizar perfil: ' + profileError.message }

    await logActionServer(
      'ACTUALIZACIÓN',
      'Perfil',
      userId,
      `Se actualizó la información del usuario: ${updates.first_name} ${updates.last_name}`,
      updates
    )

    return { success: true }
  } catch (err: any) {
    console.error('Update User Error:', err)
    return { error: 'Error inesperado al actualizar' }
  }
}

export async function deleteUserAction(userId: string, userName: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Delete from Auth (Cascade should handle profiles if configured, but let's be explicit)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) return { error: 'Error al eliminar usuario en Auth: ' + authError.message }

    // Profiles usually delete via foreign key ON DELETE CASCADE
    // but just in case, we log it before it's gone
    
    await logActionServer(
      'ELIMINACIÓN',
      'Perfil',
      userId,
      `Se eliminó permanentemente al usuario: ${userName}`
    )

    return { success: true }
  } catch (err: any) {
    console.error('Delete User Error:', err)
    return { error: 'Error inesperado al eliminar' }
  }
}
