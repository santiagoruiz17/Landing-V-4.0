import React from 'react';
import { Target, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Target className="w-8 h-8 text-firma-green" />,
    title: "Diagnóstico Preciso",
    description: "Analizamos la salud real de tu empresa más allá de los números simples, identificando oportunidades ocultas de apalancamiento."
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-firma-green" />,
    title: "Estructuración de Capital",
    description: "Diseñamos la mezcla perfecta de deuda y capital para potenciar tu crecimiento sin asfixiar tu flujo de caja operativo."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-firma-green" />,
    title: "Blindaje Financiero",
    description: "Te conectamos con las mejores instituciones financieras protegiendo tus intereses con negociación experta."
  }
];

export const Methodology: React.FC = () => {
  return (
    <section id="methodology" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background wash */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-firma-green/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <span className="text-firma-green font-medium tracking-wider uppercase text-sm font-sans bg-firma-green/5 px-2 py-1 rounded">Nuestro Enfoque</span>
            <h2 className="mt-4 text-4xl font-serif text-charcoal mb-6">
              Más que un broker, somos tu brazo estratégico.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              En Firma 7 entendemos que el capital es solo combustible. Lo que realmente mueve a una empresa es la estrategia detrás de cada peso invertido.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Actuamos como directores financieros externos, alineando tus objetivos comerciales con las realidades del mercado crediticio mexicano actual.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="flex items-start p-6 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-lg hover:shadow-firma-green/5 hover:border-firma-green/20 transition-all duration-300"
              >
                <div className="flex-shrink-0 mr-4 mt-1 bg-firma-green/10 p-2 rounded-full">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-medium text-charcoal mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};