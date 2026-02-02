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
    <section id="ai-simulator" className="py-24 bg-[#052b22] text-white relative overflow-hidden">
      {/* Refined Background decoration - Cleaner for fluidity */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-firma-green rounded-full blur-[150px] opacity-[0.08] -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#001a14] rounded-full blur-[120px] opacity-40 translate-x-1/3 translate-y-1/3"></div>

      {/* Lighter Noise Texture - Using CSS instead of SVG filter for better performance */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full mb-8 backdrop-blur-md border border-white/10 shadow-lg shadow-black/10">
            <Sparkles size={14} className="text-emerald-300" />
            <span className="text-xs font-medium tracking-[0.2em] text-emerald-50 uppercase">Firma 7 IA</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif mb-6 text-white">Asesor de Destino de Capital</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light">
            No es solo obtener el crédito, es saber usarlo. Nuestra IA diseña una hoja de ruta preliminar para la asignación eficiente de tus recursos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="space-y-6 relative z-10">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-2 gap-2">
                  <Briefcase size={16} className="text-firma-green" /> Giro / Nicho de Negocio
                </label>
                <input
                  type="text"
                  value={data.niche}
                  onChange={(e) => setData({ ...data, niche: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-lg focus:ring-1 focus:ring-firma-green focus:border-firma-green/50 outline-none placeholder-gray-500 transition-all"
                  placeholder="Ej. Logística de última milla, Manufactura automotriz..."
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-2 gap-2">
                  <MapPin size={16} className="text-firma-green" /> Ubicación Operativa
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-lg focus:ring-1 focus:ring-firma-green focus:border-firma-green/50 outline-none placeholder-gray-500 transition-all"
                  placeholder="Ej. Parque Industrial Querétaro, Puerto de Veracruz"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-2 gap-2">
                  <DollarSign size={16} className="text-firma-green" /> Capital Solicitado (MXN)
                </label>
                <input
                  type="text"
                  value={data.amount}
                  onChange={(e) => setData({ ...data, amount: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 text-white px-4 py-3 rounded-lg focus:ring-1 focus:ring-firma-green focus:border-firma-green/50 outline-none placeholder-gray-500 transition-all"
                  placeholder="Ej. 5,000,000"
                />
              </div>

              <button
                onClick={handleSimulate}
                disabled={status === SimulationStatus.LOADING || !data.niche || !data.location || !data.amount}
                className="w-full bg-white text-[#052b22] font-bold py-4 rounded-lg hover:bg-gray-100 hover:shadow-lg hover:shadow-firma-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {status === SimulationStatus.LOADING ? 'Analizando tu caso...' : 'Generar plan de crecimiento'}
              </button>

              <div className="mt-4 flex gap-3 items-start p-3 bg-firma-green/5 rounded-lg border border-firma-green/10">
                <Info size={18} className="text-firma-green flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="font-semibold text-emerald-200">Tip Pro:</span> Entre más detallado seas con tu giro (ej. "Restaurante de mariscos" en lugar de solo "Comida"), más precisa y útil será la recomendación de la IA.
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-[350px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {status === SimulationStatus.IDLE && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="text-center text-gray-500 p-8 border-2 border-dashed border-white/5 rounded-2xl w-full h-full flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-sm"
                >
                  <PieChart size={48} className="mb-4 opacity-20 text-white" />
                  <p className="max-w-xs mx-auto">Ingresa los detalles de tu proyecto para visualizar la asignación recomendada por nuestra IA.</p>
                </motion.div>
              )}

              {status === SimulationStatus.LOADING && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 border-4 border-firma-green/30 border-t-firma-green rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl font-light animate-pulse text-emerald-100">Analizando vectores de rentabilidad...</p>
                </motion.div>
              )}

              {status === SimulationStatus.SUCCESS && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 rounded-2xl w-full shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-firma-green/20 rounded-full blur-[50px] pointer-events-none"></div>
                  <h3 className="font-serif text-2xl mb-4 text-emerald-100 border-b border-white/10 pb-2 relative z-10">Estrategia de Capital Sugerida</h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg leading-relaxed text-gray-100 font-light pl-2 whitespace-pre-line relative z-10"
                  >
                    {advice}
                  </motion.p>
                  <div className="mt-8 pt-4 flex justify-between items-center text-sm text-gray-400 relative z-10">
                    <span className="flex items-center gap-2 text-emerald-200/80"><Sparkles size={12} /> Consultor IA Firma 7</span>
                    <span>Confidencial &copy;</span>
                  </div>
                </motion.div>
              )}

              {status === SimulationStatus.ERROR && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl w-full text-center"
                >
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="text-red-400" size={24} />
                  </div>
                  <p className="text-white font-medium mb-4">{advice}</p>
                  <button
                    onClick={() => setStatus(SimulationStatus.IDLE)}
                    className="text-sm text-red-300 hover:text-white underline underline-offset-4"
                  >
                    Reintentar análisis
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