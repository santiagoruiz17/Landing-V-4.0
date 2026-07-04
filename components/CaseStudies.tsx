import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CaseStudy {
  id: string;
  empresa_o_giro: string;
  monto_credito: string;
  tiempo_respuesta: string | null;
  resultado: string;
}

export const CaseStudies: React.FC = () => {
  const [cases, setCases] = useState<CaseStudy[]>([]);

  useEffect(() => {
    supabase
      .from('case_studies')
      .select('id, empresa_o_giro, monto_credito, tiempo_respuesta, resultado')
      .order('orden', { ascending: true })
      .then(({ data }) => setCases(data ?? []));
  }, []);

  if (cases.length === 0) return null;

  return (
    <section className="py-20 bg-white border-b border-gray-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <span className="text-firma-green font-semibold tracking-wider uppercase text-xs">Casos de Éxito</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-serif text-charcoal">
            Empresas que ya <span className="italic text-firma-green">crecieron</span> con nosotros
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cases.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-concrete rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-firma-green/10 flex items-center justify-center mb-4">
                <Building2 size={18} className="text-firma-green" />
              </div>
              <p className="text-sm font-bold text-charcoal mb-3">{c.empresa_o_giro}</p>
              <div className="flex items-center gap-1.5 text-firma-green font-serif text-2xl mb-1">
                <TrendingUp size={18} />
                {c.monto_credito}
              </div>
              {c.tiempo_respuesta && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                  <Clock size={12} />
                  Respuesta en {c.tiempo_respuesta}
                </div>
              )}
              <p className="text-sm text-gray-500 leading-relaxed">{c.resultado}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
