import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DocumentSlot, DocumentoTipo } from './DocumentSlot';
import { CiecInput } from './CiecInput';
import { EstadosCuentaSlot } from './EstadosCuentaSlot';

const FOLLOWUP_DELAY_MS = 30 * 60 * 1000; // 30 minutos

interface ItemDescriptor {
  key: string;
  tipoDocumento: DocumentoTipo;
  slotIndex?: number;
  label: string;
  optional?: boolean;
}

const ESTADOS_CUENTA: ItemDescriptor[] = Array.from({ length: 6 }, (_, i) => ({
  key: `estado_cuenta-${i + 1}`,
  tipoDocumento: 'estado_cuenta' as DocumentoTipo,
  slotIndex: i + 1,
  label: `Estado de cuenta — Mes ${i + 1}`,
}));

const ITEMS_PFAE_ANTES: ItemDescriptor[] = [
  { key: 'constancia_situacion_fiscal', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal' },
  { key: 'ine', tipoDocumento: 'ine', label: 'INE' },
  { key: 'declaracion_anual', tipoDocumento: 'declaracion_anual', label: 'Declaración anual 2025 con acuse electrónico' },
];
const ITEMS_PFAE_DESPUES: ItemDescriptor[] = [
  { key: 'comprobante_domicilio_fiscal', tipoDocumento: 'comprobante_domicilio_fiscal', label: 'Comprobante de domicilio fiscal' },
  { key: 'comprobante_domicilio_particular', tipoDocumento: 'comprobante_domicilio_particular', label: 'Comprobante de domicilio particular' },
];
const ITEMS_PFAE: ItemDescriptor[] = [...ITEMS_PFAE_ANTES, ...ESTADOS_CUENTA, ...ITEMS_PFAE_DESPUES];

const ITEMS_PM_EMPRESA_ANTES: ItemDescriptor[] = [
  { key: 'acta_constitutiva', tipoDocumento: 'acta_constitutiva', label: 'Acta constitutiva con sello de registro público' },
  { key: 'escrituras_modificaciones', tipoDocumento: 'escrituras_modificaciones', label: 'Escrituras con modificaciones (si aplica)', optional: true },
  { key: 'constancia_situacion_fiscal', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal' },
  { key: 'declaracion_anual', tipoDocumento: 'declaracion_anual', label: 'Declaración anual 2025 con acuse electrónico' },
];
const ITEMS_PM_EMPRESA_DESPUES: ItemDescriptor[] = [
  { key: 'comprobante_domicilio_fiscal', tipoDocumento: 'comprobante_domicilio_fiscal', label: 'Comprobante de domicilio fiscal' },
];
const ITEMS_PM_EMPRESA: ItemDescriptor[] = [...ITEMS_PM_EMPRESA_ANTES, ...ESTADOS_CUENTA, ...ITEMS_PM_EMPRESA_DESPUES];

const ITEMS_PM_ACCIONISTA: ItemDescriptor[] = [
  { key: 'ine_accionista', tipoDocumento: 'ine_accionista', label: 'INE del principal accionista' },
  { key: 'comprobante_domicilio_accionista', tipoDocumento: 'comprobante_domicilio_accionista', label: 'Comprobante de domicilio (no mayor a 60 días)' },
  { key: 'constancia_situacion_fiscal_accionista', tipoDocumento: 'constancia_situacion_fiscal_accionista', label: 'Constancia de situación fiscal actualizada' },
];

interface DocumentUploadProps {
  leadId: string;
  tipo: 'fisica' | 'moral';
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ leadId, tipo }) => {
  const esMoral = tipo === 'moral';
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [ciecSaved, setCiecSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const followupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    followupTimeoutRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      supabase.rpc('send_lead_documentos_email', { p_lead_id: leadId, p_kind: 'incompleto' }).then(() => {});
    }, FOLLOWUP_DELAY_MS);
    return () => {
      if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);
    };
  }, [leadId]);

  const items = esMoral ? [...ITEMS_PM_EMPRESA, ...ITEMS_PM_ACCIONISTA] : ITEMS_PFAE;
  const requiredItems = items.filter(i => !i.optional);
  const totalRequired = requiredItems.length + 1; // +1 por la CIEC
  const completedRequired = requiredItems.filter(i => completedKeys.has(i.key)).length + (ciecSaved ? 1 : 0);

  const markCompleted = (tipoDocumento: DocumentoTipo, slotIndex: number) => {
    const item = items.find(i => i.tipoDocumento === tipoDocumento && (i.slotIndex ?? 1) === slotIndex);
    if (item) setCompletedKeys(prev => new Set(prev).add(item.key));
  };

  const enviar = async () => {
    setSending(true);
    resolvedRef.current = true;
    if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);
    await supabase.rpc('send_lead_documentos_email', { p_lead_id: leadId, p_kind: 'completo' });
    setSending(false);
    setSent(true);
  };

  const progressPct = useMemo(() => Math.round((completedRequired / totalRequired) * 100), [completedRequired, totalRequired]);

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-firma-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-firma-green" />
        </div>
        <h3 className="font-serif text-2xl text-charcoal font-bold mb-2">¡Documentación enviada!</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Nuestro equipo revisará tu información y se pondrá en contacto contigo en un lapso de 24 a 72 horas hábiles.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-[#006d4e] to-emerald-600 px-6 py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-serif text-xl md:text-2xl">Sube tu documentación</h2>
            <p className="text-[#b8ddd3] text-xs md:text-sm mt-0.5">
              {esMoral ? 'Persona Moral' : 'Persona Física con Actividad Empresarial'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-5 pb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-firma-green uppercase tracking-widest">
            {completedRequired} de {totalRequired} completados
          </span>
          <span className="text-xs text-gray-400">{progressPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-firma-green/70 to-firma-green rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="p-6 space-y-8">
        {esMoral ? (
          <>
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Documentación de la empresa</h3>
              {ITEMS_PM_EMPRESA_ANTES.map(item => (
                <DocumentSlot
                  key={item.key}
                  leadId={leadId}
                  tipoDocumento={item.tipoDocumento}
                  slotIndex={item.slotIndex}
                  label={item.label}
                  optional={item.optional}
                  onUploaded={markCompleted}
                />
              ))}
              <EstadosCuentaSlot leadId={leadId} meses={ESTADOS_CUENTA.length} onUploaded={markCompleted} />
              {ITEMS_PM_EMPRESA_DESPUES.map(item => (
                <DocumentSlot
                  key={item.key}
                  leadId={leadId}
                  tipoDocumento={item.tipoDocumento}
                  slotIndex={item.slotIndex}
                  label={item.label}
                  optional={item.optional}
                  onUploaded={markCompleted}
                />
              ))}
              <CiecInput leadId={leadId} onSaved={() => setCiecSaved(true)} />
            </div>
            <div className="space-y-5 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Documentos del principal accionista</h3>
              {ITEMS_PM_ACCIONISTA.map(item => (
                <DocumentSlot
                  key={item.key}
                  leadId={leadId}
                  tipoDocumento={item.tipoDocumento}
                  slotIndex={item.slotIndex}
                  label={item.label}
                  optional={item.optional}
                  onUploaded={markCompleted}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {ITEMS_PFAE_ANTES.map(item => (
              <DocumentSlot
                key={item.key}
                leadId={leadId}
                tipoDocumento={item.tipoDocumento}
                slotIndex={item.slotIndex}
                label={item.label}
                optional={item.optional}
                onUploaded={markCompleted}
              />
            ))}
            <EstadosCuentaSlot leadId={leadId} meses={ESTADOS_CUENTA.length} onUploaded={markCompleted} />
            {ITEMS_PFAE_DESPUES.map(item => (
              <DocumentSlot
                key={item.key}
                leadId={leadId}
                tipoDocumento={item.tipoDocumento}
                slotIndex={item.slotIndex}
                label={item.label}
                optional={item.optional}
                onUploaded={markCompleted}
              />
            ))}
            <CiecInput leadId={leadId} onSaved={() => setCiecSaved(true)} />
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={enviar}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white rounded-full text-sm font-semibold
            hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30
            active:translate-y-0 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Enviando…' : 'Enviar documentación'}
        </button>
        {completedRequired < totalRequired && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Puedes enviar aunque falten documentos — nuestro equipo te contactará para completar lo que falte.
          </p>
        )}
      </div>

      <style>{`
        .field-label {
          display: block; font-size: 0.7rem; font-weight: 600; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem;
        }
        .field-error { font-size: 0.7rem; color: #f87171; margin-top: 0.25rem; }
      `}</style>
    </div>
  );
};
