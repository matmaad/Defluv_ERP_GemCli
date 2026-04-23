'use server'

import { createClient } from '@/utils/supabase/server'
import { logActionServer } from '@/utils/audit-server'
import { Resend } from 'resend'

export async function createTaskWithNotification(taskData: any) {
  const supabase = await createClient()
  
  // Robust Resend initialization
  const apiKey = process.env.RESEND_API_KEY
  const resend = apiKey ? new Resend(apiKey) : null
  
  try {
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) throw new Error('No autenticado')

    // 1. Insert Task into DB
    const { data: task, error: dbError } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        requester_id: requester.id,
        status: 'Pendiente'
      })
      .select(`
        *,
        responsible:profiles!assigned_to_user_id (email, first_name, last_name),
        department:departments (name)
      `)
      .single()

    if (dbError) throw new Error(`Error en base de datos: ${dbError.message}`)

    // 2. Audit Log
    await logActionServer('CREACIÓN', 'Tareas', task.id, `Nueva tarea asignada: ${task.title}`)

    // 3. Email Notification Logic
    let emailSent = false
    let emailError = null

    if (resend && task.responsible && task.responsible.email) {
      const { email, first_name, last_name } = task.responsible
      
      let attachmentLink = ''
      if (task.instruction_file_path) {
        const { data } = await supabase.storage.from('documents').createSignedUrl(task.instruction_file_path, 604800)
        attachmentLink = data?.signedUrl || ''
      }

      const formattedDate = task.due_date ? new Date(task.due_date).toLocaleDateString('es-CL') : 'Sin fecha'

      try {
        const { error } = await resend.emails.send({
          from: 'DEFLUV ERP <onboarding@resend.dev>', 
          to: email,
          subject: `🔔 Nueva Tarea: ${task.title}`,
          html: `
            <div style="font-family: sans-serif; color: #0a2d4d; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="border-bottom: 2px solid #0a2d4d; padding-bottom: 10px;">NUEVA TAREA ASIGNADA</h2>
              <p>Hola <strong>${first_name} ${last_name}</strong>,</p>
              <p>Tienes un nuevo requerimiento en el panel de control:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0a2d4d;">
                <p><strong>Título:</strong> ${task.title}</p>
                <p><strong>Departamento:</strong> ${task.department?.name || 'General'}</p>
                <p><strong>Plazo:</strong> ${formattedDate}</p>
              </div>
              ${attachmentLink ? `<p style="text-align: center; margin-top: 20px;"><a href="${attachmentLink}" style="background: #0a2d4d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">VER ADJUNTO</a></p>` : ''}
              <p style="font-size: 10px; color: #999; margin-top: 30px;">DEFLUV ERP - Sistema de Gestión de Calidad</p>
            </div>
          `
        })
        
        if (error) {
          emailError = error.message
          console.error('Resend Error:', error)
        } else {
          emailSent = true
        }
      } catch (err: any) {
        emailError = err.message
      }
    }

    return { 
      success: true, 
      emailSent, 
      warning: emailError ? `Tarea creada, pero el correo falló: ${emailError}. (Verifica que el dominio esté validado en Resend)` : null 
    }

  } catch (error: any) {
    console.error('Task Action Error:', error)
    return { error: error.message || 'Error inesperado del servidor' }
  }
}
