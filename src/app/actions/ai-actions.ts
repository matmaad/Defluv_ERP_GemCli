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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const supabase = await createClient()

    let filePart = null

    // If we have a path, try to get the file data to provide context to Gemini
    if (storagePath) {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath)

      if (data && !error) {
        const buffer = await data.arrayBuffer()
        filePart = {
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: 'application/pdf' // Assuming PDF for SGC-Bot as per requirements
          }
        }
      }
    }

    const prompt = `
      Eres DEFLUVOT, un experto en Sistemas de Gestión de Calidad (SGC) y normas ISO-9001 para la constructora DEFLUV SA.
      
      CONTEXTO:
      - Documento analizado: "${documentTitle}"
      - Empresa: DEFLUV SA (Especialistas en defensas ribereñas y obras civiles)
      - Ubicación: Talca, Chile.
      
      INSTRUCCIONES:
      1. Responde de forma técnica, profesional y amable en ESPAÑOL.
      2. Si el usuario adjuntó un archivo (PDF), utiliza la información del archivo para responder con precisión.
      3. Si te preguntan por normativas, cita la ISO-9001:2015 o manuales del MOP/ChileCompra si aplica.
      4. Mantén las respuestas directas. Si detectas incumplimientos en el documento, menciónalos claramente.
      
      PREGUNTA DEL USUARIO: ${userQuestion}
    `

    const parts: any[] = [prompt]
    if (filePart) parts.push(filePart)

    const result = await model.generateContent(parts)
    const response = await result.response
    return { text: response.text() }
    
  } catch (error: any) {
    console.error('AI Error:', error)
    return { error: `Error al procesar con IA: ${error.message || 'Error desconocido'}` }
  }
}
