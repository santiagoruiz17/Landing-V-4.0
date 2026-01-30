import { GoogleGenerativeAI } from "@google/generative-ai";
import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === '') {
    console.error("API Key not found or is placeholder");
    return "El servicio de IA no está disponible en este momento (API Key faltante).";
  }

  // Adjusted Prompt: Clear, Simple, and Actionable Language
  const prompt = `
    Actúa como un Consultor de Negocios experto y empático.
    Perfil del Cliente:
    - Giro: ${data.niche}
    - Ubicación: ${data.location}
    - Capital Solicitado: ${data.amount}

    Objetivo: Explícale al cliente de forma MUY SENCILLA cómo repartir este dinero.
    Reglas: No uses tecnicismos. Enfócate en beneficios reales. Tono cercano y motivador.
    Formato: 2 o 3 acciones con porcentaje sugerido y una frase simple del porqué.
    Mantén la respuesta bajo 130 palabras.
  `;

  try {
    // Definitive instantiation with trimmed key
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Using the most stable model identifier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "No pudimos generar la estrategia. Intenta nuevamente.";
  } catch (error: any) {
    console.error("Error generating advice:", error);
    // Return a more descriptive error if possible
    if (error.message?.includes('404')) {
      return "Error de conexión con el modelo de IA. Por favor, verifica que la API Key sea válida para Gemini 1.5 Flash.";
    }
    throw error;
  }
};