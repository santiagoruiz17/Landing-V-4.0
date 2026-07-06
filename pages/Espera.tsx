import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, TrendingUp, Bookmark } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { GuiaDescargable } from '../components/GuiaDescargable';

export const Espera: React.FC = () => {
  useSEO({
    title: 'Perfil en Revisión | Firma 7',
    description: 'Tu perfil fue guardado para una próxima revisión. Te contactaremos cuando mejoren las condiciones o tengamos nuevas opciones de financiamiento.',
    canonical: 'https://firma7.com/espera',
    noindex: true,
  });

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-100">
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">

        {/* ── Status banner ──────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock size={32} className="text-amber-500" strokeWidth={1.8} />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs font-bold tracking-widest text-amber-700 uppercase">Perfil en revisión</span>
          </div>
          <h1 className="font-serif text-3xl text-charcoal font-bold mb-3">
            Por el momento no podemos ayudarte
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
            Tu perfil no cumple con los criterios mínimos que las instituciones financieras con las que trabajamos
            requieren hoy — pero eso puede cambiar.
          </p>
        </div>

        {/* ── Saved data card ────────────────────────────── */}
        <div className="bg-[#006d4e]/5 border border-[#006d4e]/15 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#006d4e] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bookmark size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-charcoal mb-1">Guardamos tus datos</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Hemos registrado tu información para una consulta más adelante. Cuando las condiciones de tu empresa
              mejoren o cuando tengamos nuevas opciones de financiamiento que se ajusten a tu perfil,
              <strong className="text-[#006d4e]"> nuestro equipo te contactará proactivamente</strong>.
            </p>
          </div>
        </div>

        {/* ── Guía descargable ───────────────────────────── */}
        <GuiaDescargable />

        {/* ── Next steps ─────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">
            ¿Qué puedes hacer mientras tanto?
          </h2>
          {[
            {
              icon: <TrendingUp size={18} className="text-[#006d4e]" />,
              title: 'Fortalece tu historial crediticio',
              desc: 'Mantén al día todas tus obligaciones financieras actuales. Un buen historial abre muchas puertas.',
            },
            {
              icon: <Clock size={18} className="text-[#006d4e]" />,
              title: 'Documenta tus ingresos',
              desc: 'Asegura un flujo de caja constante y bien documentado. En 3–6 meses podemos hacer una nueva revisión.',
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#006d4e" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
              title: 'Habla con un asesor',
              desc: 'Podemos darte un diagnóstico personalizado de exactamente qué necesitas mejorar para calificar.',
            },
          ].map((step, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#006d4e]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────── */}
        <div className="bg-charcoal rounded-2xl p-8 text-center text-white">
          <h3 className="font-serif text-2xl mb-2">Hablemos. Sin costo, sin compromiso.</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Un asesor puede orientarte sobre qué pasos concretos mejorarían tu perfil para una próxima solicitud.
          </p>
          <a
            href="https://wa.me/525525069817?text=Hola%2C%20mi%20perfil%20qued%C3%B3%20en%20espera%20y%20me%20gustar%C3%ADa%20saber%20c%C3%B3mo%20mejorar%20mi%20solicitud."
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
          <p className="text-gray-600 text-xs mt-4">
            También puedes seguirnos en{' '}
            <a href="https://www.instagram.com/soc_firma_7/" target="_blank" rel="noopener noreferrer" className="text-[#006d4e] font-semibold no-underline hover:underline">Instagram</a>
            {' · '}
            <a href="https://www.facebook.com/Firma7.Soc" target="_blank" rel="noopener noreferrer" className="text-[#006d4e] font-semibold no-underline hover:underline">Facebook</a>
          </p>
        </div>

        <p className="text-center text-gray-400 text-xs pb-6">
          © {new Date().getFullYear()} Firma 7 · SOC Asesores
          {' · '}
          <a href="/aviso-de-privacidad" className="text-gray-400 hover:text-[#006d4e] underline">Aviso de Privacidad</a>
          {/* Términos y Condiciones: aún no tenemos el texto legal definitivo — oculto para no mostrar una página vacía.
          {' · '}
          <a href="/terminos-y-condiciones" className="text-gray-400 hover:text-[#006d4e] underline">Términos y Condiciones</a>
          */}
        </p>
      </main>
    </div>
  );
};
