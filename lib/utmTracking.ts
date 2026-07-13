// Captura de parámetros UTM de campañas (Facebook/Instagram/Google, etc.) para
// poder ver después de qué campaña vino cada lead.
//
// El usuario puede entrar por cualquier página (home, blog, /quiero-ser-aliado...)
// antes de llegar al formulario de perfilamiento, así que la captura vive aquí
// (llamada una sola vez desde App.tsx al montar) y no dentro de ProfilingForm.

const STORAGE_KEY = 'firma7_utm_params';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días — ventana típica de atribución de campaña

export interface UtmParams {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
}

const EMPTY: UtmParams = { utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '' };

// Se llama una vez al cargar la SPA. Si la URL actual trae utm_*, los guarda
// (sobreescribiendo cualquier atribución previa — "last touch"). Si no trae
// ninguno, no toca lo que ya hubiera guardado de una visita anterior.
export function captureUtmParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') ?? '';
    const utmMedium = params.get('utm_medium') ?? '';
    const utmCampaign = params.get('utm_campaign') ?? '';
    const utmContent = params.get('utm_content') ?? '';

    if (!utmSource && !utmMedium && !utmCampaign && !utmContent) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ utmSource, utmMedium, utmCampaign, utmContent, savedAt: Date.now() })
    );
  } catch {
    /* noop */
  }
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) return EMPTY;
    return {
      utmSource: parsed.utmSource ?? '',
      utmMedium: parsed.utmMedium ?? '',
      utmCampaign: parsed.utmCampaign ?? '',
      utmContent: parsed.utmContent ?? '',
    };
  } catch {
    return EMPTY;
  }
}
