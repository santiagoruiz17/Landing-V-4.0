import { AISimulationData } from "../types";

// API Configuration - Using the key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  if (!API_KEY || API_KEY.length < 10) {
    console.error("Gemini API Key missing or invalid in environment variables.");
    return "Error: El servicio de IA no está disponible en este momento (API Key no configurada).";
  }

  // Enhanced prompt for better strategic quality
  const prompt = `Actúa como un Consultor Financiero Senior de Firma 7. 
  Analiza el siguiente caso de negocio en México:
  - Giro/Nicho: ${data.niche}
  - Ubicación: ${data.location}
  - Capital Solicitado: ${data.amount} MXN

  Proporciona una recomendación estratégica breve (máximo 100 palabras) que incluya:
  1. Dos consejos específicos de asignación de capital con porcentajes sugeridos.
  2. Un enfoque de rentabilidad basado en el nicho mencionado.
  Mantén un tono profesional, sofisticado y ejecutivo.`;

  try {
    // Usamos gemini-2.0-flash como se solicitó
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 250,
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error details:", result);
      const errorMsg = result.error?.message || 'Error en el modelo de lenguaje.';
      return `Error (${response.status}): ${errorMsg}`;
    }

    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      console.error("Empty response from Gemini:", result);
      return "La IA no pudo generar una estrategia en este momento. Intenta con detalles más específicos de tu negocio.";
    }

    return textResponse;
  } catch (error: any) {
    console.error("Technical error in geminiService:", error);
    return `Error técnico de conexión: ${error.message}`;
  }
};