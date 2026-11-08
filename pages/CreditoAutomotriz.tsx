import React, { Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { PerfiladorAutomotriz } from '../components/PerfiladorAutomotriz';
import { useSEO } from '../hooks/useSEO';
import SEO from '../seo/rutas.json';
import FAQ_AUTO from '../seo/faq-automotriz.json';
import { Car, Landmark, Percent, CalendarClock, KeyRound, ChevronDown, ArrowDown } from 'lucide-react';

const Footer = React.lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));

const DATOS = [
  { icon: Car, titulo: 'Nuevos y seminuevos', desc: 'Financiamos autos nuevos y seminuevos.' },
  { icon: KeyRound, titulo: 'Compra donde quieras', desc: 'En agencia, en un lote o con un particular.' },
  { icon: Percent, titulo: 'Enganche desde 10%', desc: 'El enganche mínimo es del 10% del valor del auto.' },
  { icon: CalendarClock, titulo: 'Hasta 120 meses', desc: 'Plazos de hasta 120 meses para pagar.' },
];

const PASOS = [
  { n: '1', t: 'Evalúa tu perfil', d: 'Contesta el formulario: son pocas preguntas y toma unos minutos.' },
  { n: '2', t: 'Sube tus documentos', d: 'Si tu perfil avanza, te mostramos paso a paso qué documentos necesitas, según cómo solicites el crédito.' },
  { n: '3', t: 'Te acompañamos', d: 'Un asesor de Firma 7 te acompaña durante el trámite del crédito bancario.' },
];

export const CreditoAutomotriz: React.FC = () => {
  useSEO({
    ...SEO['/credito-automotriz'],
    canonical: 'https://firma7.com/credito-automotriz',
  });

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-firma-green/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 border border-firma-green/20 rounded-full text-xs font-bold tracking-wider text-firma-green uppercase mb-6 bg-firma-green/5">
            <Landmark size={14} /> Crédito bancario
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium text-charcoal leading-tight mb-6">
            Financia tu próximo{' '}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-firma-green to-midnight">auto</span>{' '}
            con crédito bancario
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed font-light">
            Nuevo o seminuevo, en agencia, lote o con un particular. Nosotros no vendemos autos: nos encargamos de tu crédito.
          </p>
          <a href="#evaluacion" className="inline-flex items-center gap-2 mt-4 px-8 py-4 bg-firma-green text-white rounded-full text-base font-bold shadow-lg shadow-firma-green/30 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all duration-200 no-underline">
            Evaluar mi perfil <ArrowDown size={18} />
          </a>
        </div>
      </section>

      {/* ── Datos clave ──────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DATOS.map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} className="bg-concrete border border-gray-100 rounded-2xl p-6">
                <div className="w-11 h-11 bg-firma-green/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-firma-green" />
                </div>
                <h2 className="font-semibold text-charcoal mb-1.5 text-base">{titulo}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────── */}
      <section className="py-20 bg-concrete">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
              Así de simple
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal">¿Cómo funciona?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PASOS.map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-firma-green text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">{s.n}</div>
                <h3 className="font-semibold text-charcoal mb-2">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulario ───────────────────────────────── */}
      <section id="evaluacion" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
              Empieza hoy
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-3">Evalúa tu perfil para el crédito</h2>
            <p className="text-gray-500">Al terminar, si tu perfil avanza, subes tus documentos y un asesor te acompaña.</p>
          </div>
          <PerfiladorAutomotriz />
          <p className="text-center mt-6 text-xs text-gray-400 max-w-xl mx-auto">
            Sujeto a aprobación bancaria. El crédito lo otorga una institución bancaria; Firma 7 te acompaña en el trámite.
          </p>
        </div>
      </section>

      {/* ── Preguntas frecuentes ─────────────────────── */}
      <section className="py-20 bg-concrete">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ_AUTO.map(item => (
              <details key={item.q} className="group bg-white border border-gray-100 rounded-2xl px-6 py-4 open:shadow-sm">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-charcoal text-[15px]">
                  {item.q}
                  <ChevronDown size={18} className="text-firma-green flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="py-12 bg-charcoal" />}>
        <Footer />
      </Suspense>
    </div>
  );
};
