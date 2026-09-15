declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Wrapper sobre gtag (ya inicializado en public/analytics-init.js) para poder
// armar embudos de abandono en GA4 sin depender de otro proveedor.
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
