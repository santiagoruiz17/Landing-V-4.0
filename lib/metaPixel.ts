declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// El primer PageView ya lo dispara el script inline de index.html al cargar
// el sitio. Como es una SPA, las siguientes navegaciones no recargan la
// página — hay que dispararlo a mano en cada cambio de ruta.
let hasSkippedInitialPageView = false;

export function trackPageView(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (!hasSkippedInitialPageView) {
    hasSkippedInitialPageView = true;
    return;
  }
  window.fbq('track', 'PageView');
}

export function trackLead(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', 'Lead');
}

export function trackCompleteRegistration(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', 'CompleteRegistration');
}
