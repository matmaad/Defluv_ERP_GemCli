import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testFinal() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('--- TEST FINAL DEFLUVOT ---');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent('Hola');
    const response = await result.response;
    console.log(`✅ EXITO: ${response.text().substring(0, 10)}...`);
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
  }
}

testFinal();
