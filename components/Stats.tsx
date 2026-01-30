import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  {
    value: "+30",
    label: "Millones de Pesos Colocados",
    description: "Capital inyectado directamente en la economía mexicana."
  },
  {
    value: "+300",
    label: "Empresas Impulsadas",
    description: "Desde PyMEs en expansión hasta grandes corporativos."
  },
  {
    value: "96%",
    label: "Tasa de Aprobación",
    description: "En expedientes que completan nuestro proceso de blindaje."
  },
  {
    value: "+20",
    label: "Años de Experiencia",
    description: "Trayectoria combinada de nuestros socios consultores."
  }
];

export const Stats: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50 border-b border-gray-100 relative overflow-hidden">
       {/* Decorative subtle background */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-firma-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-charcoal/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-firma-green font-semibold tracking-wider uppercase text-xs">Nuestra Trayectoria</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-serif text-charcoal">
            Resultados que construyen confianza
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <h3 className="text-4xl md:text-5xl font-serif text-charcoal mb-2 group-hover:text-firma-green transition-colors duration-300">
                {stat.value}
              </h3>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                {stat.label}
              </p>
              <div className="h-1 w-12 bg-gray-200 mx-auto mb-4 group-hover:bg-firma-green transition-colors duration-300"></div>
              <p className="text-sm text-gray-500 leading-relaxed px-4">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};