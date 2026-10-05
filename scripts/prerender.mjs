// Se corre DESPUÉS de `vite build`. El sitio es una SPA: todas las rutas sirven el mismo index.html, así que
// WhatsApp, Facebook y el primer rastreo de Google verían siempre el título/imagen de la página de inicio.
// Este script crea una copia de dist/index.html por cada página pública con SU PROPIO título, descripción,
// canonical, imagen para compartir y datos estructurados (JSON-LD). Se guardan en dist/_prerender/ y el
// .htaccess las sirve en la URL normal (/perfil, /blog/mi-articulo…). React funciona igual encima.
import fs from 'fs';
import path from 'path';
import { root, leerArticulos } from './lib-env.mjs';

const SITE = 'https://firma7.com';
const dist = path.join(root, 'dist');
const rutas = JSON.parse(fs.readFileSync(path.join(root, 'seo', 'rutas.json'), 'utf8'));

const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const recorta = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

function fijarMeta(html, atributo, clave, contenido) {
  const re = new RegExp(String.raw`<meta\s+${atributo}="${clave}"\s+content="[^"]*"\s*/?>`);
  if (!re.test(html)) throw new Error(`index.html no tiene <meta ${atributo}="${clave}">`);
  return html.replace(re, `<meta ${atributo}="${clave}" content="${escAttr(contenido)}" />`);
}

function jsonLdBloque(html) {
  const m = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  if (!m) throw new Error('index.html no tiene JSON-LD');
  return { texto: m[0], datos: JSON.parse(m[1]) };
}

function construir(p) {
  let html = base;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(p.title)}</title>`);
  html = fijarMeta(html, 'name', 'description', p.description);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${p.url}" />`);
  html = fijarMeta(html, 'property', 'og:title', p.title);
  html = fijarMeta(html, 'property', 'og:description', p.description);
  html = fijarMeta(html, 'property', 'og:url', p.url);
  html = fijarMeta(html, 'name', 'twitter:title', p.title);
  html = fijarMeta(html, 'name', 'twitter:description', p.description);
  html = html.replace(/(<meta property="og:type" content=")website(")/, `$1${p.tipoOg || 'website'}$2`);
  if (p.imagen) {
    html = fijarMeta(html, 'property', 'og:image', p.imagen);
    html = fijarMeta(html, 'name', 'twitter:image', p.imagen);
    html = html.replace(/<meta property="og:image:width"[^>]*\/>\s*/, '').replace(/<meta property="og:image:height"[^>]*\/>\s*/, '');
    html = fijarMeta(html, 'property', 'og:image:alt', p.titulo || p.title);
    html = fijarMeta(html, 'name', 'twitter:image:alt', p.titulo || p.title);
  }
  if (p.noindex) html = fijarMeta(html, 'name', 'robots', 'noindex, follow');

  // JSON-LD: se conserva la organización y el sitio; se quitan la ficha de la portada y su FAQ.
  const { texto, datos } = jsonLdBloque(html);
  const nodos = datos['@graph'].filter((n) => n['@type'] !== 'WebPage' && n['@type'] !== 'FAQPage');
  const pagina = {
    '@type': 'WebPage',
    '@id': `${p.url}#webpage`,
    url: p.url,
    name: p.title,
    description: p.description,
    isPartOf: { '@id': `${SITE}/#website` },
    about: { '@id': `${SITE}/#organization` },
    inLanguage: 'es-MX',
    breadcrumb: { '@id': `${p.url}#breadcrumb` },
  };
  const migas = {
    '@type': 'BreadcrumbList',
    '@id': `${p.url}#breadcrumb`,
    itemListElement: p.migas.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.nombre, item: m.url })),
  };
  const nuevos = [...nodos, pagina, migas, ...(p.extra || [])];
  html = html.replace(texto, `<script type="application/ld+json">\n  ${JSON.stringify({ '@context': 'https://schema.org', '@graph': nuevos })}\n  </script>`);
  return html;
}

function escribir(rutaUrl, p) {
  const archivo = path.join(dist, '_prerender', `${rutaUrl.replace(/^\//, '')}.html`);
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, construir(p));
}

const inicio = { nombre: 'Inicio', url: `${SITE}/` };
const articulos = await leerArticulos('slug,title,excerpt,cover_image_url,category,published_at,updated_at');

let total = 0;
try {
for (const [ruta, r] of Object.entries(rutas)) {
  const url = `${SITE}${ruta}`;
  const p = { url, title: r.title, description: r.description, migas: [inicio, { nombre: r.nombre, url }] };
  if (ruta === '/blog') p.noindex = articulos.length === 0;
  if (ruta === '/calculadora') {
    p.extra = [{
      '@type': 'WebApplication',
      '@id': `${url}#app`,
      name: r.nombre,
      url,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'es-MX',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
      publisher: { '@id': `${SITE}/#organization` },
    }];
  }
  escribir(ruta, p);
  total++;
}

for (const a of articulos) {
  const url = `${SITE}/blog/${encodeURIComponent(a.slug)}`;
  const titulo = `${a.title} | Blog Firma 7`;
  const descripcion = recorta((a.excerpt || 'Consejos sobre crédito empresarial y financiamiento PyME en México.').replace(/\s+/g, ' ').trim(), 155);
  const imagen = a.cover_image_url && /^https:\/\//.test(a.cover_image_url) ? a.cover_image_url : null;
  escribir(`/blog/${a.slug}`, {
    url,
    title: titulo,
    titulo: a.title,
    description: descripcion,
    tipoOg: 'article',
    imagen,
    migas: [inicio, { nombre: 'Blog', url: `${SITE}/blog` }, { nombre: a.title, url }],
    extra: [{
      '@type': 'BlogPosting',
      '@id': `${url}#articulo`,
      mainEntityOfPage: { '@id': `${url}#webpage` },
      headline: a.title,
      description: descripcion,
      ...(imagen ? { image: [imagen] } : {}),
      ...(a.category ? { articleSection: a.category } : {}),
      datePublished: a.published_at,
      dateModified: a.updated_at || a.published_at,
      inLanguage: 'es-MX',
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
    }],
  });
  total++;
}

} catch (e) {
  console.warn('[prerender] No se pudo generar el HTML por página; el sitio sigue funcionando con el index.html común.', e?.message ?? e);
  fs.rmSync(path.join(dist, '_prerender'), { recursive: true, force: true });
  process.exit(0);
}

console.log(`[prerender] ${total} páginas con su propio HTML (${articulos.length} artículos del blog) → dist/_prerender/`);
