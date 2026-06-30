import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const NotFound: React.FC = () => {
  useSEO({
    title: 'Página no encontrada | Firma 7',
    description: 'La página que buscas no existe o fue movida.',
    canonical: 'https://firma7.com/404',
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX size={32} className="text-gray-400" />
          </div>
          <span className="inline-block py-1 px-3 border border-gray-200 rounded-full text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">
            Error 404
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal font-bold mb-4">
            No encontramos esta página
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto mb-8">
            El enlace que seguiste puede estar roto o la página fue movida. Verifica la dirección o regresa al inicio.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-firma-green text-white font-bold rounded-full hover:bg-emerald-600 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al inicio
          </button>
        </div>
      </main>
    </div>
  );
};
