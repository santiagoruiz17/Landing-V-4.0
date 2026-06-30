import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const TerminosCondiciones: React.FC = () => {
  // TODO: una vez publicado el texto legal definitivo, reemplazar el contenido
  // de abajo y cambiar noindex a false para que la página se indexe.
  useSEO({
    title: 'Términos y Condiciones | Firma 7',
    description: 'Términos y condiciones de uso del sitio web y los servicios de SOC · Firma 7.',
    canonical: 'https://firma7.com/terminos-y-condiciones',
    noindex: true,
  });

  const navigate = useNavigate();

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText size={24} className="text-firma-green" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-charcoal font-bold mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Estamos preparando el texto completo de nuestros Términos y Condiciones de uso. Si tienes dudas sobre el
            uso de este sitio o nuestros servicios mientras tanto, contáctanos directamente.
          </p>
          <a
            href="https://wa.me/525525069817?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20los%20T%C3%A9rminos%20y%20Condiciones%20del%20sitio."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-firma-green text-white font-semibold rounded-full hover:bg-emerald-600 transition-colors no-underline text-sm"
          >
            Contactar a un asesor
          </a>
        </div>
      </main>
    </div>
  );
};
