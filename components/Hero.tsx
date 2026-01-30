import React from 'react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Abstract Background Effects */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        {/* Soft green glow top right */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-firma-green/10 rounded-full blur-[120px] mix-blend-multiply"></div>
        {/* Subtle geometric shape */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-firma-green/5 to-transparent transform -skew-x-12 translate-x-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-xs font-semibold tracking-wider text-firma-green uppercase mb-6 bg-firma-green/5">
              Consultoría Financiera Premium
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-charcoal leading-tight mb-8">
              Inyección de Capital Estratégico para el <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-firma-green to-midnight">México que Produce</span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
          >
            No solo buscamos financiamiento; diseñamos el impulso que tu empresa necesita para escalar. Calidad premium en asesoría financiera empresarial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button 
              onClick={() => document.getElementById('profiling')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-charcoal text-white px-8 py-4 text-base font-medium tracking-wide hover:bg-firma-green transition-all duration-300 shadow-xl shadow-gray-200/50 hover:shadow-firma-green/20"
            >
              Iniciar Diagnóstico
            </button>
            <button 
              onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-charcoal border border-gray-200 px-8 py-4 text-base font-medium tracking-wide hover:bg-gray-50 hover:text-firma-green hover:border-firma-green/30 transition-all duration-300"
            >
              Conocer Metodología
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};