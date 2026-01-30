import React, { useState } from 'react';
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
    try {
      const result = await generateStrategicAdvice(data);
      setAdvice(result);
      setStatus(SimulationStatus.SUCCESS);
    } catch (error) {
      setAdvice("Hubo un error al conectar con nuestra IA estratégica. Por favor, intenta de nuevo.");
      setStatus(SimulationStatus.ERROR);
    }
  };

  return (
    <section id="ai-simulator" className="py-24 bg-[#052b22] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-firma-green rounded-full blur-[150px] opacity-10 -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#001a14] rounded-full blur-[120px] opacity-60 translate-x-1/3 translate-y-1/3"></div>
      
      {/* Noise Texture Overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

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
                  onChange={(e) => setData({...data, niche: e.target.value})}
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
                  onChange={(e) => setData({...data, location: e.target.value})}
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
                  onChange={(e) => setData({...data, amount: e.target.value})}
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

          <div className="min-h-[300px] flex items-center justify-center">
            {status === SimulationStatus.IDLE && (
              <div className="text-center text-gray-500 p-8 border-2 border-dashed border-white/5 rounded-2xl w-full h-full flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-sm">
                <PieChart size={48} className="mb-4 opacity-20 text-white" />
                <p>Ingresa los detalles de tu proyecto para visualizar la asignación recomendada.</p>
              </div>
            )}
            
            {status === SimulationStatus.LOADING && (
               <div className="text-center">
                 <div className="w-16 h-16 border-4 border-firma-green/30 border-t-firma-green rounded-full animate-spin mx-auto mb-6"></div>
                 <p className="text-xl font-light animate-pulse text-emerald-100">Analizando vectores de rentabilidad...</p>
               </div>
            )}

            {status === SimulationStatus.SUCCESS && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 rounded-2xl w-full shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-firma-green/20 rounded-full blur-[50px] pointer-events-none"></div>
                <h3 className="font-serif text-2xl mb-4 text-emerald-100 border-b border-white/10 pb-2 relative z-10">Plan de Asignación Sugerido</h3>
                <p className="text-lg leading-relaxed text-gray-100 font-light pl-2 whitespace-pre-line relative z-10">
                  {advice}
                </p>
                <div className="mt-8 pt-4 flex justify-between items-center text-sm text-gray-400 relative z-10">
                  <span className="flex items-center gap-2 text-emerald-200/80"><Sparkles size={12}/> CFO Virtual</span>
                  <span>Firma 7 &copy;</span>
                </div>
              </div>
            )}
             {status === SimulationStatus.ERROR && (
              <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl w-full text-center">
                <p className="text-white">{advice}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};