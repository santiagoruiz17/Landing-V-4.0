import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "¿Qué costo tiene su servicio de consultoría?",
    answer: "Nuestra filosofía es ganar-ganar. En la mayoría de los productos financieros (crédito simple, arrendamiento, factoraje), nuestros honorarios son cubiertos por la institución financiera, por lo que para ti la gestión no tiene costo directo. En casos de estructuración compleja o consultoría especializada, se acuerda un honorario previo con total transparencia."
  },
  {
    question: "¿Qué tipo de empresas atienden?",
    answer: "Nos especializamos en Personas Morales y Personas Físicas con Actividad Empresarial que tengan al menos 1 año de operación formal comprobable y facturación activa. Atendemos diversos sectores: industrial, comercial, servicios, construcción y transporte."
  },
  {
    question: "¿Trabajan con empresas que tienen reportes negativos en Buró?",
    answer: "Entendemos que los negocios enfrentan baches. Si bien un buen historial facilita el proceso, contamos con alianzas estratégicas que pueden evaluar casos con incidencias menores o justificadas, siempre y cuando exista capacidad de pago demostrable y garantías reales."
  },
  {
    question: "¿Cuánto tiempo toma obtener los recursos?",
    answer: "Los tiempos varían según el producto y la complejidad. Un crédito simple o tarjeta empresarial puede aprobarse en 48-72 horas. Estructuras más complejas o montos superiores a 10 MDP pueden requerir de 2 a 4 semanas. Nuestro diagnóstico inicial te dará un tiempo estimado preciso."
  },
  {
    question: "¿Mis datos están seguros?",
    answer: "Absolutamente. En Firma 7 nos tomamos la confidencialidad muy en serio. Toda la información compartida está protegida bajo estrictos acuerdos de confidencialidad (NDA) y solo se comparte con las instituciones financieras previamente autorizadas por ti para el análisis de crédito."
  },
  {
    question: "¿Qué diferencia hay entre Firma 7 y pedir el crédito directo en mi banco?",
    answer: "Tu banco solo te ofrece sus propios productos, que pueden no ser los mejores para tu momento actual. Nosotros comparamos entre más de 20 instituciones para encontrarte la tasa más baja, el plazo más cómodo y las condiciones más favorables, ahorrándote meses de trámites burocráticos."
  }
];

export const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-firma-green/10 rounded-full mb-4">
            <HelpCircle className="w-6 h-6 text-firma-green" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-gray-500">
            Resolvemos las dudas más comunes antes de iniciar tu estrategia.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg overflow-hidden transition-all duration-300 ${activeIndex === index ? 'border-firma-green shadow-md shadow-firma-green/10 bg-white' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'}`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
              >
                <span className={`font-medium text-lg pr-4 transition-colors ${activeIndex === index ? 'text-firma-green' : 'text-charcoal'}`}>
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}>
                  {activeIndex === index ? (
                    <Minus className="w-5 h-5 text-firma-green" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </span>
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};