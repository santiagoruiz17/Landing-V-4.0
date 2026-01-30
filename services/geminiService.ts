import { GoogleGenerativeAI } from "@google/generative-ai";
import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey === '') {
    return "Error: No se encontró la API Key.";
  }

  const prompt = `
    Actúa como un Consultor de Negocios experto.
    Negocio: ${data.niche} en ${data.location}. Capital: ${data.amount} MXN.
    Explica brevemente cómo usar el dinero (2-3 acciones con %).
    Usa lenguaje sencillo. Máximo 100 palabras.
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Intentamos con el modelo Pro, que es el más robusto.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text || "No se pudo generar la respuesta.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Si falla, devolvemos el error exacto para diagnosticar
    return `Error: ${error.message}`;
  }
};