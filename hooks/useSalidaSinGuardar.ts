import { useCallback, useEffect, useRef, useState } from 'react';

// Detecta cuando el cliente intenta salir con avance sin guardar y abre una burbuja para que lo guarde.
//  - Botón "atrás" (celular y computadora): se intercepta con una entrada de historial.
//  - Clic en cualquier liga que saque de la página: se intercepta.
//  - Computadora: el mouse sale por arriba de la ventana (hacia pestañas/cerrar) → se avisa una vez.
//  - Cerrar pestaña o recargar: el navegador muestra su propio aviso (no se puede personalizar ni poner botones).
// En celular, si el cliente cierra la app o cambia de aplicación, ningún navegador permite mostrar nada.
export function useSalidaSinGuardar(activo: boolean) {
  const [mostrar, setMostrar] = useState(false);
  const destino = useRef<(() => void) | null>(null);
  const saliendo = useRef(false);
  const avisoDeMouse = useRef(false);

  useEffect(() => {
    if (!activo) setMostrar(false);
  }, [activo]);

  useEffect(() => {
    if (!activo) return;
    saliendo.current = false;
    avisoDeMouse.current = false;

    const antesDeCerrar = (e: BeforeUnloadEvent) => {
      if (saliendo.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    // Entrada extra en el historial: el primer "atrás" se queda aquí y abre la burbuja.
    window.history.pushState({ ...(window.history.state || {}), sinGuardar: true }, '');
    const alRetroceder = () => {
      if (saliendo.current) return;
      window.history.pushState({ ...(window.history.state || {}), sinGuardar: true }, '');
      destino.current = () => {
        saliendo.current = true;
        window.history.go(-2);
        // Si no hay página anterior (abrió el enlace directo), se va al inicio.
        window.setTimeout(() => { window.location.href = '/'; }, 600);
      };
      setMostrar(true);
    };

    const alHacerClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self')) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || /^(mailto:|tel:|sms:|javascript:)/i.test(href)) return;
      let url: URL;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.href === window.location.href) return;
      e.preventDefault();
      e.stopPropagation();
      destino.current = () => { saliendo.current = true; window.location.assign(url.href); };
      setMostrar(true);
    };

    const alSalirElMouse = (e: MouseEvent) => {
      if (avisoDeMouse.current || e.clientY > 0 || e.relatedTarget) return;
      avisoDeMouse.current = true;
      destino.current = null;
      setMostrar(true);
    };

    window.addEventListener('beforeunload', antesDeCerrar);
    window.addEventListener('popstate', alRetroceder);
    document.addEventListener('click', alHacerClic, true);
    document.documentElement.addEventListener('mouseleave', alSalirElMouse);
    return () => {
      window.removeEventListener('beforeunload', antesDeCerrar);
      window.removeEventListener('popstate', alRetroceder);
      document.removeEventListener('click', alHacerClic, true);
      document.documentElement.removeEventListener('mouseleave', alSalirElMouse);
    };
  }, [activo]);

  const cerrar = useCallback(() => setMostrar(false), []);
  const salirSinGuardar = useCallback(() => {
    setMostrar(false);
    destino.current?.();
  }, []);

  return { mostrar, cerrar, salirSinGuardar, puedeSalir: () => destino.current !== null };
}
