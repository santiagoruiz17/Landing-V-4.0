import React, { Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { ProfilingForm } from '../components/ProfilingForm';
import { useSEO } from '../hooks/useSEO';

const Footer = React.lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));

export const Perfil: React.FC = () => {
  useSEO({
    title: 'Inicia tu Pre-Calificación de Crédito Empresarial | Firma 7',
    description: 'Completa tu perfil en menos de 3 minutos y descubre si tu PyME califica para un crédito empresarial. Comparamos +20 instituciones financieras para conseguirte la mejor tasa.',
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
