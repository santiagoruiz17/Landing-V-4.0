import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Testimonio {
  id: string;
  nombre: string;
  empresa: string | null;
  comentario: string;
}

export const Testimonios: React.FC = () => {
  const [items, setItems] = useState<Testimonio[]>([]);

  useEffect(() => {
    supabase
      .from('testimonios')
      .select('id, nombre, empresa, comentario')
      .eq('aprobado', true)
      .order('orden', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(9)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-20 bg-concrete border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-firma-green font-semibold tracking-wider uppercase text-xs">Testimonios</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-serif text-charcoal">
            Lo que dicen <span className="italic text-firma-green">nuestros clientes</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, index) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <Quote size={20} className="text-firma-green/40 mb-3" />
              <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.comentario}"</p>
              <p className="text-sm font-bold text-charcoal">{t.nombre}</p>
              {t.empresa && <p className="text-xs text-gray-400">{t.empresa}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
