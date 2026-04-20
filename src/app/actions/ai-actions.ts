'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function analyzeDocument(documentTitle: string, userQuestion: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
      Eres el SGC-Bot, un experto en Sistemas de Gestión de Calidad (ISO-9001) para la constructora DEFLUV SA.
      Estás analizando el documento: "${documentTitle}".
      
      Reglas:
      1. Responde de forma técnica y profesional.
      2. Si te preguntan por normativas, cita la ISO-9001 o manuales de construcción chilenos.
      3. Mantén las respuestas breves y directas.
      
      Pregunta del usuario: ${userQuestion}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    return { text: response.text() }
    
  } catch (error) {
    console.error('AI Error:', error)
    return { error: 'Error al procesar la solicitud con IA.' }
  }
}
