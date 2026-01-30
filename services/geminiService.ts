import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey.length < 10) return "Error: API Key inválida.";

  const prompt = `Actúa como consultor. Negocio: ${data.niche}. Capital: ${data.amount}. Da 2 consejos con % en menos de 100 palabras.`;

  try {
    // CAMBIO CLAVE: Quitamos 'models/' de la ruta y lo enviamos como parte del endpoint directo
    // Esta es la estructura que Google AI Studio genera por defecto en sus ejemplos de cURL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("DEBUG Google:", result);
      return `Error (${result.error?.status || response.status}): ${result.error?.message || 'Error en el modelo'}`;
    }

    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
  } catch (error: any) {
    return `Error técnico: ${error.message}`;
  }
};