import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Partners } from './components/Partners';
import { Methodology } from './components/Methodology';
import { ProfilingForm } from './components/ProfilingForm';
import { AISimulator } from './components/AISimulator';
import { Stats } from './components/Stats';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Navbar />
      <main>
        <Hero />
        <Partners />
        <Methodology />
        <AISimulator />
        <Stats />
        <ProfilingForm />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;