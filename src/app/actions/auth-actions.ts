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
