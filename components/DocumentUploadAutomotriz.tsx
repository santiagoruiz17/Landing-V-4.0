import React, { useEffect, useMemo, useState } from 'react';
import { Car, Send, Loader2, Bookmark, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cargarProgresoLead, avisarEquipoDocumentacion, MENSAJE_ENVIO_FALLIDO } from '../lib/leadProgreso';
import { ProgresoErrorCard } from './ProgresoErrorCard';
import { DocumentSlot, DocumentoTipo } from './DocumentSlot';
import { EstadosCuentaSlot } from './EstadosCuentaSlot';
import { DocumentosEnviados } from './DocumentosEnviados';
import { DocumentosGuardados } from './DocumentosGuardados';
import { trackCompleteRegistration } from '../lib/metaPixel';

export type TipoAutomotriz = 'asalariado' | 'fisica' | 'moral';

const MESES_ESTADOS = 3;
// Los estados de cuenta usan slots base*10 + mes (11, 12, 13), igual que el formulario empresarial.
const SLOT_BASE_ESTADOS = 10;

const HINT_INE = 'Usa tu INE más vigente. Sube una foto del frente y otra del reverso, bien legibles y sin reflejos.';
const HINT_DOMICILIO = 'Recibo de luz, agua, teléfono o internet fijo.';
const HINT_DOMICILIO_60 = `${HINT_DOMICILIO} No debe tener más de 60 días.`;
const HINT_CSF = 'Descárgala gratis en sat.gob.mx. No debe tener más de 60 días.';

interface Item {
  key: string;
  tipoDocumento: DocumentoTipo;
  slotIndex?: number;
  label: string;
  hint?: string;
  optional?: boolean;
  optionalLabel?: string;
  camara?: boolean;
}

const ESTADOS = 'estados' as const;

