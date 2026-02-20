import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Briefcase, DollarSign, PieChart, Info } from 'lucide-react';
import { generateStrategicAdvice } from '../services/geminiService';
import { AISimulationData, SimulationStatus } from '../types';

export const AISimulator: React.FC = () => {
  const [data, setData] = useState<AISimulationData>({ niche: '', location: '', amount: '' });
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [advice, setAdvice] = useState<string>('');

  const handleSimulate = async () => {
    if (!data.niche || !data.location || !data.amount) return;

    setStatus(SimulationStatus.LOADING);
    setAdvice('');

    try {
      const result = await generateStrategicAdvice(data);
      if (result.startsWith("Error")) {
        setAdvice(result);
        setStatus(SimulationStatus.ERROR);
      } else {
        setAdvice(result);
        setStatus(SimulationStatus.SUCCESS);
      }
    } catch (error) {
      setAdvice("Hubo un error al conectar con nuestra IA estratégica. Por favor, intenta de nuevo.");
      setStatus(SimulationStatus.ERROR);
    }
  };

  return (
    <section id="ai-simulator" className="py-24 bg-white relative overflow-hidden">
      {/* Premium Decorative elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-firma-green/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-firma-green/5 px-4 py-2 rounded-full mb-6 border border-firma-green/10"
          >
            <Sparkles size={14} className="text-firma-green" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-firma-green uppercase">Tecnología de Vanguardia</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-serif mb-6 text-charcoal">
            Diagnóstico Estratégico de <span className="italic text-firma-green">Capital</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            Obtén una visión clara de cómo optimizar tu financiamiento. Nuestra IA analiza tu perfil para diseñar la hoja de ruta más eficiente para tu crecimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-100 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-firma-green/20 group-hover:bg-firma-green transition-colors duration-500"></div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-2">
                <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest gap-2 ml-1">
                  <Briefcase size={14} className="text-firma-green" /> Giro de Negocio
                </label>
                <input
                  type="text"
                  value={data.niche}
                  onChange={(e) => setData({ ...data, niche: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 text-charcoal px-5 py-4 rounded-2xl focus:ring-2 focus:ring-firma-green/20 focus:border-firma-green outline-none placeholder-gray-400 transition-all font-light"
                  placeholder="Ej. Manufactura de precisión, Logística..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest gap-2 ml-1">
                  <MapPin size={14} className="text-firma-green" /> Ubicación Operativa
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 text-charcoal px-5 py-4 rounded-2xl focus:ring-2 focus:ring-firma-green/20 focus:border-firma-green outline-none placeholder-gray-400 transition-all font-light"
                  placeholder="Ej. Querétaro, CDMX, Monterrey..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest gap-2 ml-1">
                  <DollarSign size={14} className="text-firma-green" /> Capital Requerido (MXN)
                </label>
                <input
                  type="text"
                  value={data.amount}
                  onChange={(e) => setData({ ...data, amount: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 text-charcoal px-5 py-4 rounded-2xl focus:ring-2 focus:ring-firma-green/20 focus:border-firma-green outline-none placeholder-gray-400 transition-all font-light"
                  placeholder="Ej. 10,000,000"
                />
              </div>

              <button
                onClick={handleSimulate}
                disabled={status === SimulationStatus.LOADING || !data.niche || !data.location || !data.amount}
                className="w-full bg-charcoal text-white font-medium py-5 rounded-2xl hover:bg-firma-green hover:shadow-[0_10px_30px_rgba(0,109,78,0.3)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-3"
              >
                {status === SimulationStatus.LOADING ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Procesando Diagnóstico...</span>
                  </>
                ) : (
                  <>
                    <span>Generar Diagnóstico de Capital</span>
                    <Sparkles size={18} />
                  </>
                )}
              </button>

              <div className="pt-4 flex gap-4 items-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="bg-firma-green/10 p-2 rounded-lg">
                  <Info size={16} className="text-firma-green" />
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  <span className="font-bold text-gray-700">Nota:</span> Este diagnóstico es preliminar y basado en análisis predictivo de mercados.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Results Side */}
          <div className="min-h-[450px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {status === SimulationStatus.IDLE && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="text-center p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] w-full h-full flex flex-col items-center justify-center bg-gray-50/50"
                >
                  <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-firma-green/10 blur-2xl rounded-full scale-150 animate-pulse"></div>
                    <PieChart size={64} className="relative z-10 text-firma-green/30" />
                  </div>
                  <h3 className="text-xl font-serif text-charcoal mb-3">Listo para el análisis</h3>
                  <p className="text-gray-500 font-light max-w-sm">
                    Completa los detalles de tu empresa para que nuestra IA genere una propuesta de asignación estratégica.
                  </p>
                </motion.div>
              )}

              {status === SimulationStatus.LOADING && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full border border-gray-100 rounded-[2.5rem] bg-gray-50/30 flex flex-col items-center justify-center p-12 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
                    <motion.div
                      className="h-full bg-firma-green"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>

                  <div className="relative mb-10 text-firma-green">
                    <svg className="w-24 h-24" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" className="animate-[spin_10s_linear_infinity]" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" className="animate-[spin_5s_linear_infinity_reverse]" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={24} className="animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-4 text-center">
                    <p className="text-xl font-serif text-charcoal">Analizando Factores</p>
                    <div className="flex gap-2 justify-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-firma-green"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {status === SimulationStatus.SUCCESS && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white border border-gray-100 p-10 rounded-[2.5rem] w-full shadow-2xl shadow-gray-200/40 relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-firma-green/5 rounded-full blur-[50px] pointer-events-none"></div>

                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-50">
                    <div className="w-12 h-12 bg-charcoal text-white rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-charcoal">Estrategia Sugerida</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-firma-green">Optimizado por Firma 7 IA</p>
                    </div>
                  </div>

                  <div className="flex-grow overflow-auto pr-2 custom-scrollbar">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-700 leading-relaxed font-light text-justify whitespace-pre-line"
                    >
                      {advice}
                    </motion.div>
                  </div>

                  <div className="mt-8 pt-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 border-t border-gray-50">
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-firma-green animate-pulse"></div>
                      Análisis en Tiempo Real
                    </span>
                    <span>© {new Date().getFullYear()} Firma 7</span>
                  </div>
                </motion.div>
              )}

              {status === SimulationStatus.ERROR && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-red-100 p-12 rounded-[2.5rem] w-full text-center shadow-xl shadow-red-500/5"
                >
                  <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Info className="text-red-500" size={32} />
                  </div>
                  <h3 className="text-xl font-serif text-charcoal mb-4">Error de Conexión</h3>
                  <p className="text-gray-500 font-light mb-8 leading-relaxed px-4">{advice}</p>
                  <button
                    onClick={() => setStatus(SimulationStatus.IDLE)}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 text-sm font-medium"
                  >
                    Intentar de nuevo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};