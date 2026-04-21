'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

// Inicialización con el modelo que confirmamos que funciona
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function analyzeDocument(storagePath: string | null, documentTitle: string, userQuestion: string) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  
  if (!apiKey) {
    return { error: 'Error: La API Key de Gemini no está configurada.' }
  }

  try {
    // Confirmado mediante test que 'gemini-flash-latest' es el modelo correcto
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const supabase = await createClient()

    let filePart = null

    if (storagePath) {
      try {
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
      } catch (storageErr) {
        console.error('Storage Error:', storageErr)
      }
    }

    const prompt = `
      Eres DEFLUVOT, el asistente inteligente oficial de la constructora DEFLUV SA (Talca, Chile).
      Eres un experto Senior en Sistemas de Gestión de Calidad (SGC) y normas ISO-9001:2015.
      
      CONTEXTO:
      - Documento analizado: "${documentTitle}"
      - Empresa: DEFLUV SA (Especialistas en obras civiles y defensas ribereñas).
      
      INSTRUCCIONES:
      1. Responde de forma técnica, profesional y siempre en ESPAÑOL.
      2. Utiliza la información del archivo adjunto (si existe) para dar respuestas precisas.
      3. Sé directo y ve al grano con la recomendación técnica o el análisis de cumplimiento.
      
      PREGUNTA DEL USUARIO: ${userQuestion}
    `

    const result = await model.generateContent(filePart ? [prompt, filePart] : [prompt])
    const response = await result.response
    return { text: response.text() }
    
  } catch (error: any) {
    console.error('DEFLUVOT Error:', error)
    return { error: `DEFLUVOT está experimentando alta demanda o un error técnico. Detalle: ${error.message}` }
  }
}
