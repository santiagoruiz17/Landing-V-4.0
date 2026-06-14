import React, { Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SocialProofToast } from './components/SocialProofToast';
import { ExitIntentPopup } from './components/ExitIntentPopup';

const Partners = React.lazy(() => import('./components/Partners').then(m => ({ default: m.Partners })));
const Methodology = React.lazy(() => import('./components/Methodology').then(m => ({ default: m.Methodology })));
const Stats = React.lazy(() => import('./components/Stats').then(m => ({ default: m.Stats })));
const ProfilingForm = React.lazy(() => import('./components/ProfilingForm').then(m => ({ default: m.ProfilingForm })));
const FAQ = React.lazy(() => import('./components/FAQ').then(m => ({ default: m.FAQ })));
const Footer = React.lazy(() => import('./components/Footer').then(m => ({ default: m.Footer })));

const SectionFallback = () => <div className="py-24 bg-white" />;

function App() {
  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Navbar />
      <ExitIntentPopup />
      <SocialProofToast />
      <main>
        <Hero />
        <Suspense fallback={<SectionFallback />}>
          <Partners />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Methodology />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Stats />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <ProfilingForm />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FAQ />
        </Suspense>
      </main>
      <Suspense fallback={<div className="py-12 bg-charcoal" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
