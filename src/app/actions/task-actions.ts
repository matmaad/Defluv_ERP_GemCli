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

    if (dbError) {
      console.error('DB Insert Error:', dbError)
      throw new Error(`Error en base de datos: ${dbError.message}`)
    }

    // 2. Audit Log
    try {
      await logActionServer(
        'CREACIÓN',
        'Tareas',
        task.id,
        `Nueva tarea asignada: ${task.title}`
      )
    } catch (auditErr) {
      console.error('Non-blocking Audit Error:', auditErr)
    }

    // 3. Email Notification
    if (resend && task.responsible && task.responsible.email) {
      const { email, first_name, last_name } = task.responsible
      
      let attachmentLink = ''
      if (task.instruction_file_path) {
        try {
          const { data } = await supabase.storage
            .from('documents')
            .createSignedUrl(task.instruction_file_path, 604800)
          attachmentLink = data?.signedUrl || ''
        } catch (sErr) {
          console.error('Signed URL Error:', sErr)
        }
      }

      const formattedDate = task.due_date 
        ? new Date(task.due_date).toLocaleDateString('es-CL')
        : 'Sin fecha límite'

      try {
        await resend.emails.send({
          from: 'DEFLUV ERP <onboarding@resend.dev>', // Using Resend's verified test domain
          to: email,
          subject: `🔔 Nueva Tarea Asignada: ${task.title}`,
          html: `
            <div style="font-family: sans-serif; color: #0a2d4d; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px;">
              <h2 style="text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #0a2d4d; padding-bottom: 10px;">Nueva Tarea Asignada</h2>
              <p>Hola <strong>${first_name} ${last_name}</strong>,</p>
              <p>Se te ha asignado una nueva tarea en el sistema de gestión DEFLUV ERP.</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Título:</strong> ${task.title}</p>
                <p style="margin: 5px 0;"><strong>Departamento:</strong> ${task.department?.name || 'S/D'}</p>
                <p style="margin: 5px 0;"><strong>Prioridad:</strong> ${task.priority}</p>
                <p style="margin: 5px 0;"><strong>Fecha Límite:</strong> ${formattedDate}</p>
                <p style="margin: 15px 0;"><strong>Descripción:</strong><br/>${task.description || 'Sin descripción adicional'}</p>
              </div>

              ${attachmentLink ? `
                <div style="margin-top: 20px; text-align: center;">
                  <a href="${attachmentLink}" style="background-color: #0a2d4d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase;">Descargar Archivo Adjunto</a>
                </div>
              ` : ''}

              <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Este es un mensaje automático generado por DEFLUV ERP. Por favor no responder.</p>
            </div>
          `
        })
      } catch (emailErr: any) {
        console.error('Email sending failed but task was created:', emailErr)
        // We don't throw here to avoid failing the whole task creation if only the email fails
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Task Action Error:', error)
    return { error: error.message || 'Error inesperado del servidor' }
  }
}
