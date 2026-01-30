import { GoogleGenerativeAI } from "@google/generative-ai";
import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === '') {
    return "Error: No se encontró la API Key en el entorno.";
  }

  const prompt = `
    Actúa como un Consultor de Negocios experto.
    Negocio: ${data.niche} en ${data.location}. Capital: ${data.amount} MXN.
    Explica brevemente cómo usar el dinero (2-3 acciones con %).
    Usa lenguaje sencillo y cercano. Máximo 120 palabras.
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Regresamos al 1.5 Flash que tiene cuota activa garantizada
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text || "No se pudo generar la respuesta. Por favor intenta de nuevo.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('404')) {
      return "El modelo solicitado no está disponible para tu API Key. Por favor verifica en Google AI Studio qué modelo tienes habilitado (ej. gemini-1.5-pro).";
    }
    return "Hubo un problema al conectar con la IA. Revisa la consola para más detalles.";
  }
};