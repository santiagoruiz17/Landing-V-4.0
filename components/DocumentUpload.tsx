import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Send, CheckCircle2, Loader2, Building2, Users, UserPlus, Landmark, PlusCircle, AlertTriangle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DocumentSlot, DocumentoTipo } from './DocumentSlot';
import { CiecInput } from './CiecInput';
import { BancoCard } from './BancoCard';
import { AccionistaCard } from './AccionistaCard';
import { trackCompleteRegistration } from '../lib/metaPixel';

const FOLLOWUP_DELAY_MS = 30 * 60 * 1000; // 30 minutos
const PORCENTAJE_MINIMO_ACCIONISTAS = 75;
const MESES_ESTADO_CUENTA = 6;
const TIPOS_DOC_REQUERIDOS_ACCIONISTA = ['ine_accionista', 'comprobante_domicilio_accionista', 'constancia_situacion_fiscal_accionista'];
const TIPOS_DOC_ACCIONISTA = [...TIPOS_DOC_REQUERIDOS_ACCIONISTA, 'acta_matrimonio_accionista'];
const DOCS_REQUERIDOS_POR_ACCIONISTA = TIPOS_DOC_REQUERIDOS_ACCIONISTA.length;

interface ItemDescriptor {
  key: string;
  tipoDocumento: DocumentoTipo;
  slotIndex?: number;
  label: string;
  optional?: boolean;
}

interface Accionista {
  slotIndex: number;
  nombre: string;
  porcentaje: string;
  esRepresentanteLegal: boolean;
  correo: string;
  telefono: string;
}

interface Banco {
  slotIndex: number;
  nombreBanco: string;
}

interface ProgresoDoc {
  tipoDocumento: string;
  slotIndex: number;
  fileName: string;
}

