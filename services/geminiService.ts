import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  // Limpieza total de la clave
  const apiKey = rawKey.replace(/\s/g, '');

  if (!apiKey || apiKey.length < 10) return "Error: API Key no configurada.";

  const prompt = `Actúa como consultor. Negocio: ${data.niche}. Capital: ${data.amount}. Da 2 consejos con % en menos de 100 palabras.`;

  try {
    // Probamos con v1beta que es el endpoint que mejor soporta las keys de AI Studio
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Diagnóstico detallado
      if (response.status === 404) {
        return `Error 404: El modelo Gemini Pro no está habilitado para esta API Key. Por favor, asegúrate de haber habilitado la 'Generative Language API' en tu consola de Google Cloud.`;
      }
      return `Error ${response.status}: ${result.error?.message || 'Error desconocido'}`;
    }

    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
  } catch (error: any) {
    return "Error de red. Verifica la conexión del servidor.";
  }
};