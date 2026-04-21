import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function listGeminiModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local');
    return;
  }

  console.log('--- EXPLORACIÓN DE MODELOS DEFLUVOT ---');
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Note: The Node SDK might not have a direct listModels, 
    // we might need to use fetch or a different approach if it's missing.
    // However, let's try to see if we can get anything from a simple fetch to the discovery endpoint.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error de API:', data.error.message);
      return;
    }

    console.log('Modelos disponibles para tu API Key:');
    data.models.forEach(m => {
      console.log(`- ${m.name} (Soporta: ${m.supportedGenerationMethods.join(', ')})`);
    });

  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
  }

  console.log('\n--- FIN DE EXPLORACIÓN ---');
}

listGeminiModels();
