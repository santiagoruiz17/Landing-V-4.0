import React, { Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { ProfilingForm } from '../components/ProfilingForm';
import { useSEO } from '../hooks/useSEO';
import SEO from '../seo/rutas.json';

const Footer = React.lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));

export const Perfil: React.FC = () => {
  useSEO({
    ...SEO['/perfil'],
    canonical: 'https://firma7.com/perfil',
  });

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Navbar />
      <main>
        <ProfilingForm />
      </main>
      <Suspense fallback={<div className="py-12 bg-charcoal" />}>
        <Footer />
      </Suspense>
    </div>
  );
};
