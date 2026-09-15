import React, { useState } from 'react';
import { User2, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DocumentSlot } from './DocumentSlot';

const DOCS_ACCIONISTA = [
  { tipoDocumento: 'ine_accionista' as const, label: 'INE' },
  { tipoDocumento: 'comprobante_domicilio_accionista' as const, label: 'Comprobante de domicilio (no mayor a 60 días)' },
  { tipoDocumento: 'constancia_situacion_fiscal_accionista' as const, label: 'Constancia de situación fiscal actualizada' },
  { tipoDocumento: 'acta_matrimonio_accionista' as const, label: 'Acta de matrimonio (en caso de aplicar)', optional: true },
];

function soloPorcentaje(value: string): string {
  // Dígitos y un solo punto decimal, sin pasar de 100.
  const limpio = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  const num = parseFloat(limpio);
  if (!isNaN(num) && num > 100) return '100';
  return limpio;
}

interface AccionistaCardProps {
  leadId: string;
  slotIndex: number;
  nombre: string;
  porcentaje: string;
  correo: string;
  telefono: string;
  // Es el representante legal (necesita documentación) o no (solo datos de contacto).
  // Si es el único accionista, se trata como representante legal aunque el flag no esté puesto.
  esRepresentanteLegal: boolean;
  esUnicoAccionista: boolean;
  initialDocs?: Record<string, string>;
  onChangeNombre: (v: string) => void;
  onChangePorcentaje: (v: string) => void;
  onChangeCorreo: (v: string) => void;
  onChangeTelefono: (v: string) => void;
  onMarcarRepresentanteLegal: () => void;
  onRemove: () => void;
  onUploaded: (tipoDocumento: string, slotIndex: number) => void;
}

export const AccionistaCard: React.FC<AccionistaCardProps> = ({
  leadId, slotIndex, nombre, porcentaje, correo, telefono, esRepresentanteLegal, esUnicoAccionista,
  initialDocs, onChangeNombre, onChangePorcentaje, onChangeCorreo, onChangeTelefono, onMarcarRepresentanteLegal, onRemove, onUploaded,
}) => {
  const [removiendo, setRemoviendo] = useState(false);
  const esRepLegalEfectivo = esUnicoAccionista || esRepresentanteLegal;

  const guardar = async (nombreActual: string, porcentajeActual: string, correoActual: string, telefonoActual: string, repLegal: boolean) => {
    const pct = parseFloat(porcentajeActual);
    await supabase.rpc('upsert_lead_accionista', {
      p_lead_id: leadId,
      p_slot_index: slotIndex,
      p_nombre: nombreActual || null,
      p_porcentaje: isNaN(pct) ? null : pct,
      p_es_representante_legal: repLegal,
      p_correo: correoActual || null,
      p_telefono: telefonoActual || null,
    });
  };

  const remover = async () => {
    setRemoviendo(true);
    await supabase.rpc('delete_lead_accionista', { p_lead_id: leadId, p_slot_index: slotIndex });
    onRemove();
  };

  const marcarRepresentanteLegal = () => {
    onMarcarRepresentanteLegal();
    guardar(nombre, porcentaje, correo, telefono, true);
  };

  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-firma-green/10 flex items-center justify-center flex-shrink-0">
          <User2 size={15} className="text-firma-green" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
          <input
            type="text"
            placeholder="Nombre del accionista"
            value={nombre}
            onChange={e => onChangeNombre(e.target.value)}
            onBlur={() => guardar(nombre, porcentaje, correo, telefono, esRepLegalEfectivo)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30"
          />
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Porcentaje"
              value={porcentaje}
              onChange={e => onChangePorcentaje(soloPorcentaje(e.target.value))}
              onBlur={() => guardar(nombre, porcentaje, correo, telefono, esRepLegalEfectivo)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30 pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
        </div>
        {!esUnicoAccionista && (
          <button
            type="button"
            onClick={remover}
            disabled={removiendo}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-colors disabled:opacity-50"
            aria-label="Quitar accionista"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {esUnicoAccionista ? (
        <p className="text-xs text-gray-400 pl-1">Se toma como representante legal — sube su documentación abajo.</p>
      ) : esRepresentanteLegal ? (
        <div className="pl-1 inline-flex items-center gap-1.5 text-xs font-semibold text-firma-green bg-firma-green/10 rounded-full px-3 py-1">
          <ShieldCheck size={13} /> Representante legal
        </div>
      ) : (
        <button
          type="button"
          onClick={marcarRepresentanteLegal}
          className="pl-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-firma-green transition-colors"
        >
          <ShieldCheck size={13} /> Marcar como representante legal
        </button>
      )}

      {esRepLegalEfectivo ? (
        <div className="space-y-3 pl-1">
          {DOCS_ACCIONISTA.map((doc, i) => (
            <DocumentSlot
              key={doc.tipoDocumento}
              leadId={leadId}
              tipoDocumento={doc.tipoDocumento}
              slotIndex={slotIndex}
              label={doc.label}
              optional={doc.optional}
              numero={i + 1}
              initialFileName={initialDocs?.[doc.tipoDocumento]}
              onUploaded={onUploaded}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
          <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={e => onChangeCorreo(e.target.value)}
            onBlur={() => guardar(nombre, porcentaje, correo, telefono, esRepLegalEfectivo)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30"
          />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Teléfono (10 dígitos)"
            maxLength={10}
            value={telefono}
            onChange={e => onChangeTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onBlur={() => guardar(nombre, porcentaje, correo, telefono, esRepLegalEfectivo)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30"
          />
        </div>
      )}
    </div>
  );
};
