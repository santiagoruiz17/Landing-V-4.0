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
    Usa lenguaje sencillo y cercano. Máximo 120 palabras.
  `;

  try {
    // Usamos FETCH directo a la API v1 para máxima compatibilidad y evitar errores del SDK
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error details:", errorData);

      if (response.status === 404) {
        return "Error 404: El modelo no está disponible. Es posible que tu API Key no tenga acceso a Gemini 1.5 Flash o que la región de tu servidor no esté permitida por Google.";
      }
      return `Error ${response.status}: ${errorData.error?.message || 'Error desconocido'}`;
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "No se pudo generar la respuesta.";
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return `Error de conexión: ${error.message}`;
  }
};