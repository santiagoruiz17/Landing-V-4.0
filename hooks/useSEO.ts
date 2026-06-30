import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Updates document title, meta description/robots, OG tags and the canonical
// link on route change. The SPA serves one static index.html for every route,
// so without this every page shares the same canonical/title — Google treats
// them as duplicates of the homepage and never indexes them separately.
export function useSEO({ title, description, canonical, noindex = false }: SEOOptions) {
  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonical);
    setMetaTag(
      'name',
      'robots',
      noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical;
  }, [title, description, canonical, noindex]);
}
