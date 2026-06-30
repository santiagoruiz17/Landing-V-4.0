import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SocialProofToast } from './components/SocialProofToast';
import { ExitIntentPopup } from './components/ExitIntentPopup';
import { useSEO } from './hooks/useSEO';

const Partners    = React.lazy(() => import('./components/Partners').then(m => ({ default: m.Partners })));
const Methodology = React.lazy(() => import('./components/Methodology').then(m => ({ default: m.Methodology })));
const Stats       = React.lazy(() => import('./components/Stats').then(m => ({ default: m.Stats })));
const FAQ         = React.lazy(() => import('./components/FAQ').then(m => ({ default: m.FAQ })));
const Footer      = React.lazy(() => import('./components/Footer').then(m => ({ default: m.Footer })));

const Perfil              = React.lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })));
const Calculadora         = React.lazy(() => import('./pages/Calculadora').then(m => ({ default: m.Calculadora })));
const Aprobado            = React.lazy(() => import('./pages/Aprobado').then(m => ({ default: m.Aprobado })));
const Espera              = React.lazy(() => import('./pages/Espera').then(m => ({ default: m.Espera })));
const AvisoPrivacidad     = React.lazy(() => import('./pages/AvisoPrivacidad').then(m => ({ default: m.AvisoPrivacidad })));
const DocumentosRecibidos = React.lazy(() => import('./pages/DocumentosRecibidos').then(m => ({ default: m.DocumentosRecibidos })));

const SectionFallback = () => <div className="py-24 bg-white" />;

function PerfilCTA() {
  const navigate = useNavigate();
  return (
    <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
          Pre-Calificación Gratuita
        </span>

        <h2 className="text-3xl md:text-5xl font-serif text-charcoal mb-6">
          ¿Tu empresa califica para un{' '}
          <span className="italic text-firma-green">crédito empresarial</span>?
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light mb-10">
          Completa tu perfil en menos de 3 minutos. Nuestros socios directores analizan tu caso y te conectan con la institución financiera ideal.
        </p>

        {/* Feature list */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {[
            { icon: '⚡', text: 'Respuesta en 24–72 hrs' },
            { icon: '🏦', text: '+20 instituciones financieras' },
            { icon: '🔒', text: 'Datos 100% seguros' },
            { icon: '✅', text: 'Sin costo de consultoría' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
              <span>{item.icon}</span>
              <span className="text-sm font-medium text-charcoal">{item.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/perfil')}
          className="inline-flex items-center gap-3 px-10 py-4 bg-firma-green text-white rounded-full text-base font-bold
            shadow-lg shadow-firma-green/30 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-firma-green/40
            active:translate-y-0 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Iniciar mi pre-calificación
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p className="mt-4 text-xs text-gray-400 font-light tracking-wide italic">
          Sin compromisos · Completamente gratuito
        </p>
      </div>
    </section>
  );
}

function LandingPage() {
  useSEO({
    title: 'Crédito Empresarial y Financiamiento para PyMEs en México | SOC · Firma 7',
    description: 'Obtén crédito empresarial, inyección de capital y financiamiento para tu PyME en México. SOC · Firma 7 compara +20 instituciones financieras para conseguirte la mejor tasa. Respuesta en 24–72 horas, sin burocracia bancaria.',
    canonical: 'https://firma7.com/',
  });

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Navbar />
      <ExitIntentPopup />
      <SocialProofToast />
      <main>
        <Hero />
        <Suspense fallback={<SectionFallback />}><Partners /></Suspense>
        <Suspense fallback={<SectionFallback />}><Methodology /></Suspense>
        <Suspense fallback={<SectionFallback />}><Stats /></Suspense>
        <PerfilCTA />
        <Suspense fallback={<SectionFallback />}><FAQ /></Suspense>
      </main>
      <Suspense fallback={<div className="py-12 bg-charcoal" />}><Footer /></Suspense>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/calculadora" element={<Calculadora />} />
          <Route path="/aprobado" element={<Aprobado />} />
          <Route path="/espera" element={<Espera />} />
          <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
          <Route path="/documentos-recibidos" element={<DocumentosRecibidos />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
