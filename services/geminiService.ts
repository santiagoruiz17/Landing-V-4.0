import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey.length < 10) return "Error: API Key no configurada.";

  const prompt = `Actúa como consultor experto. Negocio: ${data.niche}. Capital: ${data.amount}. Da 2 consejos con % en menos de 100 palabras.`;

  try {
    // Usamos el identificador técnico completo y el endpoint v1beta para mayor compatibilidad
    const modelId = "models/gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Mostramos el error REAL de Google para dejar de adivinar
      console.error("Google Error Detallado:", result);
      const reason = result.error?.message || "Error desconocido";
      const status = result.error?.status || response.status;

      return `Error de Google (${status}): ${reason}. Si el error persiste y estás en México, verifica que el servidor de Hostinger no esté en Europa.`;
    }

    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
  } catch (error: any) {
    return `Error de conexión: ${error.message}`;
  }
};