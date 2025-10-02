require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = await genAI.listModels();
    console.log("--- ВАШИ ДОСТУПНЫЕ МОДЕЛИ ---");
    for await (const m of models) {
      if (m.supportedGenerationMethods.includes('generateContent')) {
        console.log(m.name);
      }
    }
    console.log("---------------------------");
  } catch (error) {
    console.error("Ошибка при получении списка моделей:", error);
  }
}

listModels();