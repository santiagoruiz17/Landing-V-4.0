import React, { useState } from 'react';
import { Download, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GUIA_URL = '/downloads/guia-mejora-buro-credito.pdf';

export const GuiaDescargable: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;
    setStatus('saving');
    const { error } = await supabase.from('lead_magnet_descargas').insert({
      nombre: nombre.trim(),
      correo: correo.trim(),
    });
    if (error) {
      setStatus('error');
      return;
    }
    setStatus('success');
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#006d4e]/10 flex items-center justify-center flex-shrink-0">
          <FileText size={20} className="text-[#006d4e]" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-charcoal font-bold">
            Guía gratis: cómo mejorar tu buró de crédito
          </h3>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">
            Pasos concretos para preparar tu perfil crediticio en 3–6 meses, antes de tu próxima solicitud.
          </p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="mt-5 flex items-start gap-3 bg-[#006d4e]/5 border border-[#006d4e]/15 rounded-xl p-4">
          <CheckCircle2 size={18} className="text-[#006d4e] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-charcoal">¡Listo! También te la enviamos por correo.</p>
            <a
              href={GUIA_URL}
              download
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-white bg-[#006d4e] hover:bg-emerald-700 transition-colors px-5 py-2.5 rounded-full"
            >
              <Download size={15} /> Descargar guía ahora
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <input
            required
            placeholder="Tu nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d4e]/40 focus:border-[#006d4e] transition"
          />
          <input
            required
            type="email"
            placeholder="Tu correo"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d4e]/40 focus:border-[#006d4e] transition"
          />
          <button
            type="submit"
            disabled={status === 'saving'}
            className="flex items-center justify-center gap-2 bg-[#006d4e] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'saving' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {status === 'saving' ? 'Enviando…' : 'Descargar gratis'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-500 mt-2">No se pudo procesar tu solicitud. Intenta de nuevo.</p>
      )}
    </div>
  );
};