// Listas de documentos del crédito automotriz (definidas por Firma 7), en el orden en que se piden.
const ITEMS: Record<TipoAutomotriz, (Item | typeof ESTADOS)[]> = {
  asalariado: [
    { key: 'ine-frente', tipoDocumento: 'ine', slotIndex: 1, label: 'INE — frente', hint: HINT_INE, camara: true },
    { key: 'ine-reverso', tipoDocumento: 'ine', slotIndex: 2, label: 'INE — reverso', camara: true },
    { key: 'domicilio', tipoDocumento: 'comprobante_domicilio_particular', label: 'Comprobante de domicilio (no mayor a 60 días)', hint: HINT_DOMICILIO_60 },
    ESTADOS,
  ],
  fisica: [
    { key: 'ine-frente', tipoDocumento: 'ine', slotIndex: 1, label: 'INE — frente', hint: HINT_INE, camara: true },
    { key: 'ine-reverso', tipoDocumento: 'ine', slotIndex: 2, label: 'INE — reverso', camara: true },
    { key: 'domicilio', tipoDocumento: 'comprobante_domicilio_particular', label: 'Comprobante de domicilio (no mayor a 60 días)', hint: HINT_DOMICILIO_60 },
    ESTADOS,
    { key: 'csf', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal actualizada (no mayor a 60 días)', hint: HINT_CSF },
  ],
  moral: [
    { key: 'ine-frente', tipoDocumento: 'ine_accionista', slotIndex: 1, label: 'INE del principal accionista — frente', hint: HINT_INE, camara: true },
    { key: 'ine-reverso', tipoDocumento: 'ine_accionista', slotIndex: 101, label: 'INE del principal accionista — reverso', camara: true },
    { key: 'csf-accionista', tipoDocumento: 'constancia_situacion_fiscal_accionista', slotIndex: 1, label: 'Constancia de situación fiscal del accionista (no mayor a 60 días)', hint: HINT_CSF },
    { key: 'domicilio-accionista', tipoDocumento: 'comprobante_domicilio_accionista', slotIndex: 1, label: 'Comprobante de domicilio del principal accionista (no mayor a 60 días)', hint: HINT_DOMICILIO_60 },
    { key: 'acta', tipoDocumento: 'acta_constitutiva', label: 'Acta constitutiva', hint: 'Completa, con el folio del Registro Público de Comercio.' },
    { key: 'asamblea', tipoDocumento: 'acta_asamblea', label: 'Actas de asamblea', hint: 'Si tu empresa no tiene actas de asamblea, puedes omitirla.', optional: true, optionalLabel: 'En caso de aplicar' },
    { key: 'domicilio-operativo', tipoDocumento: 'comprobante_domicilio_operativo', label: 'Comprobante de domicilio operativo (no mayor a 60 días)', hint: `${HINT_DOMICILIO_60} Es el domicilio donde opera tu negocio.` },
    ESTADOS,
    { key: 'csf-empresa', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal de la empresa, actualizada (no mayor a 60 días)', hint: HINT_CSF },
  ],
};

const TITULO: Record<TipoAutomotriz, string> = {
  asalariado: 'Persona física (asalariado)',
  fisica: 'Persona física con actividad empresarial',
  moral: 'Persona moral',
};

interface ProgresoDoc {
  tipoDocumento: string;
  slotIndex: number;
  fileName: string;
  purgado?: boolean;
}

interface Props {
  leadId: string;
  tipo: TipoAutomotriz;
  onEnviadoChange?: (enviado: boolean) => void;
}

export const DocumentUploadAutomotriz: React.FC<Props> = ({ leadId, tipo, onEnviadoChange }) => {
  const lista = ITEMS[tipo];
  const items = lista.filter((i): i is Item => i !== ESTADOS);
  const requeridos = items.filter(i => !i.optional);

  const pideNombre = tipo === 'moral';
  const [nombreAccionista, setNombreAccionista] = useState('');
  const [progresoDocs, setProgresoDocs] = useState<ProgresoDoc[]>([]);
  const [cargado, setCargado] = useState(false);
  const [progresoError, setProgresoError] = useState(false);
  const [reintentoProgreso, setReintentoProgreso] = useState(0);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [primerNombre, setPrimerNombre] = useState('');
  const [sending, setSending] = useState(false);
  const [envioError, setEnvioError] = useState(false);
  const [sent, setSent] = useState(false);
  const [reenvioLinkStatus, setReenvioLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [canal, setCanal] = useState<'whatsapp' | 'llamada'>('whatsapp');
  const [horario, setHorario] = useState<'cualquiera' | 'manana' | 'tarde'>('cualquiera');

  useEffect(() => { onEnviadoChange?.(sent); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sent]);

  // Aviso al equipo de que el cliente entró a subir documentos (una sola vez por lead).
  useEffect(() => {
    supabase.rpc('avisar_entrada_documentacion', { p_lead_id: leadId }).then(() => {});
  }, [leadId]);

  // Restaura lo que el cliente ya haya subido antes
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { ok, data } = await cargarProgresoLead(leadId);
      if (cancelado) return;
      if (!ok) { setProgresoError(true); return; }
      setProgresoError(false);
      const docs: ProgresoDoc[] = data?.documentos ?? [];
      setProgresoDocs(docs);
      const claves = new Set<string>();
      docs.forEach(d => {
        if (d.tipoDocumento === 'estado_cuenta') {
          claves.add(`estado_cuenta-${d.slotIndex}`);
        } else {
          const item = items.find(i => i.tipoDocumento === d.tipoDocumento && (i.slotIndex ?? 1) === d.slotIndex);
          if (item) claves.add(item.key);
        }
      });
      setCompletados(claves);
      setPrimerNombre(data?.primerNombre ?? '');
      const acc = ((data?.accionistas ?? []) as { slotIndex: number; nombre: string | null }[]).find(a => a.slotIndex === 1);
      setNombreAccionista(acc?.nombre ?? '');
      if (data?.contactoPreferido === 'whatsapp' || data?.contactoPreferido === 'llamada') setCanal(data.contactoPreferido);
      if (data?.contactoHorario === 'cualquiera' || data?.contactoHorario === 'manana' || data?.contactoHorario === 'tarde') setHorario(data.contactoHorario);
      setCargado(true);
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, tipo, reintentoProgreso]);

  const marcar = (tipoDocumento: string, slotIndex: number) => {
    if (tipoDocumento === 'estado_cuenta') {
      setCompletados(prev => new Set(prev).add(`estado_cuenta-${slotIndex}`));
      return;
    }
    const item = items.find(i => i.tipoDocumento === tipoDocumento && (i.slotIndex ?? 1) === slotIndex);
    if (item) setCompletados(prev => new Set(prev).add(item.key));
  };

  const estadosSubidos = Array.from({ length: MESES_ESTADOS }, (_, i) => SLOT_BASE_ESTADOS + i + 1)
    .filter(s => completados.has(`estado_cuenta-${s}`)).length;
  const nombreListo = nombreAccionista.trim().length > 0;
  const total = requeridos.length + MESES_ESTADOS + (pideNombre ? 1 : 0);
  const hechos = requeridos.filter(i => completados.has(i.key)).length + estadosSubidos + (pideNombre && nombreListo ? 1 : 0);
  const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;

  const faltantes: string[] = [
    ...(pideNombre && !nombreListo ? ['Nombre del principal accionista'] : []),
    ...requeridos.filter(i => !completados.has(i.key)).map(i => i.label),
    ...(estadosSubidos < MESES_ESTADOS ? [`Últimos ${MESES_ESTADOS} estados de cuenta`] : []),
  ];

  const progresoDe = (item: Item) =>
    progresoDocs.find(d => d.tipoDocumento === item.tipoDocumento && (d.slotIndex ?? 1) === (item.slotIndex ?? 1));

  const estadosIniciales = useMemo(
    () => progresoDocs
      .filter(d => d.tipoDocumento === 'estado_cuenta' && d.slotIndex > SLOT_BASE_ESTADOS && d.slotIndex <= SLOT_BASE_ESTADOS + MESES_ESTADOS)
      .map(d => ({ mes: d.slotIndex - SLOT_BASE_ESTADOS, fileName: d.fileName })),
    [progresoDocs]
  );

  const guardarContacto = (nuevoCanal: typeof canal, nuevoHorario: typeof horario) => {
    setCanal(nuevoCanal);
    setHorario(nuevoHorario);
    supabase.rpc('guardar_preferencia_contacto', { p_lead_id: leadId, p_canal: nuevoCanal, p_horario: nuevoHorario }).then(() => {});
  };

  // El principal accionista se guarda como accionista 1 (mayoritario y representante legal) para que el equipo vea su nombre.
  const guardarNombreAccionista = () => {
    supabase.rpc('upsert_lead_accionista', {
      p_lead_id: leadId,
      p_slot_index: 1,
      p_nombre: nombreAccionista.trim() || null,
      p_porcentaje: null,
      p_es_representante_legal: true,
      p_correo: null,
      p_telefono: null,
      p_es_mayoritario: true,
    }).then(() => {});
  };

  const reenviarLink = async () => {
    setReenvioLinkStatus('sending');
    const { data, error } = await supabase.rpc('resend_lead_link_email', { p_lead_id: leadId });
    setReenvioLinkStatus(!error && data?.sent ? 'sent' : 'error');
  };

  // Mismo botón para "Enviar a mi asesor" y "Guardar y cargar el resto después": el servidor decide si el
  // correo al equipo es de "documentación completa" o de "enviada, faltan documentos".
  const enviar = async () => {
    setSending(true);
    setEnvioError(false);
    // Solo se muestra "enviado" si el servidor confirmó el aviso al equipo.
    const { ok } = await avisarEquipoDocumentacion(leadId, canal, horario);
    setSending(false);
    if (!ok) { setEnvioError(true); return; }
    trackCompleteRegistration();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="max-w-3xl mx-auto">
        {faltantes.length > 0 ? (
          <DocumentosGuardados
            nombre={primerNombre}
            total={total}
            completados={hechos}
            faltantes={faltantes}
            onSeguirSubiendo={() => setSent(false)}
            reenvioStatus={reenvioLinkStatus}
            onReenviarEnlace={reenviarLink}
          />
        ) : (
          <DocumentosEnviados
            leadId={leadId}
            nombre={primerNombre}
            total={total}
            completados={hechos}
            faltantes={[]}
            onSeguirSubiendo={() => setSent(false)}
          />
        )}
      </div>
    );
  }

  if (!cargado && progresoError) {
    return <ProgresoErrorCard onReintentar={() => { setProgresoError(false); setReintentoProgreso(n => n + 1); }} />;
  }

  if (!cargado) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <Loader2 size={28} className="text-firma-green animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando tu documentación…</p>
      </div>
    );
  }

  let numero = 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-[#006d4e] to-emerald-600 px-6 py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-serif text-xl md:text-2xl">Sube tu documentación</h2>
            <p className="text-[#b8ddd3] text-xs md:text-sm mt-0.5">Crédito automotriz · {TITULO[tipo]}</p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-10">
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-firma-green uppercase tracking-widest">Tu lista de documentos</span>
            <span className="text-xs text-gray-400">{hechos} de {total} · {pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-firma-green/70 to-firma-green rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-3">Sube estos documentos en PDF; solo tu INE puede ser una foto.</p>
        </div>

        <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
          {pideNombre && (
            <div className="md:col-span-2 max-w-xl">
              <label className="field-label" htmlFor="nombre-accionista">Nombre completo del principal accionista</label>
              <input
                id="nombre-accionista"
                type="text"
                value={nombreAccionista}
                onChange={e => setNombreAccionista(e.target.value)}
                onBlur={guardarNombreAccionista}
                placeholder="Como aparece en su INE"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition"
              />
            </div>
          )}
          {lista.map(item => {
            numero += 1;
            if (item === ESTADOS) {
              return (
                <div key="estados" className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-gray-100 text-gray-400">
                      {numero}
                    </span>
                    <span className="text-xs text-gray-400">Últimos 3 estados de cuenta, de la cuenta donde recibes tus ingresos.</span>
                  </div>
                  <EstadosCuentaSlot
                    leadId={leadId}
                    meses={MESES_ESTADOS}
                    slotIndexBase={SLOT_BASE_ESTADOS}
                    initialUploaded={estadosIniciales}
                    onUploaded={marcar}
                  />
                </div>
              );
            }
            return (
              <DocumentSlot
                key={item.key}
                leadId={leadId}
                tipoDocumento={item.tipoDocumento}
                slotIndex={item.slotIndex}
                label={item.label}
                hint={item.hint}
                camara={item.camara}
                optional={item.optional}
                optionalLabel={item.optionalLabel}
                numero={numero}
                initialFileName={progresoDe(item)?.fileName}
                initialPurgado={progresoDe(item)?.purgado}
                onUploaded={marcar}
              />
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-4">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">¿Cómo prefieres que te contactemos?</p>
          <div className="grid grid-cols-2 gap-2 mb-3 max-w-md">
            {([['whatsapp', 'WhatsApp'], ['llamada', 'Llamada']] as const).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => guardarContacto(valor, horario)}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                  canal === valor ? 'border-firma-green bg-firma-green/10 text-firma-green' : 'border-gray-200 bg-white text-gray-500 hover:border-firma-green/40'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {([['cualquiera', 'Cualquier hora'], ['manana', 'En la mañana'], ['tarde', 'En la tarde']] as const).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => guardarContacto(canal, valor)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  horario === valor ? 'border-firma-green bg-firma-green/10 text-firma-green' : 'border-gray-200 bg-white text-gray-500 hover:border-firma-green/40'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={enviar}
            disabled={sending || hechos === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-600 hover:border-firma-green hover:text-firma-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} />}
            {sending ? 'Guardando…' : 'Guardar y cargar el resto después'}
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30 active:translate-y-0 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Enviando…' : 'Enviar a mi asesor'}
          </button>
        </div>
        {envioError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {MENSAJE_ENVIO_FALLIDO}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-3 sm:text-right">
          {hechos === 0
            ? 'Sube al menos un documento para poder guardar tu avance.'
            : faltantes.length > 0
              ? 'Si aún te faltan documentos, guarda tu avance: avisamos a tu asesor y puedes volver con tu mismo enlace para cargar lo que falta y pulsar «Enviar a mi asesor».'
              : '¡Listo! Ya tienes todo cargado: pulsa «Enviar a mi asesor».'}
        </p>
        {faltantes.length === 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-firma-green font-medium sm:float-right">
            <Check size={13} /> Tu lista está completa
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
