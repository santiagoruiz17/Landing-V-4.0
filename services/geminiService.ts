import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey === '') return "Error: API Key no encontrada.";

  const prompt = `Actúa como consultor. Negocio: ${data.niche}. Capital: ${data.amount}. Da 2 consejos con % en menos de 100 palabras.`;

  try {
    // Usamos el endpoint más básico y estable de la v1
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Si recibimos este error, necesitamos confirmar la región del servidor
      return `Error de Google (${response.status}): ${result.error?.message || 'Verifica la ubicación de tu servidor en Hostinger. Si es Europa, cámbialo a USA.'}`;
    }

    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
  } catch (error: any) {
    return "Error de red. Intenta de nuevo.";
  }
};