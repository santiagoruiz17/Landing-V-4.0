import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CiecInputProps {
  leadId: string;
  onSaved?: () => void;
}

export const CiecInput: React.FC<CiecInputProps> = ({ leadId, onSaved }) => {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const save = async () => {
    if (!value.trim()) return;
    setStatus('saving');
    const { error } = await supabase.rpc('save_ciec', { p_lead_id: leadId, p_ciec: value.trim() });
    if (error) {
      setStatus('error');
      return;
    }
    setStatus('saved');
    onSaved?.();
  };

  return (
    <div className="space-y-1.5">
      <label className="field-label">Clave CIEC del SAT</label>
      <p className="text-xs text-gray-400 -mt-1 mb-1 leading-relaxed">
        Es la contraseña de acceso al portal del SAT. Se guarda cifrada y solo nuestro equipo autorizado
        puede consultarla para gestionar tu trámite.
      </p>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => { setValue(e.target.value); setStatus('idle'); }}
          onBlur={save}
          placeholder="Tu clave CIEC"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-firma-green"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {status === 'saving' && (
        <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Guardando…</p>
      )}
      {status === 'saved' && (
        <p className="text-xs text-firma-green flex items-center gap-1"><CheckCircle2 size={12} /> Guardada de forma segura</p>
      )}
      {status === 'error' && (
        <p className="field-error">No se pudo guardar. Verifica tu conexión e intenta de nuevo.</p>
      )}
    </div>
  );
};
