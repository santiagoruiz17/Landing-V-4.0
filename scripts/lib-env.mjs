// Credenciales para los scripts de build: variables de entorno o archivos .env locales.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function leerEnv() {
  const env = { ...process.env };
  for (const f of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    for (const linea of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

// Artículos publicados del blog. Devuelve [] si no hay credenciales o falla la consulta (el build no se rompe).
export async function leerArticulos(campos) {
  try {
    const env = leerEnv();
    const base = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_ANON_KEY;
    if (!base || !key) {
      console.warn('[seo] Sin credenciales de Supabase en el entorno; se omiten los artículos del blog.');
      return [];
    }
    const res = await fetch(`${base}/rest/v1/blog_posts?select=${campos}&order=published_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[seo] No se pudieron leer los artículos del blog (HTTP ${res.status}); se omiten.`);
      return [];
    }
    return (await res.json()).filter((p) => p.slug);
  } catch (e) {
    console.warn('[seo] No se pudieron leer los artículos del blog; se omiten.', e?.message ?? e);
    return [];
  }
}
