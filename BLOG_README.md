# Blog (sincronizado con Notion) — Firma 7

## 📋 Descripción
El blog vive en `/blog` (índice) y `/blog/:slug` (artículo). El contenido **no se escribe en el código**: se escribe en una base de datos de Notion y se sincroniza automáticamente a la tabla `blog_posts` de Supabase, que es lo que el sitio realmente lee.

## ✍️ Cómo agregar un artículo
1. Abre la base de datos de Notion **"BLOG PAGINA WEB FIRMA 7"**.
2. Ahí mismo hay una nota fijada **"📌 COMO AGREGAR UN ARTÍCULO (leer primero)"** con la guía completa y los consejos — este archivo es el respaldo técnico de esa misma guía.
3. Crea una nueva entrada, llena los campos, escribe el contenido en el cuerpo de la página.
4. Cambia **Estado** a `Publicado` cuando esté listo.
5. Espera hasta 15 minutos (sincronización automática) o pide que se dispare al instante.

## 🗂️ Campos de la base de Notion
| Campo | Tipo | Uso |
|---|---|---|
| Nombre | title | Título del artículo |
| Estado | select (`Borrador` / `Publicado`) | Solo `Publicado` sale en el sitio |
| Extracto | texto | Resumen corto (tarjeta + meta descripción SEO) |
| Categoria | select | Opcional, para clasificar |
| Portada | url | Opcional, imagen de portada (ideal ~1200×630px) |
| Slug | texto | Opcional; si se deja vacío, se genera del título |

## ✅ Bloques de contenido soportados
Párrafos, encabezados (H1/H2/H3), listas con viñetas y numeradas, citas, bloques de código, imágenes, divisores.

**No soportados aún** (se ignoran en silencio si se usan): toggles, tablas, columnas, embeds, callouts. Evitarlos dentro del contenido de un artículo real (sí se pueden usar libremente en páginas que se queden en `Borrador`, como la guía interna).

## ⚠️ Despublicar un artículo
La sincronización solo **agrega o actualiza** artículos marcados `Publicado` — **no borra automáticamente** uno que se regresa a `Borrador`. Para quitar un artículo del sitio, hay que pedir que se elimine manualmente de la tabla `blog_posts` en Supabase.

## 🔧 Arquitectura técnica
- **Edge Function** `sync-notion-blog` (Supabase): consulta la base de Notion (filtrando `Estado = Publicado`), convierte los bloques de cada página a HTML, y hace upsert en `public.blog_posts`.
- **Disparo**: `pg_cron` cada 15 minutos (`select public.trigger_notion_sync();`), autenticado con un secreto compartido guardado en Supabase Vault (`notion_sync_webhook_secret`).
- **Sincronización manual**: `select public.trigger_notion_sync();` desde el SQL Editor de Supabase, o pedirle a Claude que la dispare.
- **Credenciales** (Supabase Vault, no en código): `notion_token`, `notion_database_id`.
- **Seguridad**: `blog_posts` tiene RLS con solo lectura pública (`select` para `anon`); la escritura únicamente ocurre vía la Edge Function con `service_role`, nunca expuesta al navegador.
- **Frontend**: `pages/Blog.tsx` (índice) y `pages/BlogPost.tsx` (detalle), contenido renderizado con `dangerouslySetInnerHTML` sanitizado con `dompurify`.

## 📞 Soporte
Si algo no se ve bien o el artículo no aparece, avisa qué artículo y qué problema hay para revisarlo.