const ITEMS_PFAE: ItemDescriptor[] = [
  { key: 'constancia_situacion_fiscal', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal del mes en curso' },
  { key: 'ine', tipoDocumento: 'ine', label: 'INE' },
  { key: 'declaracion_anual', tipoDocumento: 'declaracion_anual', label: 'Declaración anual 2025 con acuse electrónico' },
  { key: 'comprobante_domicilio_fiscal', tipoDocumento: 'comprobante_domicilio_fiscal', label: 'Comprobante de domicilio fiscal (más reciente)' },
  { key: 'comprobante_domicilio_particular', tipoDocumento: 'comprobante_domicilio_particular', label: 'Comprobante de domicilio particular (más reciente)' },
];

const ITEMS_PM_EMPRESA: ItemDescriptor[] = [
  { key: 'acta_constitutiva', tipoDocumento: 'acta_constitutiva', label: 'Acta constitutiva con sello de registro público' },
  { key: 'escrituras_modificaciones', tipoDocumento: 'escrituras_modificaciones', label: 'Escrituras con modificaciones (si aplica)', optional: true },
  { key: 'constancia_situacion_fiscal', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal del mes en curso' },
  { key: 'declaracion_anual', tipoDocumento: 'declaracion_anual', label: 'Declaración anual 2025 con acuse electrónico' },
  { key: 'comprobante_domicilio_fiscal', tipoDocumento: 'comprobante_domicilio_fiscal', label: 'Comprobante de domicilio fiscal (más reciente)' },
  { key: 'comprobante_domicilio_operativo', tipoDocumento: 'comprobante_domicilio_operativo', label: 'Comprobante de domicilio operativo de la empresa (más reciente)' },
];

interface DocumentUploadProps {
  leadId: string;
  tipo: 'fisica' | 'moral';
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ leadId, tipo }) => {
  const esMoral = tipo === 'moral';
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [ciecSaved, setCiecSaved] = useState(false);
  const [accionistas, setAccionistas] = useState<Accionista[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [progresoDocs, setProgresoDocs] = useState<ProgresoDoc[]>([]);
  const [progresoCargado, setProgresoCargado] = useState(false);
  const nextAccionistaSlotRef = useRef(2);
  const nextBancoSlotRef = useRef(2);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reenvioLinkStatus, setReenvioLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const followupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedRef = useRef(false);

  // Restaura lo que el cliente ya haya subido/llenado antes (por si cerró el
  // navegador a medias) — el leadId es lo único que se necesita para recuperarlo.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_lead_progreso', { p_lead_id: leadId });

      const docs: ProgresoDoc[] = data?.documentos ?? [];
      setProgresoDocs(docs);

      setCompletedKeys(prev => {
        const next = new Set(prev);
        docs.forEach(d => {
          if (d.tipoDocumento === 'estado_cuenta' || TIPOS_DOC_ACCIONISTA.includes(d.tipoDocumento)) {
            next.add(`${d.tipoDocumento}-${d.slotIndex}`);
          } else {
            const item = itemsEmpresaRef.current.find(i => i.tipoDocumento === d.tipoDocumento && (i.slotIndex ?? 1) === d.slotIndex);
            if (item) next.add(item.key);
          }
        });
        return next;
      });

      if (esMoral) {
        const accs = (data?.accionistas ?? []) as {
          slotIndex: number; nombre: string | null; porcentaje: number | null;
          esRepresentanteLegal: boolean | null; correo: string | null; telefono: string | null;
        }[];
        setAccionistas(
          accs.length > 0
            ? accs.map(a => ({
                slotIndex: a.slotIndex, nombre: a.nombre ?? '', porcentaje: a.porcentaje != null ? String(a.porcentaje) : '',
                esRepresentanteLegal: !!a.esRepresentanteLegal, correo: a.correo ?? '', telefono: a.telefono ?? '',
              }))
            : [{ slotIndex: 1, nombre: '', porcentaje: '', esRepresentanteLegal: false, correo: '', telefono: '' }]
        );
        nextAccionistaSlotRef.current = accs.length > 0 ? Math.max(...accs.map(a => a.slotIndex)) + 1 : 2;
      }

      const bcs = (data?.bancos ?? []) as { slotIndex: number; nombreBanco: string | null }[];
      setBancos(
        bcs.length > 0
          ? bcs.map(b => ({ slotIndex: b.slotIndex, nombreBanco: b.nombreBanco ?? '' }))
          : [{ slotIndex: 1, nombreBanco: '' }]
      );
      nextBancoSlotRef.current = bcs.length > 0 ? Math.max(...bcs.map(b => b.slotIndex)) + 1 : 2;

      setCiecSaved(!!data?.ciecGuardada);
      setProgresoCargado(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    followupTimeoutRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      supabase.rpc('send_lead_documentos_email', { p_lead_id: leadId, p_kind: 'incompleto' }).then(() => {});
      supabase.rpc('send_client_status_email', { p_lead_id: leadId, p_kind: 'recordatorio' }).then(() => {});
    }, FOLLOWUP_DELAY_MS);
    return () => {
      if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);
    };
  }, [leadId]);

  const reenviarLink = async () => {
    setReenvioLinkStatus('sending');
    const { data, error } = await supabase.rpc('resend_lead_link_email', { p_lead_id: leadId });
    setReenvioLinkStatus(!error && data?.sent ? 'sent' : 'error');
  };

  const itemsEmpresa = esMoral ? ITEMS_PM_EMPRESA : ITEMS_PFAE;
  const itemsEmpresaRef = useRef(itemsEmpresa);
  itemsEmpresaRef.current = itemsEmpresa;

  const requiredEmpresa = itemsEmpresa.filter(i => !i.optional);

  // Solo el representante legal necesita subir documentación de identidad — el
  // resto de accionistas solo aporta nombre/correo/teléfono/%. Si hay un único
  // accionista, se asume que él es el representante legal.
  const representanteLegal = accionistas.length === 1 ? accionistas[0] : accionistas.find(a => a.esRepresentanteLegal);

  // La CIEC se pide siempre igual en el formulario (no se marca "opcional" para
  // no invitar a que se la salten), pero no cuenta para el % de avance interno —
  // el equipo puede continuar el trámite sin ella si no llega a tiempo.
  const totalRequired = requiredEmpresa.length + (representanteLegal ? DOCS_REQUERIDOS_POR_ACCIONISTA : 0) + bancos.length * MESES_ESTADO_CUENTA;
  const completedEmpresa = requiredEmpresa.filter(i => completedKeys.has(i.key)).length;
  const completedAccionistas = representanteLegal
    ? TIPOS_DOC_REQUERIDOS_ACCIONISTA.filter(tipo => completedKeys.has(`${tipo}-${representanteLegal.slotIndex}`)).length
    : 0;
  const completedBancos = bancos.reduce(
    (sum, b) => sum + Array.from({ length: MESES_ESTADO_CUENTA }, (_, i) => b.slotIndex * 10 + i + 1).filter(si => completedKeys.has(`estado_cuenta-${si}`)).length,
    0
  );
  const completedRequired = completedEmpresa + completedAccionistas + completedBancos;

  const markCompletedEmpresa = (tipoDocumento: DocumentoTipo, slotIndex: number) => {
    const item = itemsEmpresa.find(i => i.tipoDocumento === tipoDocumento && (i.slotIndex ?? 1) === slotIndex);
    if (item) setCompletedKeys(prev => new Set(prev).add(item.key));
  };

  const markCompletedCompuesto = (tipoDocumento: string, slotIndex: number) => {
    setCompletedKeys(prev => new Set(prev).add(`${tipoDocumento}-${slotIndex}`));
  };

  const agregarAccionista = () => {
    setAccionistas(prev => [...prev, { slotIndex: nextAccionistaSlotRef.current++, nombre: '', porcentaje: '', esRepresentanteLegal: false, correo: '', telefono: '' }]);
  };
  const quitarAccionista = (slotIndex: number) => {
    setAccionistas(prev => prev.filter(a => a.slotIndex !== slotIndex));
  };
  const marcarRepresentanteLegal = (slotIndex: number) => {
    setAccionistas(prev => prev.map(a => ({ ...a, esRepresentanteLegal: a.slotIndex === slotIndex })));
  };

  const agregarBanco = () => {
    setBancos(prev => [...prev, { slotIndex: nextBancoSlotRef.current++, nombreBanco: '' }]);
  };
  const quitarBanco = (slotIndex: number) => {
    setBancos(prev => prev.filter(b => b.slotIndex !== slotIndex));
  };

  const totalPorcentajeAccionistas = useMemo(
    () => accionistas.reduce((sum, a) => sum + (parseFloat(a.porcentaje) || 0), 0),
    [accionistas]
  );
  const porcentajeCumplido = totalPorcentajeAccionistas >= PORCENTAJE_MINIMO_ACCIONISTAS;

  const enviar = async () => {
    setSending(true);
    resolvedRef.current = true;
    if (followupTimeoutRef.current) clearTimeout(followupTimeoutRef.current);
    await supabase.rpc('send_lead_documentos_email', { p_lead_id: leadId, p_kind: 'completo' });
    supabase.rpc('send_client_status_email', { p_lead_id: leadId, p_kind: 'recibido' }).then(() => {});
    trackCompleteRegistration();
    setSending(false);
    setSent(true);
  };

  const progressPct = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

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

  // Se espera a tener el progreso restaurado antes de montar los campos: si no,
  // cada campo nace en blanco y ya no se actualiza aunque llegue su archivo
  // previo (el estado inicial de un input solo se lee una vez, al montarse).
  if (!progresoCargado) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <Loader2 size={28} className="text-firma-green animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando tu documentación…</p>
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
        <div className="pt-2 pb-1">
          {reenvioLinkStatus === 'sent' ? (
            <span className="text-xs text-firma-green font-medium inline-flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Te enviamos tu enlace por correo
            </span>
          ) : (
            <button
              type="button"
              onClick={reenviarLink}
              disabled={reenvioLinkStatus === 'sending'}
              className="text-xs text-gray-400 hover:text-firma-green font-medium inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
            >
              {reenvioLinkStatus === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
              Enviarme este enlace por correo (por si lo pierdo)
            </button>
          )}
          {reenvioLinkStatus === 'error' && (
            <p className="text-xs text-red-500 mt-1">No se pudo enviar. Intenta de nuevo en unos minutos.</p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Documentación de la empresa / persona ─────────────────── */}
        <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-firma-green/10 flex items-center justify-center flex-shrink-0">
              {esMoral ? <Building2 size={16} className="text-firma-green" /> : <FileText size={16} className="text-firma-green" />}
            </div>
            <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">
              {esMoral ? 'Documentación de la empresa' : 'Tu documentación'}
            </h3>
          </div>
          <div className="p-5 space-y-5">
            {itemsEmpresa.map((item, i) => (
              <DocumentSlot
                key={item.key}
                leadId={leadId}
                tipoDocumento={item.tipoDocumento}
                slotIndex={item.slotIndex}
                label={item.label}
                optional={item.optional}
                numero={i + 1}
                initialFileName={progresoDocs.find(d => d.tipoDocumento === item.tipoDocumento && (d.slotIndex ?? 1) === (item.slotIndex ?? 1))?.fileName}
                onUploaded={markCompletedEmpresa}
              />
            ))}
            <CiecInput leadId={leadId} initialSaved={ciecSaved} onSaved={() => setCiecSaved(true)} />
          </div>
        </div>

        {/* ── Estados de cuenta (uno o varios bancos) ─────────────────── */}
        <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-firma-green/10 flex items-center justify-center flex-shrink-0">
              <Landmark size={16} className="text-firma-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Estados de cuenta bancarios</h3>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses. Si tienes cuentas en más de un banco, agrégalos por separado.</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {bancos.map(b => (
              <BancoCard
                key={b.slotIndex}
                leadId={leadId}
                slotIndex={b.slotIndex}
                nombreBanco={b.nombreBanco}
                initialUploaded={progresoDocs
                  .filter(d => d.tipoDocumento === 'estado_cuenta' && d.slotIndex > b.slotIndex * 10 && d.slotIndex <= b.slotIndex * 10 + MESES_ESTADO_CUENTA)
                  .map(d => ({ mes: d.slotIndex - b.slotIndex * 10, fileName: d.fileName }))}
                onChangeNombreBanco={v => setBancos(prev => prev.map(x => x.slotIndex === b.slotIndex ? { ...x, nombreBanco: v } : x))}
                onRemove={() => quitarBanco(b.slotIndex)}
                onUploaded={markCompletedCompuesto}
              />
            ))}
            <button
              type="button"
              onClick={agregarBanco}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:border-firma-green/50 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
            >
              <PlusCircle size={16} />
              Agregar otro banco
            </button>
          </div>
        </div>

        {/* ── Accionistas ──────────────────────────────────────────── */}
        {esMoral && (
          <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 border-b-2 border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-firma-green/10 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-firma-green" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Accionistas (&gt;25% de acciones)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Agrega a cada accionista que tenga más del 25% de las acciones</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                  porcentajeCumplido ? 'bg-firma-green/5 text-firma-green' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {porcentajeCumplido ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <AlertTriangle size={16} className="flex-shrink-0" />}
                <span>
                  Acciones documentadas: <strong>{totalPorcentajeAccionistas}%</strong>
                  {!porcentajeCumplido && ` — necesitas al menos ${PORCENTAJE_MINIMO_ACCIONISTAS}%`}
                </span>
              </div>

              {accionistas.map(a => (
                <AccionistaCard
                  key={a.slotIndex}
                  leadId={leadId}
                  slotIndex={a.slotIndex}
                  nombre={a.nombre}
                  porcentaje={a.porcentaje}
                  correo={a.correo}
                  telefono={a.telefono}
                  esRepresentanteLegal={a.esRepresentanteLegal}
                  esUnicoAccionista={accionistas.length === 1}
                  initialDocs={Object.fromEntries(
                    progresoDocs.filter(d => TIPOS_DOC_ACCIONISTA.includes(d.tipoDocumento) && d.slotIndex === a.slotIndex).map(d => [d.tipoDocumento, d.fileName])
                  )}
                  onChangeNombre={v => setAccionistas(prev => prev.map(x => x.slotIndex === a.slotIndex ? { ...x, nombre: v } : x))}
                  onChangePorcentaje={v => setAccionistas(prev => prev.map(x => x.slotIndex === a.slotIndex ? { ...x, porcentaje: v } : x))}
                  onChangeCorreo={v => setAccionistas(prev => prev.map(x => x.slotIndex === a.slotIndex ? { ...x, correo: v } : x))}
                  onChangeTelefono={v => setAccionistas(prev => prev.map(x => x.slotIndex === a.slotIndex ? { ...x, telefono: v } : x))}
                  onMarcarRepresentanteLegal={() => marcarRepresentanteLegal(a.slotIndex)}
                  onRemove={() => quitarAccionista(a.slotIndex)}
                  onUploaded={markCompletedCompuesto}
                />
              ))}

              <button
                type="button"
                onClick={agregarAccionista}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:border-firma-green/50 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
              >
                <UserPlus size={16} />
                Agregar accionista
              </button>
            </div>
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
        {(completedRequired < totalRequired || (esMoral && !porcentajeCumplido)) && (
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
