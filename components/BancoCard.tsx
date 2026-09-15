import React, { useState } from 'react';
import { Landmark, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EstadosCuentaSlot } from './EstadosCuentaSlot';

const BANCOS_COMUNES = [
  'BBVA', 'Santander', 'Banorte', 'HSBC', 'Citibanamex', 'Scotiabank',
  'Inbursa', 'Banco Azteca', 'Banregio', 'Afirme', 'Otro',
];

interface BancoCardProps {
  leadId: string;
  slotIndex: number;
  nombreBanco: string;
  initialUploaded?: { mes: number; fileName: string }[];
  onChangeNombreBanco: (v: string) => void;
  onRemove: () => void;
  onUploaded: (tipoDocumento: 'estado_cuenta', slotIndexReal: number) => void;
}

export const BancoCard: React.FC<BancoCardProps> = ({
  leadId, slotIndex, nombreBanco, initialUploaded, onChangeNombreBanco, onRemove, onUploaded,
}) => {
  const esOtro = !!nombreBanco && !BANCOS_COMUNES.slice(0, -1).includes(nombreBanco);
  const [mostrarOtro, setMostrarOtro] = useState(esOtro);
  const [removiendo, setRemoviendo] = useState(false);

  const guardar = async (nombre: string) => {
    await supabase.rpc('upsert_lead_banco', { p_lead_id: leadId, p_slot_index: slotIndex, p_nombre_banco: nombre || null });
  };

  const remover = async () => {
    setRemoviendo(true);
    await supabase.rpc('delete_lead_banco', { p_lead_id: leadId, p_slot_index: slotIndex });
    onRemove();
  };

  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-firma-green/10 flex items-center justify-center flex-shrink-0">
          <Landmark size={15} className="text-firma-green" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={mostrarOtro ? 'Otro' : nombreBanco}
            onChange={e => {
              if (e.target.value === 'Otro') {
                setMostrarOtro(true);
                onChangeNombreBanco('');
              } else {
                setMostrarOtro(false);
                onChangeNombreBanco(e.target.value);
                guardar(e.target.value);
              }
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30"
          >
            <option value="">Selecciona el banco…</option>
            {BANCOS_COMUNES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {mostrarOtro && (
            <input
              type="text"
              placeholder="Nombre del banco"
              value={nombreBanco}
              onChange={e => onChangeNombreBanco(e.target.value)}
              onBlur={() => guardar(nombreBanco)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30"
            />
          )}
        </div>
        <button
          type="button"
          onClick={remover}
          disabled={removiendo}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-colors disabled:opacity-50"
          aria-label="Quitar banco"
        >
          <X size={16} />
        </button>
      </div>

      <div className="pl-1">
        <EstadosCuentaSlot
          leadId={leadId}
          meses={6}
          slotIndexBase={slotIndex * 10}
          initialUploaded={initialUploaded}
          onUploaded={onUploaded}
        />
      </div>
    </div>
  );
};
