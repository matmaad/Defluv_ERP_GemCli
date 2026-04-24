'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

// Inicialización con el modelo que confirmamos que funciona
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

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

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: `Eres DEFLUVOT, asistente experto en SGC y normativa ISO-9001 de constructora DEFLUV SA.
        Tu tono es profesional, técnico y ejecutivo. 
        REGLAS DE ORO:
        1. Sé conciso. Ve directo a la respuesta técnica.
        2. No te presentes ni repitas tu nombre/cargo en cada mensaje.
        3. Si no hay un documento adjunto, responde basándote en estándares de construcción y calidad.
        4. Usa un lenguaje natural pero formal. Evita estructuras rígidas de "Contexto/Análisis/Conclusión" a menos que se te pida explícitamente.`
      })
      
      const supabase = await createClient()
      let filePart = null

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
