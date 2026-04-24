'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

// Inicialización con el modelo que confirmamos que funciona
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

// Función para "despertar" la instancia de Vercel al cargar la página
export async function warmUpAI() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
    // Solo inicializamos el modelo sin generar contenido pesado
    console.log('DEFLUVOT: Instancia 3.1 Flash Lite calentada.')
    return { status: 'ready' }
  } catch (err) {
    return { status: 'error' }
  }
}

export async function analyzeDocument(
  storagePath: string | null, 
  documentTitle: string, 
  userQuestion: string,
  chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = []
) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    return { error: 'Error: La API Key de Gemini no está configurada.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Recolectar contexto operativo real
  let userContext = "Usuario no identificado."
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('*, departments(name)').eq('id', user.id).single()
    const { count: pendingTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to_user_id', user.id).eq('status', 'Pendiente')
    const { count: overdueDocs } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('department_id', profile?.department_id).eq('current_status', 'Vencido')

    userContext = `
      DATOS DEL OPERADOR ACTUAL:
      - Nombre: ${profile?.first_name} ${profile?.last_name}
      - Rol: ${profile?.role}
      - Departamento: ${profile?.departments?.name || 'No asignado'}
      - Tareas Pendientes: ${pendingTasks || 0}
      - Documentos Vencidos en su Depto: ${overdueDocs || 0}
    `
  }

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.1-flash-lite-preview',
        systemInstruction: `Eres DEFLUVOT, asistente inteligente oficial de la constructora DEFLUV SA (Talca, Chile).
        Tu tono es profesional, técnico y ejecutivo. Eres un experto Senior en SGC e ISO-9001.

        CONTEXTO OPERATIVO:
        ${userContext}

        REGLAS DE ORO:
        1. Saca provecho del contexto operativo. Si el usuario tiene tareas pendientes o documentos vencidos, puedes mencionarlo sutilmente si la consulta es relevante.
        2. Sé conciso y directo. No te presentes en cada mensaje.
        3. Usa un lenguaje natural, técnico y formal.
        4. Si te preguntan "¿Cómo voy?", usa los datos del CONTEXTO OPERATIVO para responder.`
      })

      let filePart = null
      // ... (lógica de archivos se mantiene igual)
      if (storagePath) {
        // ... (lógica de descarga de archivo se mantiene igual)
        try {
          const { data, error } = await supabase.storage.from('documents').download(storagePath)
          if (data && !error) {
            const buffer = await data.arrayBuffer()
            filePart = {
              inlineData: {
                data: Buffer.from(buffer).toString('base64'),
                mimeType: 'application/pdf'
              }
            }
          }
        } catch (err) { console.error(err) }
      }

      // Iniciamos chat con historial
      const chat = model.startChat({
        history: chatHistory,
      })

      const contextualQuestion = storagePath 
        ? `[Documento adjunto: ${documentTitle}] - ${userQuestion}`
        : userQuestion

      const result = await chat.sendMessage(filePart ? [contextualQuestion, filePart] : [contextualQuestion])
      const response = await result.response
      return { text: response.text() }
      
    } catch (error: any) {
      // ... (lógica de reintento se mantiene igual)
      if ((error.message?.includes('503') || error.message?.includes('429')) && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        continue;
      }
      return { error: `DEFLUVOT está experimentando alta demanda. Intenta en unos segundos.` }
    }
  }
  return { error: 'No se pudo obtener respuesta.' }
}
