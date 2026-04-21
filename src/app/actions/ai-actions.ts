'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

// Inicialización fuera de la función para mayor rendimiento
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function analyzeDocument(storagePath: string | null, documentTitle: string, userQuestion: string) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return { error: 'Error: La API Key de Gemini no está configurada en el servidor (Vercel).' }
  }

  try {
    // Usamos gemini-1.5-flash-latest que es la versión más compatible actualmente
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
      Eres DEFLUVOT, el asistente inteligente de Constructora DEFLUV SA (Talca, Chile).
      Eres un experto en SGC e ISO-9001:2015.
      
      Documento actual: "${documentTitle}"
      
      Instrucciones:
      1. Responde de forma técnica y profesional en ESPAÑOL.
      2. Si hay un PDF adjunto, analízalo. Si no, responde basándote en la pregunta.
      3. Sé directo y útil para la obra.
      
      Pregunta: ${userQuestion}
    `

    const result = await model.generateContent(filePart ? [prompt, filePart] : [prompt])
    const response = await result.response
    const text = response.text()

    if (!text) throw new Error('La IA devolvió una respuesta vacía.')

    return { text }
    
  } catch (error: any) {
    console.error('DEFLUVOT Error:', error)
    
    // Si falla el modelo Flash, intentamos un último recurso con Pro
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
      const result = await fallbackModel.generateContent(`Responde brevemente en español: ${userQuestion}`)
      const response = await result.response
      return { text: `(Modo Respaldo) ${response.text()}` }
    } catch (finalErr: any) {
      return { error: `Error técnico: No se pudo conectar con el servicio de IA de Google. Detalle: ${error.message}` }
    }
  }
}
