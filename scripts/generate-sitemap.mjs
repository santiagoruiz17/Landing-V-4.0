// Genera public/sitemap.xml en cada build (npm run build).
// - Páginas fijas del sitio y landings de alianzas (carpetas dentro de /alianzas, sin /portal).
// - Artículos del blog, leídos de Supabase (si hay credenciales y respuesta; si falla, se omiten sin romper el build).
// - lastmod: fecha del último commit que tocó el archivo de cada página (si hay historial de git); si no, se omite.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://firma7.com';

// Credenciales: variables de entorno del build o archivos .env locales
function leerEnv() {
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

function ultimaModificacion(archivoRelativo) {
  try {
    const fecha = execFileSync('git', ['log', '-1', '--format=%cs', '--', archivoRelativo], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null;
  } catch {
    return null;
  }
}

const escXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urls = [];
const agregar = (loc, { archivo, lastmod, changefreq, priority }) => {
  urls.push({ loc, lastmod: lastmod ?? (archivo ? ultimaModificacion(archivo) : null), changefreq, priority });
};

// Páginas fijas
agregar(`${SITE}/`, { archivo: 'components/Hero.tsx', changefreq: 'weekly', priority: '1.0' });
agregar(`${SITE}/perfil`, { archivo: 'pages/Perfil.tsx', changefreq: 'monthly', priority: '0.9' });
agregar(`${SITE}/calculadora`, { archivo: 'pages/Calculadora.tsx', changefreq: 'monthly', priority: '0.7' });
agregar(`${SITE}/blog`, { archivo: 'pages/Blog.tsx', changefreq: 'weekly', priority: '0.7' });
agregar(`${SITE}/quiero-ser-aliado`, { archivo: 'pages/QuieroSerAliado.tsx', changefreq: 'monthly', priority: '0.6' });
agregar(`${SITE}/aviso-de-privacidad`, { archivo: 'pages/AvisoPrivacidad.tsx', changefreq: 'yearly', priority: '0.3' });

// Alianzas: directorio y una landing por socio (el portal NO va en el sitemap)
const alianzasDir = path.join(root, 'alianzas');
if (fs.existsSync(path.join(alianzasDir, 'index.html'))) {
  agregar(`${SITE}/alianzas/`, { archivo: 'alianzas/index.html', changefreq: 'monthly', priority: '0.6' });
}
if (fs.existsSync(alianzasDir)) {
  const socios = fs.readdirSync(alianzasDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'portal' && fs.existsSync(path.join(alianzasDir, d.name, 'index.html')))
    .map((d) => d.name)
    .sort();
  for (const slug of socios) {
    agregar(`${SITE}/alianzas/${slug}/`, { archivo: `alianzas/${slug}/index.html`, changefreq: 'monthly', priority: '0.5' });
  }
}

// Artículos del blog (Supabase)
let articulos = 0;
try {
  const env = leerEnv();
  const base = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (base && key) {
    const res = await fetch(`${base}/rest/v1/blog_posts?select=slug,updated_at,published_at&order=published_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const posts = await res.json();
      for (const p of posts) {
        if (!p.slug) continue;
        const fecha = (p.updated_at || p.published_at || '').slice(0, 10);
        agregar(`${SITE}/blog/${encodeURIComponent(p.slug)}`, { lastmod: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null, changefreq: 'monthly', priority: '0.6' });
        articulos++;
      }
    } else {
      console.warn(`[sitemap] No se pudieron leer los artículos del blog (HTTP ${res.status}); se omiten.`);
    }
  } else {
    console.warn('[sitemap] Sin credenciales de Supabase en el entorno; se omiten los artículos del blog.');
  }
} catch (e) {
  console.warn('[sitemap] No se pudieron leer los artículos del blog; se omiten.', e?.message ?? e);
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map((u) =>
      '  <url>\n' +
      `    <loc>${escXml(u.loc)}</loc>\n` +
      (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      '  </url>\n'
    )
    .join('') +
  '</urlset>\n';

fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), xml);
console.log(`[sitemap] ${urls.length} URLs (${articulos} artículos del blog) → public/sitemap.xml`);
