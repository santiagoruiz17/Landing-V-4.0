import { AISimulationData } from "../types";

export const generateStrategicAdvice = async (data: AISimulationData): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey === '' || apiKey.length < 10) {
    return "Error: API Key no configurada correctamente.";
  }

  const prompt = `
    Actúa como un Consultor de Negocios experto.
    Negocio: ${data.niche} en ${data.location}. Capital: ${data.amount} MXN.
    Explica de forma muy sencilla cómo usar el dinero (2-3 acciones con %).
    Máximo 100 palabras.
  `;

  try {
    // Usamos v1beta y el modelo 8b-latest, que es el que mejor funciona en servidores internacionales
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b-latest:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Si este falla, el problema es que la región del servidor de Hostinger está bloqueada por Google
      if (response.status === 404 || response.status === 429) {
        return "El servicio de IA de Google está restringido en la región de tu servidor o tu cuota es 0. Te recomendamos crear una nueva API Key asegurándote de no tener restricciones de facturación o verificar la ubicación de tu hosting.";
      }
      return `Error ${response.status}: ${errorData.error?.message || 'Error de Google'}`;
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el plan.";
  } catch (error: any) {
    return `Error de red: Verifica tu conexión y la API Key.`;
  }
};