'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function analyzeDocument(storagePath: string | null, documentTitle: string, userQuestion: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('AI Error: GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables.')
    return { error: 'Error de configuración: Clave de API no encontrada.' }
  }
  
  try {
    // Usamos el modelo gemini-1.5-flash explícitamente en la versión estable v1 para evitar el error 404 de v1beta
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' })
    const supabase = await createClient()

    let filePart = null

    // Intentamos obtener el archivo para dar contexto si existe el path
    if (storagePath) {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath)

      if (data && !error) {
        const buffer = await data.arrayBuffer()
        filePart = {
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: 'application/pdf'
          }
        }
      }
    }

    const prompt = `
      Eres DEFLUVOT, el asistente inteligente oficial de la constructora DEFLUV SA en Talca, Chile.
      Eres un experto Senior en Sistemas de Gestión de Calidad (SGC) y normas ISO-9001:2015.
      
      CONTEXTO DEL SISTEMA:
      - Documento en pantalla: "${documentTitle}"
      - Empresa: Constructora DEFLUV SA (Líder en defensas ribereñas y obras viales)
      
      MANDATOS DE RESPUESTA:
      1. Responde de forma técnica, precisa y siempre en ESPAÑOL.
      2. Si el usuario adjunta un archivo, analízalo a fondo para detectar riesgos o incumplimientos normativos.
      3. Cita cláusulas específicas de la ISO-9001:2015 o manuales del MOP si es pertinente.
      4. Sé directo. No uses introducciones innecesarias. Ve al grano con la recomendación técnica.
      
      PREGUNTA DEL USUARIO: ${userQuestion}
    `

    const parts: any[] = [prompt]
    if (filePart) parts.push(filePart)

    const result = await model.generateContent(parts)
    const response = await result.response
    return { text: response.text() }
    
  } catch (error: any) {
    console.error('AI Error Detail:', error)
    // Si falla la v1, intentamos con gemini-pro como respaldo
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
        const result = await fallbackModel.generateContent(userQuestion)
        const response = await result.response
        return { text: `[Nota: Respondido por modelo de respaldo] ${response.text()}` }
    } catch (fallbackError: any) {
        return { error: `Error crítico de IA: ${error.message || 'No se pudo conectar con el modelo'}` }
    }
  }
}
