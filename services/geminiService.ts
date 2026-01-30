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
    // Usamos la versión específica del modelo para evitar problemas de resolución de alias
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text || "No se pudo generar la respuesta. Por favor intenta de nuevo.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('404')) {
      return "Error 404: El modelo gemini-1.5-flash-001 no fue encontrado. Esto puede deberse a que el servicio no está disponible en la región de tu servidor o la API Key aún no tiene permisos activos para este modelo específico.";
    }
    return "Hubo un problema al conectar con la IA de Google. Revisa tu consola para más detalles.";
  }
};