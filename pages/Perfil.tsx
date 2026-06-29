import React, { Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { ProfilingForm } from '../components/ProfilingForm';

const Footer = React.lazy(() => import('../components/Footer').then(m => ({ default: m.Footer })));

export const Perfil: React.FC = () => {
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
