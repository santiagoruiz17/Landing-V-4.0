import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
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
              Consultoría Financiera Premium · +300 empresas impulsadas
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-charcoal leading-tight mb-8">
              Crédito Empresarial y Financiamiento PyME en{' '}
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-firma-green to-midnight">México</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Dejaste de crecer porque el banco te dijo no. Nosotros comparamos más de{' '}
            <strong className="font-semibold text-charcoal">20 instituciones financieras</strong>{' '}
            para conseguirte el crédito que tu empresa merece — sin burocracia, con respuesta en 24–72 horas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              onClick={() => navigate('/perfil')}
              className="bg-charcoal text-white px-8 py-4 text-base font-medium tracking-wide hover:bg-firma-green transition-all duration-300 shadow-xl shadow-gray-200/50 hover:shadow-firma-green/20"
            >
              Solicitar Crédito
            </button>
            <button
              onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-charcoal border border-gray-200 px-8 py-4 text-base font-medium tracking-wide hover:bg-gray-50 hover:text-firma-green hover:border-firma-green/30 transition-all duration-300"
            >
              Conocer Metodología
            </button>
          </motion.div>

          {/* Franja de prueba social — visible above the fold */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
          >
            {[
              { value: '+300', label: 'empresas impulsadas' },
              { value: '96%', label: 'tasa de aprobación' },
              { value: '+20', label: 'instituciones financieras' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <span className="hidden sm:block h-6 w-px bg-gray-200" />}
                <div className="text-center">
                  <span className="block text-2xl font-serif font-medium text-charcoal">{stat.value}</span>
                  <span className="block text-xs text-gray-500 tracking-wide">{stat.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-4 text-xs text-gray-400 tracking-wide"
          >
            Sin costo de consultoría · Respuesta en 24–72 horas
          </motion.p>
        </div>
      </div>
    </section>
  );
};