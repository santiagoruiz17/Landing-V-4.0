import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

// ─── GHL document upload forms ─────────────────────────────────────────────────
const FORM_FISICA = { id: '09uTR2kfDvaEd9HIGT9o', name: 'FORMULARIO DOCUMENTOS PFAE', height: 1900 };
const FORM_MORAL  = { id: '1Y9mjxUgKcICNapChZuj', name: 'FORMULARIO DOCUMENTOS PM', height: 2461 };

// ─── Main Component ───────────────────────────────────────────────────────────
export const Aprobado: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'fisica';
  const nombre = searchParams.get('nombre') || '';
  const esMoral = tipo === 'moral';
  const formConfig = esMoral ? FORM_MORAL : FORM_FISICA;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch {} };
  }, []);

  // Detecta el envío del formulario GHL (postMessage del iframe) y redirige
  // al inicio mostrando una pantalla de confirmación, en vez de dejar que el
  // iframe muestre su propio "siguiente paso" (otro formulario).
  useEffect(() => {
    const allowedOrigins = ['https://api.leadconnectorhq.com', 'https://link.msgsndr.com', 'https://widgets.leadconnectorhq.com'];
    const handleMessage = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) return;
      const raw = event.data;
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
      if (/submit/i.test(text)) {
        navigate('/documentos-recibidos');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    script.onload = () => {
      const confetti = (window as any).confetti;
      const duration = 3000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        const count = 50 * ((end - Date.now()) / duration);
        confetti({ particleCount: count, origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() - 0.2 }, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 });
        confetti({ particleCount: count, origin: { x: Math.random() * 0.3 + 0.6, y: Math.random() - 0.2 }, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 });
      }, 250);
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline">
            <svg viewBox="0 0 100 100" fill="#006d4e" className="w-9 h-9">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#006d4e]">SOC</span>
                <div className="h-5 w-px bg-[#006d4e]" />
                <span className="text-xl font-medium text-[#006d4e]">FIRMA 7</span>
              </div>
              <span className="hidden sm:block text-[0.5rem] font-bold tracking-[0.15em] text-[#006d4e] uppercase">
                LÍDERES EN ASESORÍA FINANCIERA
              </span>
            </div>
          </a>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#006d4e] text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Ir al inicio
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* ── Celebration banner ──────────────────────── */}
        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-2 border-[#86efac] rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-[#006d4e] to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#006d4e]/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/70 border border-[#bbf7d0] rounded-full px-4 py-1.5 mb-3">
            <span className="text-xs font-bold tracking-widest text-[#166534] uppercase">Pre-calificación exitosa</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#166534] font-bold mb-2">
            {nombre ? `¡Felicidades, ${nombre}!` : '¡Felicidades!'}
          </h1>
          <p className="text-[#15803d] text-base leading-relaxed">
            Tu empresa <strong>pre-califica</strong> para un crédito empresarial con nuestras instituciones financieras.
          </p>
        </div>

        {/* ── Next step card ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#006d4e]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={18} className="text-[#006d4e]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-charcoal mb-1">Siguiente paso: reunir tu documentación</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Para avanzar con tu solicitud necesitamos verificar algunos documentos. Completa el formulario de abajo
                con la información solicitada y adjunta tus archivos. Nuestro equipo los revisará y te contactará en 24–72 horas.
              </p>
            </div>
          </div>
        </div>

        {/* ── Security notice ─────────────────────────── */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <Shield size={16} className="text-[#006d4e] flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-snug">
            <strong className="text-gray-700">Tu información está protegida.</strong>{' '}
            Todos los documentos se transmiten de forma encriptada y únicamente nuestro equipo autorizado tiene acceso a ellos.
          </p>
        </div>

        {/* ── GHL Documentation Upload Form ───────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#006d4e] to-emerald-600 px-6 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={22} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl md:text-2xl">Sube tu documentación</h2>
                <p className="text-[#b8ddd3] text-xs md:text-sm mt-0.5">
                  Formulario seguro · {esMoral ? 'Persona Moral' : 'Persona Física con Actividad Empresarial'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-2 sm:p-3 bg-gray-50">
            <iframe
              key={formConfig.id}
              src={`https://api.leadconnectorhq.com/widget/form/${formConfig.id}`}
              style={{ width: '100%', height: formConfig.height, border: 'none', borderRadius: '12px', display: 'block' }}
              id={`inline-${formConfig.id}`}
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name={formConfig.name}
              data-height={formConfig.height}
              data-layout-iframe-id={`inline-${formConfig.id}`}
              data-form-id={formConfig.id}
              title={formConfig.name}
              className="bg-white"
            />
          </div>
        </div>

        {/* ── Support CTA ─────────────────────────────── */}
        <div className="bg-charcoal rounded-2xl p-8 text-center text-white">
          <h3 className="font-serif text-2xl mb-2">¿Tienes dudas sobre la documentación?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Un asesor te guía paso a paso para reunir y enviar cada documento sin errores.
          </p>
          <a
            href="https://wa.me/525525069817?text=Hola%2C%20mi%20perfil%20fue%20pre-aprobado%20y%20tengo%20dudas%20sobre%20la%20documentaci%C3%B3n%20requerida."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#1ebe5c] transition-colors no-underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.271-.099-.47-.148-.666.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.296-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.523 5.849L.054 23.486a.5.5 0 00.612.608l5.678-1.487A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.076-1.387l-.364-.215-3.769.988.997-3.707-.237-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Hablar con un asesor
          </a>
        </div>

        <p className="text-center text-gray-400 text-xs pb-6">
          © {new Date().getFullYear()} Firma 7 · SOC Asesores · Toda tu información está protegida
          {' · '}
          <a href="/aviso-de-privacidad" className="text-gray-400 hover:text-[#006d4e] underline">Aviso de Privacidad</a>
        </p>
      </main>
    </div>
  );
};
