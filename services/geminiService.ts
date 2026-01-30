import { GoogleGenerativeAI } from "@google/generative-ai";
import { AISimulationData } from "../types";

// Safely access API key to prevent crashes in environments where process is undefined
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const currentKey = getApiKey();
  if (!currentKey || currentKey === 'PLACEHOLDER_API_KEY') {
    console.error("API Key not found or is placeholder");
    return "El servicio de IA no está disponible en este momento (API Key faltante o inválida).";
  }

  // Adjusted Prompt: Clear, Simple, and Actionable Language (No Jargon)
  const prompt = `
    Actúa como un Consultor de Negocios experto y empático que ayuda a emprendedores a entender la mejor forma de usar su dinero.
    
    Perfil del Cliente:
    - Giro: ${data.niche}
    - Ubicación: ${data.location}
    - Capital Solicitado: ${data.amount}

    Objetivo: Explícale al cliente de forma MUY SENCILLA y CLARA cómo debería repartir este dinero para que su negocio crezca.
    
    Reglas OBLIGATORIAS:
    1. PROHIBIDO usar tecnicismos financieros complejos (como "Capex", "EBITDA", "Apalancamiento", "ROI") a menos que los expliques con palabras cotidianas.
    2. Enfócate en beneficios reales (ejemplo: en lugar de "optimizar capital de trabajo", di "asegurar que tengas inventario suficiente para vender más").
    3. El tono debe ser profesional pero cercano, fácil de leer y motivador.

    Formato deseado (Texto plano):
    Sugiere 2 o 3 acciones concretas con un porcentaje sugerido del dinero (ej. "60% en renovar tu equipo...") y explica el porqué en una frase simple.
    
    Mantén la respuesta bajo 130 palabras.
  `;

  try {
    const runAi = new GoogleGenerativeAI(currentKey.trim());
    const model = runAi.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "No pudimos generar la estrategia en este momento. Intenta nuevamente.";
  } catch (error) {
    console.error("Error generating advice:", error);
    throw error;
  }
};