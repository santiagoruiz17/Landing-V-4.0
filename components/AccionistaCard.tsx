import React, { useState } from 'react';
import { User2, X } from 'lucide-react';
import { DocumentSlot } from './DocumentSlot';

// El reverso de la INE se guarda en el slot del accionista + 100 (ver DocumentUpload / _document_label).
const SLOT_REVERSO_INE = 100;

const DOCS_ACCIONISTA = [
  { key: 'ine_accionista', tipoDocumento: 'ine_accionista' as const, label: 'INE — frente', hint: 'Usa su INE más vigente. Sube una foto del frente y otra del reverso, bien legibles y sin reflejos.', camara: true, slotOffset: 0 },
  { key: 'ine_accionista_reverso', tipoDocumento: 'ine_accionista' as const, label: 'INE — reverso', camara: true, slotOffset: SLOT_REVERSO_INE },
  { key: 'comprobante_domicilio_accionista', tipoDocumento: 'comprobante_domicilio_accionista' as const, label: 'Comprobante de domicilio particular (no mayor a 60 días)', hint: 'Recibo de luz, agua, teléfono o internet fijo.', slotOffset: 0 },
  { key: 'constancia_situacion_fiscal_accionista', tipoDocumento: 'constancia_situacion_fiscal_accionista' as const, label: 'Constancia de situación fiscal (no mayor a 60 días)', hint: 'Se descarga gratis en sat.gob.mx.', slotOffset: 0 },
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
  esMayoritario: boolean;
  esRepresentanteLegal: boolean;
  // Un único accionista se toma como mayoritario y representante legal (las casillas se muestran marcadas).
  esUnico: boolean;
  // Solo quien es mayoritario y/o representante legal sube documentos; el resto aporta datos de contacto.
  requiereDocs: boolean;
  initialDocs?: Record<string, string>;
  initialPurgados?: Record<string, boolean>;
  onChange: (patch: { nombre?: string; porcentaje?: string; correo?: string; telefono?: string }) => void;
  onGuardar: () => void;
  onToggleMayoritario: (valor: boolean) => void;
  onToggleRepresentante: (valor: boolean) => void;
  onRemove: () => void;
  onUploaded: (tipoDocumento: string, slotIndex: number) => void;
}

const inputClase = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-firma-green/30';

export const AccionistaCard: React.FC<AccionistaCardProps> = ({
  leadId, slotIndex, nombre, porcentaje, correo, telefono, esMayoritario, esRepresentanteLegal, esUnico, requiereDocs,
  initialDocs, initialPurgados, onChange, onGuardar, onToggleMayoritario, onToggleRepresentante, onRemove, onUploaded,
}) => {
  const [removiendo, setRemoviendo] = useState(false);

  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-firma-green/10 flex items-center justify-center flex-shrink-0">
          <User2 size={15} className="text-firma-green" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
          <input
            type="text"
            placeholder="Nombre completo del accionista"
            value={nombre}
            onChange={e => onChange({ nombre: e.target.value })}
            onBlur={onGuardar}
            className={inputClase}
          />
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Porcentaje"
              value={porcentaje}
              onChange={e => onChange({ porcentaje: soloPorcentaje(e.target.value) })}
              onBlur={onGuardar}
              className={`${inputClase} pr-7`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
        </div>
        {!esUnico && (
          <button
            type="button"
            onClick={() => { setRemoviendo(true); onRemove(); }}
            disabled={removiendo}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-colors disabled:opacity-50"
            aria-label="Quitar accionista"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {esUnico ? (
        <p className="text-xs text-gray-400 pl-1">
          Al ser el único accionista, se toma como accionista mayoritario y representante legal. Sube su documentación abajo.
        </p>
      ) : (
        <div className="pl-1 flex flex-wrap gap-x-5 gap-y-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={esMayoritario}
              onChange={e => onToggleMayoritario(e.target.checked)}
              className="w-4 h-4 accent-[#006d4e]"
            />
            Accionista mayoritario
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={esRepresentanteLegal}
              onChange={e => onToggleRepresentante(e.target.checked)}
              className="w-4 h-4 accent-[#006d4e]"
            />
            Representante legal
          </label>
        </div>
      )}

      {requiereDocs ? (
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 pl-1">
          <p className="md:col-span-2 text-xs font-semibold text-firma-green">
            {nombre.trim() ? `${nombre.trim()} sube su documentación:` : 'Esta persona sube su documentación:'}
          </p>
          {DOCS_ACCIONISTA.map((doc, i) => (
            <DocumentSlot
              key={doc.key}
              leadId={leadId}
              tipoDocumento={doc.tipoDocumento}
              slotIndex={slotIndex + doc.slotOffset}
              label={doc.label}
              hint={doc.hint}
              camara={doc.camara}
              numero={i + 1}
              initialFileName={initialDocs?.[doc.key]}
              initialPurgado={initialPurgados?.[doc.key]}
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
            onChange={e => onChange({ correo: e.target.value })}
            onBlur={onGuardar}
            className={inputClase}
          />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Teléfono (10 dígitos)"
            maxLength={10}
            value={telefono}
            onChange={e => onChange({ telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            onBlur={onGuardar}
            className={inputClase}
          />
        </div>
      )}
    </div>
  );
};
