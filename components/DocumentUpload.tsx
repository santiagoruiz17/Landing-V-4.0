import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText, Send, CheckCircle2, Loader2, UserPlus, Landmark, PlusCircle, AlertTriangle, Mail,
  ArrowLeft, ArrowRight, Check, ShieldCheck, Bookmark,
} from 'lucide-react';
import { DocumentosEnviados } from './DocumentosEnviados';
import { DocumentosGuardados } from './DocumentosGuardados';
import { supabase } from '../lib/supabase';
import { DocumentSlot, DocumentoTipo } from './DocumentSlot';
import { CiecInput } from './CiecInput';
import { BancoCard } from './BancoCard';
import { AccionistaCard } from './AccionistaCard';
import { trackCompleteRegistration } from '../lib/metaPixel';

const PORCENTAJE_MINIMO_ACCIONISTAS = 75;
const MESES_ESTADO_CUENTA = 6;
const MAX_BANCOS = 3;
const TIPOS_DOC_REQUERIDOS_ACCIONISTA = ['ine_accionista', 'comprobante_domicilio_accionista', 'constancia_situacion_fiscal_accionista'];
const TIPOS_DOC_ACCIONISTA = [...TIPOS_DOC_REQUERIDOS_ACCIONISTA, 'acta_matrimonio_accionista'];
// INE (frente + reverso) + domicilio + constancia fiscal
const DOCS_REQUERIDOS_POR_ACCIONISTA = TIPOS_DOC_REQUERIDOS_ACCIONISTA.length + 1;

interface ItemDescriptor {
  key: string;
  tipoDocumento: DocumentoTipo;
  slotIndex?: number;
  label: string;
  hint?: string;
  optional?: boolean;
  optionalLabel?: string;
  camara?: boolean;
}

// Año fiscal de la declaración anual más reciente: a partir de abril ya se presentó
// la del año anterior; antes de abril, la última disponible es la de hace dos años.
const hoy = new Date();
const ANIO_DECLARACION = hoy.getFullYear() - (hoy.getMonth() >= 3 ? 1 : 2);

const HINT_INE = 'Usa tu INE más vigente. Sube una foto del frente y otra del reverso, bien legibles y sin reflejos.';
const HINT_CONSTANCIA = 'Descárgala gratis en sat.gob.mx. No debe tener más de 60 días.';
const HINT_DOMICILIO = 'Recibo de luz, agua, teléfono o internet fijo, con antigüedad máxima de 60 días.';

// La INE ocupa dos "slots": la propia usa 1 = frente, 2 = reverso; la de un accionista
// usa su slot (frente) y su slot + 100 (reverso). Debe coincidir con AccionistaCard.
const SLOT_REVERSO_INE_ACCIONISTA = 100;

const IT: Record<string, ItemDescriptor> = {
  ineFrente: { key: 'ine-frente', tipoDocumento: 'ine', slotIndex: 1, label: 'INE — frente', hint: HINT_INE, camara: true },
  ineReverso: { key: 'ine-reverso', tipoDocumento: 'ine', slotIndex: 2, label: 'INE — reverso', camara: true },
  domicilioParticular: { key: 'comprobante_domicilio_particular', tipoDocumento: 'comprobante_domicilio_particular', label: 'Comprobante de domicilio particular (no mayor a 60 días)', hint: `${HINT_DOMICILIO} Es el de tu casa.` },
  domicilioOperativo: { key: 'comprobante_domicilio_operativo', tipoDocumento: 'comprobante_domicilio_operativo', label: 'Comprobante de domicilio operativo (no mayor a 60 días)', hint: `${HINT_DOMICILIO} Es el domicilio donde opera tu negocio. Si es el mismo que tu domicilio fiscal, con este documento basta.` },
  domicilioFiscal: { key: 'comprobante_domicilio_fiscal', tipoDocumento: 'comprobante_domicilio_fiscal', label: 'Comprobante de domicilio fiscal (no mayor a 60 días)', hint: HINT_DOMICILIO },
  constancia: { key: 'constancia_situacion_fiscal', tipoDocumento: 'constancia_situacion_fiscal', label: 'Constancia de situación fiscal (no mayor a 60 días)', hint: HINT_CONSTANCIA },
  actaConstitutiva: { key: 'acta_constitutiva', tipoDocumento: 'acta_constitutiva', label: 'Acta constitutiva con folio de registro público', hint: 'Completa, con el folio del Registro Público de Comercio.' },
  actaAsamblea: { key: 'acta_asamblea', tipoDocumento: 'acta_asamblea', label: 'Última acta de asamblea con folio de registro público', hint: 'Si tu empresa no tiene actas de asamblea, puedes omitirla.', optional: true, optionalLabel: 'Si aplica' },
  declaracion: { key: 'declaracion_anual', tipoDocumento: 'declaracion_anual', label: `Declaración anual ${ANIO_DECLARACION}`, hint: 'Sube la declaración completa, sin el acuse.' },
  acuse: { key: 'acuse_declaracion_anual', tipoDocumento: 'acuse_declaracion_anual', label: `Acuse electrónico de la declaración anual ${ANIO_DECLARACION}`, hint: 'Es el comprobante con el sello digital del SAT. Va por separado de la declaración.' },
};
const TODOS_ITEMS = Object.values(IT);

type PasoId = 'empresa' | 'persona' | 'finanzas' | 'ciec' | 'accionistas' | 'enviar';

const PASO_META: Record<PasoId, { titulo: string; corto: string; descripcion: string }> = {
  empresa: { titulo: 'Documentos de la empresa', corto: 'Empresa', descripcion: 'Sube estos documentos de tu empresa. Aceptamos PDF o foto.' },
  persona: { titulo: 'Tus documentos', corto: 'Tus datos', descripcion: 'Sube estos documentos. Aceptamos PDF o foto.' },
  finanzas: { titulo: 'Información financiera', corto: 'Finanzas', descripcion: 'Tus estados de cuenta y tu declaración anual.' },
  ciec: { titulo: 'Clave CIEC', corto: 'CIEC', descripcion: 'Con ella evaluamos tu perfil más rápido.' },
  accionistas: { titulo: 'Accionistas', corto: 'Accionistas', descripcion: 'Registra a quienes tengan 25% o más de las acciones, hasta sumar al menos 75%.' },
  enviar: { titulo: 'Revisar y enviar', corto: 'Enviar', descripcion: 'Revisa tu avance y envíalo a tu asesor.' },
};

interface Accionista {
  slotIndex: number;
  nombre: string;
  porcentaje: string;
  esMayoritario: boolean;
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
  purgado?: boolean;
}

const accionistaVacio = (slotIndex: number): Accionista => ({
  slotIndex, nombre: '', porcentaje: '', esMayoritario: false, esRepresentanteLegal: false, correo: '', telefono: '',
});

interface DocumentUploadProps {
  leadId: string;
  tipo: 'fisica' | 'moral';
  // Avisa a la página cuando el cliente ya envió (pantalla de confirmación) o vuelve a editar.
  onEnviadoChange?: (enviado: boolean) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ leadId, tipo, onEnviadoChange }) => {
  const esMoral = tipo === 'moral';
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [ciecSaved, setCiecSaved] = useState(false);
  const [accionistas, setAccionistas] = useState<Accionista[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [domicilioDistinto, setDomicilioDistinto] = useState(false);
  const [progresoDocs, setProgresoDocs] = useState<ProgresoDoc[]>([]);
  const [progresoCargado, setProgresoCargado] = useState(false);
  // Pasó el plazo de retención: ya eliminamos los archivos, pero conservamos el registro de lo que subió.
  const [expirado, setExpirado] = useState(false);
  const nextAccionistaSlotRef = useRef(2);
  const nextBancoSlotRef = useRef(2);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reenvioLinkStatus, setReenvioLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [primerNombre, setPrimerNombre] = useState('');
  const [contactoCanal, setContactoCanal] = useState<'whatsapp' | 'llamada'>('whatsapp');
  const [contactoHorario, setContactoHorario] = useState<'cualquiera' | 'manana' | 'tarde'>('cualquiera');
  const [paso, setPaso] = useState(0);
  const pasoIniciadoRef = useRef(false);
  const tarjetaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onEnviadoChange?.(sent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent]);

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
            const item = TODOS_ITEMS.find(i => i.tipoDocumento === d.tipoDocumento && (i.slotIndex ?? 1) === d.slotIndex);
            if (item) next.add(item.key);
          }
        });
        return next;
      });

      if (esMoral) {
        const accs = (data?.accionistas ?? []) as {
          slotIndex: number; nombre: string | null; porcentaje: number | null;
          esRepresentanteLegal: boolean | null; esMayoritario: boolean | null; correo: string | null; telefono: string | null;
        }[];
        setAccionistas(
          accs.length > 0
            ? accs.map(a => ({
                slotIndex: a.slotIndex, nombre: a.nombre ?? '', porcentaje: a.porcentaje != null ? String(a.porcentaje) : '',
                esRepresentanteLegal: !!a.esRepresentanteLegal, esMayoritario: !!a.esMayoritario, correo: a.correo ?? '', telefono: a.telefono ?? '',
              }))
            : [accionistaVacio(1)]
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

      setDomicilioDistinto(!!data?.domicilioFiscalDistinto);
      setCiecSaved(!!data?.ciecGuardada);
      setExpirado(!!data?.expirado);
      setPrimerNombre(data?.primerNombre ?? '');
      if (data?.contactoPreferido === 'whatsapp' || data?.contactoPreferido === 'llamada') setContactoCanal(data.contactoPreferido);
      if (data?.contactoHorario === 'cualquiera' || data?.contactoHorario === 'manana' || data?.contactoHorario === 'tarde') setContactoHorario(data.contactoHorario);
      setProgresoCargado(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const reenviarLink = async () => {
    setReenvioLinkStatus('sending');
    const { data, error } = await supabase.rpc('resend_lead_link_email', { p_lead_id: leadId });
    setReenvioLinkStatus(!error && data?.sent ? 'sent' : 'error');
  };

  const guardarPreferenciaContacto = (canal: 'whatsapp' | 'llamada', horario: 'cualquiera' | 'manana' | 'tarde') => {
    setContactoCanal(canal);
    setContactoHorario(horario);
    supabase.rpc('guardar_preferencia_contacto', { p_lead_id: leadId, p_canal: canal, p_horario: horario }).then(() => {});
  };

  // ── Qué se pide según el tipo de persona y las casillas marcadas ──────────────
  const pasos: PasoId[] = esMoral
    ? ['empresa', 'finanzas', 'ciec', 'accionistas', 'enviar']
    : ['persona', 'finanzas', 'ciec', 'enviar'];
  const pasoDocsId: PasoId = esMoral ? 'empresa' : 'persona';

  const itemsPrimerPaso: ItemDescriptor[] = esMoral
    ? [IT.actaConstitutiva, IT.actaAsamblea, IT.domicilioOperativo, IT.constancia]
    : [IT.ineFrente, IT.ineReverso, IT.domicilioParticular, IT.domicilioOperativo, IT.constancia];
  const itemsFinanzas: ItemDescriptor[] = [IT.declaracion, IT.acuse];
  const itemsSimples: ItemDescriptor[] = [
    ...itemsPrimerPaso,
    ...(domicilioDistinto ? [IT.domicilioFiscal] : []),
    ...itemsFinanzas,
  ];
  const requiredSimples = itemsSimples.filter(i => !i.optional);

  // Suben identificación el accionista mayoritario y/o el representante legal (pueden ser la misma
  // persona o dos distintas). Si hay un único accionista, se asume que es ambos.
  const personasConDocs = accionistas.length === 1
    ? accionistas
    : accionistas.filter(a => a.esMayoritario || a.esRepresentanteLegal);
  const requiereDocs = (a: Accionista) => personasConDocs.some(p => p.slotIndex === a.slotIndex);

  // La CIEC se pide siempre igual en el formulario (no se marca "opcional" para
  // no invitar a que se la salten), pero no cuenta para el % de avance interno —
  // el equipo puede continuar el trámite sin ella si no llega a tiempo.
  const completedDocsPersona = (a: Accionista) =>
    TIPOS_DOC_REQUERIDOS_ACCIONISTA.filter(t => completedKeys.has(`${t}-${a.slotIndex}`)).length
    + (completedKeys.has(`ine_accionista-${a.slotIndex + SLOT_REVERSO_INE_ACCIONISTA}`) ? 1 : 0);

  const totalRequired = requiredSimples.length
    + (esMoral ? personasConDocs.length * DOCS_REQUERIDOS_POR_ACCIONISTA : 0)
    + bancos.length * MESES_ESTADO_CUENTA;
  const completedSimples = requiredSimples.filter(i => completedKeys.has(i.key)).length;
  const completedAccionistas = esMoral ? personasConDocs.reduce((s, a) => s + completedDocsPersona(a), 0) : 0;
  const completedBancos = bancos.reduce(
    (sum, b) => sum + Array.from({ length: MESES_ESTADO_CUENTA }, (_, i) => b.slotIndex * 10 + i + 1).filter(si => completedKeys.has(`estado_cuenta-${si}`)).length,
    0
  );
  const completedRequired = completedSimples + completedAccionistas + completedBancos;

  const totalPorcentajeAccionistas = useMemo(
    () => accionistas.reduce((sum, a) => sum + (parseFloat(a.porcentaje) || 0), 0),
    [accionistas]
  );
  const porcentajeCumplido = totalPorcentajeAccionistas >= PORCENTAJE_MINIMO_ACCIONISTAS;
  const faltaMarcarRoles = esMoral && accionistas.length > 1
    && (!accionistas.some(a => a.esMayoritario) || !accionistas.some(a => a.esRepresentanteLegal));

  // Lo que todavía le falta al cliente, por paso (se usa en el resumen final y en el aviso de expiración).
  const pendientes: Record<PasoId, string[]> = {
    empresa: [], persona: [], finanzas: [], ciec: [], accionistas: [], enviar: [],
  };
  itemsPrimerPaso.concat(domicilioDistinto ? [IT.domicilioFiscal] : [])
    .filter(i => !i.optional && !completedKeys.has(i.key))
    .forEach(i => pendientes[pasoDocsId].push(i.label));
  itemsFinanzas.filter(i => !completedKeys.has(i.key)).forEach(i => pendientes.finanzas.push(i.label));
  if (completedBancos < bancos.length * MESES_ESTADO_CUENTA) pendientes.finanzas.push('Estados de cuenta bancarios');
  if (!ciecSaved) pendientes.ciec.push('Clave CIEC del SAT');
  if (esMoral) {
    if (!porcentajeCumplido) pendientes.accionistas.push(`Acciones documentadas (mínimo ${PORCENTAJE_MINIMO_ACCIONISTAS}%)`);
    if (faltaMarcarRoles) pendientes.accionistas.push('Indicar quién es el accionista mayoritario y quién es el representante legal');
    accionistas.forEach(a => {
      const quien = a.nombre.trim() || `accionista ${a.slotIndex}`;
      if (requiereDocs(a)) {
        if (completedDocsPersona(a) < DOCS_REQUERIDOS_POR_ACCIONISTA) pendientes.accionistas.push(`Documentación de ${quien}`);
      } else if (!a.nombre.trim() || !a.correo.trim() || a.telefono.length < 10) {
        pendientes.accionistas.push(`Nombre, correo y teléfono de ${quien}`);
      }
    });
  }
  const faltantes = ([] as string[]).concat(...pasos.map(p => pendientes[p]));

  const progressPct = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  // Al abrir, el cliente cae en el primer paso que todavía tiene pendientes (o en el resumen final).
  useEffect(() => {
    if (!progresoCargado || pasoIniciadoRef.current) return;
    pasoIniciadoRef.current = true;
    const primero = pasos.findIndex(p => p !== 'enviar' && pendientes[p].length > 0);
    setPaso(primero === -1 ? pasos.length - 1 : primero);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progresoCargado]);

  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) { primerRender.current = false; return; }
    tarjetaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [paso]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const marcarCompletado = (tipoDocumento: string, slotIndex: number) => {
    if (tipoDocumento === 'estado_cuenta' || TIPOS_DOC_ACCIONISTA.includes(tipoDocumento)) {
      setCompletedKeys(prev => new Set(prev).add(`${tipoDocumento}-${slotIndex}`));
      return;
    }
    const item = TODOS_ITEMS.find(i => i.tipoDocumento === tipoDocumento && (i.slotIndex ?? 1) === slotIndex);
    if (item) setCompletedKeys(prev => new Set(prev).add(item.key));
  };

  const cambiarDomicilioDistinto = (valor: boolean) => {
    setDomicilioDistinto(valor);
    supabase.rpc('guardar_domicilio_fiscal_distinto', { p_lead_id: leadId, p_distinto: valor }).then(() => {});
  };

  const accionistasRef = useRef(accionistas);
  accionistasRef.current = accionistas;

  const guardarAccionista = (slotIndex: number, cambios?: Partial<Accionista>) => {
    const actual = accionistasRef.current.find(a => a.slotIndex === slotIndex);
    if (!actual) return;
    const a = { ...actual, ...cambios };
    const pct = parseFloat(a.porcentaje);
    supabase.rpc('upsert_lead_accionista', {
      p_lead_id: leadId,
      p_slot_index: slotIndex,
      p_nombre: a.nombre || null,
      p_porcentaje: isNaN(pct) ? null : pct,
      p_es_representante_legal: a.esRepresentanteLegal,
      p_es_mayoritario: a.esMayoritario,
      p_correo: a.correo || null,
      p_telefono: a.telefono || null,
    }).then(() => {});
  };

  const cambiarAccionista = (slotIndex: number, patch: Partial<Accionista>) => {
    setAccionistas(prev => prev.map(a => a.slotIndex === slotIndex ? { ...a, ...patch } : a));
  };

  // Cada casilla es única en el trámite: marcarla en una persona la quita de las demás.
  const alternarMayoritario = (slotIndex: number, valor: boolean) => {
    setAccionistas(prev => prev.map(a => ({ ...a, esMayoritario: a.slotIndex === slotIndex ? valor : (valor ? false : a.esMayoritario) })));
    guardarAccionista(slotIndex, { esMayoritario: valor });
  };
  const alternarRepresentante = (slotIndex: number, valor: boolean) => {
    setAccionistas(prev => prev.map(a => ({ ...a, esRepresentanteLegal: a.slotIndex === slotIndex ? valor : (valor ? false : a.esRepresentanteLegal) })));
    guardarAccionista(slotIndex, { esRepresentanteLegal: valor });
  };

  const agregarAccionista = () => {
    // El primer accionista era "único" (mayoritario y representante legal por defecto): al agregar
    // otro, esas casillas se le marcan de verdad para que siga subiendo su documentación.
    if (accionistas.length === 1 && !accionistas[0].esMayoritario && !accionistas[0].esRepresentanteLegal) {
      const primero = accionistas[0];
      cambiarAccionista(primero.slotIndex, { esMayoritario: true, esRepresentanteLegal: true });
      guardarAccionista(primero.slotIndex, { esMayoritario: true, esRepresentanteLegal: true });
    }
    const slotIndex = nextAccionistaSlotRef.current++;
    setAccionistas(prev => [...prev, accionistaVacio(slotIndex)]);
  };
  const quitarAccionista = async (slotIndex: number) => {
    await supabase.rpc('delete_lead_accionista', { p_lead_id: leadId, p_slot_index: slotIndex });
    setAccionistas(prev => prev.filter(a => a.slotIndex !== slotIndex));
  };

  const agregarBanco = () => {
    if (bancos.length >= MAX_BANCOS) return;
    const slotIndex = nextBancoSlotRef.current++;
    setBancos(prev => [...prev, { slotIndex, nombreBanco: '' }]);
  };
  const quitarBanco = (slotIndex: number) => {
    setBancos(prev => prev.filter(b => b.slotIndex !== slotIndex));
  };

  const enviar = async () => {
    setSending(true);
    // La preferencia se guarda antes de avisar al equipo para que vaya en el correo.
    await supabase.rpc('guardar_preferencia_contacto', { p_lead_id: leadId, p_canal: contactoCanal, p_horario: contactoHorario });
    await supabase.rpc('send_lead_documentos_email', { p_lead_id: leadId, p_kind: 'completo' });
    trackCompleteRegistration();
    setSending(false);
    setSent(true);
  };

  if (sent) {
    if (faltantes.length > 0) {
      return (
        <div className="max-w-3xl mx-auto">
          <DocumentosGuardados
            nombre={primerNombre}
            total={totalRequired}
            completados={completedRequired}
            faltantes={faltantes}
            onSeguirSubiendo={() => { setSent(false); setPaso(Math.max(0, pasos.findIndex(p => p !== 'enviar' && pendientes[p].length > 0))); }}
            reenvioStatus={reenvioLinkStatus}
            onReenviarEnlace={reenviarLink}
          />
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto">
        <DocumentosEnviados
          leadId={leadId}
          nombre={primerNombre}
          total={totalRequired}
          completados={completedRequired}
          faltantes={faltantes}
          onSeguirSubiendo={() => { setSent(false); setPaso(0); }}
        />
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

  const progresoDe = (item: ItemDescriptor) =>
    progresoDocs.find(d => d.tipoDocumento === item.tipoDocumento && (d.slotIndex ?? 1) === (item.slotIndex ?? 1));

  const renderSlot = (item: ItemDescriptor, numero: number) => (
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
      onUploaded={marcarCompletado}
    />
  );

  const pasoCompleto = (id: PasoId) => id !== 'enviar' && pendientes[id].length === 0;

  const avisoPendientes = (id: PasoId) => {
    const n = pendientes[id].length;
    if (n === 0) return null;
    return (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        {n === 1 ? 'Te falta 1 cosa en este paso' : `Te faltan ${n} cosas en este paso`}. Si no lo tienes a la mano, puedes continuar y completarlo después.
      </p>
    );
  };

  const idPaso = pasos[paso];
  const esUltimo = paso === pasos.length - 1;

  const barraProgreso = (
    <div className="w-full h-1.5 bg-gray-200/70 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-firma-green/70 to-firma-green rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progressPct}%` }}
      />
    </div>
  );

  const enlaceReenvio = (
    <>
      {reenvioLinkStatus === 'sent' ? (
        <span className="text-xs text-firma-green font-medium inline-flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Te enviamos tu enlace por correo
        </span>
      ) : (
        <button
          type="button"
          onClick={reenviarLink}
          disabled={reenvioLinkStatus === 'sending'}
          className="text-xs text-gray-400 hover:text-firma-green font-medium inline-flex items-start gap-1.5 text-left disabled:opacity-60 transition-colors"
        >
          {reenvioLinkStatus === 'sending' ? <Loader2 size={13} className="animate-spin mt-0.5" /> : <Mail size={13} className="mt-0.5 flex-shrink-0" />}
          <span>Enviarme este enlace por correo (por si lo pierdo)</span>
        </button>
      )}
      {reenvioLinkStatus === 'error' && (
        <p className="text-xs text-red-500 mt-1">No se pudo enviar. Intenta de nuevo en unos minutos.</p>
      )}
    </>
  );

  let numeroSlot = 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" ref={tarjetaRef}>
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

      {/* ── Pasos y contenido: barra lateral en computadora, pasos en horizontal en celular ── */}
      <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="lg:border-r lg:border-gray-100 lg:bg-gray-50/70">
        <div className="lg:hidden px-6 pt-5 pb-1">
        <ol className="flex items-start">
          {pasos.map((id, i) => {
            const actual = i === paso;
            const completo = pasoCompleto(id);
            return (
              <React.Fragment key={id}>
                <li className="flex flex-col items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setPaso(i)}
                    aria-current={actual ? 'step' : undefined}
                    aria-label={`Paso ${i + 1}: ${PASO_META[id].titulo}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      actual ? 'bg-firma-green text-white ring-4 ring-firma-green/15'
                        : completo ? 'bg-firma-green/15 text-firma-green'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {completo && !actual ? <Check size={15} /> : i + 1}
                  </button>
                  <span className={`hidden sm:block text-[11px] leading-tight text-center ${actual ? 'font-semibold text-charcoal' : 'text-gray-400'}`}>
                    {PASO_META[id].corto}
                  </span>
                </li>
                {i < pasos.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-4 mx-2 rounded ${i < paso ? 'bg-firma-green/40' : 'bg-gray-100'}`} />
                )}
              </React.Fragment>
            );
          })}
        </ol>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-semibold text-firma-green uppercase tracking-widest">
              Paso {paso + 1} de {pasos.length}
            </span>
            <span className="text-xs text-gray-400">
              {completedRequired} de {totalRequired} documentos · {progressPct}%
            </span>
          </div>
          <div className="mt-2">{barraProgreso}</div>
          <div className="pt-2 pb-1">{enlaceReenvio}</div>
        </div>

        <div className="hidden lg:block lg:sticky lg:top-20 px-5 py-8">
          <p className="text-xs font-semibold text-firma-green uppercase tracking-widest mb-4 px-2">Tu avance</p>
          <ol className="space-y-1">
            {pasos.map((id, i) => {
              const actual = i === paso;
              const completo = pasoCompleto(id);
              const faltan = id !== 'enviar' ? pendientes[id].length : 0;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setPaso(i)}
                    aria-current={actual ? 'step' : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${actual ? 'bg-white shadow-sm ring-1 ring-gray-100' : 'hover:bg-white/70'}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        actual ? 'bg-firma-green text-white'
                          : completo ? 'bg-firma-green/15 text-firma-green'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {completo && !actual ? <Check size={15} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm leading-tight ${actual ? 'font-semibold text-charcoal' : 'text-gray-500'}`}>{PASO_META[id].titulo}</span>
                      {faltan > 0 && !actual && <span className="block text-[11px] text-amber-600 mt-0.5">{faltan === 1 ? '1 por completar' : `${faltan} por completar`}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-7 px-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>{completedRequired} de {totalRequired} documentos</span>
              <span>{progressPct}%</span>
            </div>
            {barraProgreso}
          </div>
          <div className="mt-5 px-2">{enlaceReenvio}</div>
        </div>
      </aside>

      <div className="min-w-0">
      {expirado && (
        <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">Pasó más de una semana desde que subiste tu documentación</p>
              <p className="text-amber-800">
                Por seguridad, los archivos se eliminan automáticamente a los 7 días. Ya quedó registrado lo que enviaste
                {faltantes.length > 0 ? ' y esto es lo único que te falta:' : ' y no te falta nada: tu expediente está completo.'}
              </p>
              {faltantes.length > 0 && (
                <ul className="mt-2 list-disc pl-5 space-y-0.5 text-amber-900 font-medium">
                  {faltantes.map(f => <li key={f}>{f}</li>)}
                </ul>
              )}
              <p className="mt-2 text-xs text-amber-700">
                ¿Dudas? Escríbenos por{' '}
                <a
                  href="https://wa.me/525525069817?text=Hola%2C%20mi%20enlace%20de%20documentaci%C3%B3n%20expir%C3%B3%20y%20necesito%20ayuda."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  WhatsApp
                </a>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-10">
        <h3 className="font-serif text-xl lg:text-2xl text-charcoal">{PASO_META[idPaso].titulo}</h3>
        <p className="text-sm text-gray-500 mt-1 mb-5">{PASO_META[idPaso].descripcion}</p>

        {/* Todos los pasos quedan montados (solo se oculta el que no se ve) para no perder lo ya subido al ir y venir. */}

        {/* ── Paso: documentos de la empresa / de la persona ───────── */}
        <div className={pasos[paso] === pasoDocsId ? 'grid gap-x-10 gap-y-7 md:grid-cols-2' : 'hidden'}>
          {itemsPrimerPaso.map(item => {
            numeroSlot += 1;
            return (
              <div key={item.key} className="space-y-4">
                {renderSlot(item, numeroSlot)}
                {item.key === IT.domicilioOperativo.key && (
                  <div className="pl-7 space-y-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={domicilioDistinto}
                        onChange={e => cambiarDomicilioDistinto(e.target.checked)}
                        className="w-4 h-4 accent-[#006d4e]"
                      />
                      Mi domicilio operativo es distinto al fiscal
                    </label>
                    {domicilioDistinto && (
                      <div className="border-l-2 border-firma-green/30 pl-4 -ml-0.5">
                        {renderSlot(IT.domicilioFiscal, numeroSlot + 1)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {pasos[paso] === pasoDocsId && <div className="md:col-span-2">{avisoPendientes(pasoDocsId)}</div>}
        </div>

        {/* ── Paso: información financiera ─────────────────────────── */}
        <div className={idPaso === 'finanzas' ? 'space-y-6' : 'hidden'}>
          <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 border-b-2 border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-firma-green/10 flex items-center justify-center flex-shrink-0">
                <Landmark size={16} className="text-firma-green" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">Estados de cuenta bancarios</h4>
                <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses, de la cuenta donde recibes tus ventas. Máximo {MAX_BANCOS} bancos.</p>
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
                  onUploaded={marcarCompletado}
                />
              ))}
              {bancos.length < MAX_BANCOS && (
                <button
                  type="button"
                  onClick={agregarBanco}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:border-firma-green/50 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
                >
                  <PlusCircle size={16} />
                  Agregar otro banco
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {renderSlot(IT.declaracion, 1)}
            {renderSlot(IT.acuse, 2)}
          </div>
          {idPaso === 'finanzas' && avisoPendientes('finanzas')}
        </div>

        {/* ── Paso: CIEC ───────────────────────────────────────────── */}
        <div className={idPaso === 'ciec' ? 'grid gap-6 lg:grid-cols-2 lg:items-start' : 'hidden'}>
          <div className="rounded-2xl border border-firma-green/20 bg-firma-green/5 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-bold text-firma-green mb-2">
              <ShieldCheck size={16} /> ¿Por qué te pedimos tu clave CIEC?
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed space-y-1.5 list-disc pl-5">
              <li>Es la contraseña con la que entras al portal del SAT.</li>
              <li>Con ella consultamos tu información fiscal (facturación, declaraciones y constancia) para evaluar tu perfil más rápido, sin pedirte más papeles.</li>
              <li>Muchas instituciones financieras analizan tu negocio de forma digital con esos datos, y así pueden darte una respuesta en menos tiempo.</li>
              <li>Solo la usamos para consultar tu información y evaluar tu solicitud. Se guarda cifrada y se elimina automáticamente a los 7 días.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">Si no la tienes a la mano, puedes continuar, pero tu trámite puede tardar más.</p>
          </div>
          <CiecInput leadId={leadId} initialSaved={ciecSaved} onSaved={() => setCiecSaved(true)} />
          {idPaso === 'ciec' && <div className="lg:col-span-2">{avisoPendientes('ciec')}</div>}
        </div>

        {/* ── Paso: accionistas (solo persona moral) ───────────────── */}
        {esMoral && (
          <div className={idPaso === 'accionistas' ? 'space-y-4' : 'hidden'}>
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

            <p className="text-xs text-gray-500 leading-relaxed">
              Solo el accionista mayoritario y el representante legal suben su documentación (si es la misma persona, marca las dos casillas y sube una sola vez).
              De los demás accionistas solo necesitamos nombre, porcentaje, correo y teléfono.
            </p>

            {faltaMarcarRoles && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Marca quién es el accionista mayoritario y quién es el representante legal.
              </p>
            )}

            {accionistas.map(a => (
              <AccionistaCard
                key={a.slotIndex}
                leadId={leadId}
                slotIndex={a.slotIndex}
                nombre={a.nombre}
                porcentaje={a.porcentaje}
                correo={a.correo}
                telefono={a.telefono}
                esMayoritario={accionistas.length === 1 ? true : a.esMayoritario}
                esRepresentanteLegal={accionistas.length === 1 ? true : a.esRepresentanteLegal}
                esUnico={accionistas.length === 1}
                requiereDocs={requiereDocs(a)}
                initialDocs={{
                  ...Object.fromEntries(
                    progresoDocs.filter(d => TIPOS_DOC_ACCIONISTA.includes(d.tipoDocumento) && d.slotIndex === a.slotIndex).map(d => [d.tipoDocumento, d.fileName])
                  ),
                  ...Object.fromEntries(
                    progresoDocs.filter(d => d.tipoDocumento === 'ine_accionista' && d.slotIndex === a.slotIndex + SLOT_REVERSO_INE_ACCIONISTA).map(d => ['ine_accionista_reverso', d.fileName])
                  ),
                }}
                initialPurgados={{
                  ...Object.fromEntries(
                    progresoDocs.filter(d => TIPOS_DOC_ACCIONISTA.includes(d.tipoDocumento) && d.slotIndex === a.slotIndex && d.purgado).map(d => [d.tipoDocumento, true])
                  ),
                  ...Object.fromEntries(
                    progresoDocs.filter(d => d.tipoDocumento === 'ine_accionista' && d.slotIndex === a.slotIndex + SLOT_REVERSO_INE_ACCIONISTA && d.purgado).map(d => ['ine_accionista_reverso', true])
                  ),
                }}
                onChange={patch => cambiarAccionista(a.slotIndex, patch)}
                onGuardar={() => guardarAccionista(a.slotIndex)}
                onToggleMayoritario={v => alternarMayoritario(a.slotIndex, v)}
                onToggleRepresentante={v => alternarRepresentante(a.slotIndex, v)}
                onRemove={() => quitarAccionista(a.slotIndex)}
                onUploaded={marcarCompletado}
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
            {idPaso === 'accionistas' && avisoPendientes('accionistas')}
          </div>
        )}

        {/* ── Paso: revisar y enviar ───────────────────────────────── */}
        <div className={idPaso === 'enviar' ? 'space-y-5' : 'hidden'}>
          <ul className="grid gap-2 md:grid-cols-2">
            {pasos.filter(p => p !== 'enviar').map(p => {
              const i = pasos.indexOf(p);
              const faltan = pendientes[p];
              return (
                <li key={p} className="flex items-start gap-3 rounded-xl border border-gray-100 px-4 py-3">
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${faltan.length === 0 ? 'bg-firma-green text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {faltan.length === 0 ? <Check size={12} /> : <span className="text-[10px] font-bold">!</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-charcoal">{PASO_META[p].titulo}</p>
                    {faltan.length === 0 ? (
                      <p className="text-xs text-gray-400">Completo</p>
                    ) : (
                      <ul className="text-xs text-amber-700 mt-0.5 list-disc pl-4 space-y-0.5">
                        {faltan.map(f => <li key={f}>{f}</li>)}
                      </ul>
                    )}
                  </div>
                  {faltan.length > 0 && (
                    <button type="button" onClick={() => setPaso(i)} className="text-xs font-semibold text-firma-green hover:underline flex-shrink-0">
                      Completar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-4">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">¿Cómo prefieres que te contactemos?</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([['whatsapp', 'WhatsApp'], ['llamada', 'Llamada']] as const).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => guardarPreferenciaContacto(valor, contactoHorario)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    contactoCanal === valor ? 'border-firma-green bg-firma-green/10 text-firma-green' : 'border-gray-200 bg-white text-gray-500 hover:border-firma-green/40'
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([['cualquiera', 'Cualquier hora'], ['manana', 'En la mañana'], ['tarde', 'En la tarde']] as const).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => guardarPreferenciaContacto(contactoCanal, valor)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    contactoHorario === valor ? 'border-firma-green bg-firma-green/10 text-firma-green' : 'border-gray-200 bg-white text-gray-500 hover:border-firma-green/40'
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={enviar}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-firma-green text-white rounded-full text-sm font-semibold
              hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30
              active:translate-y-0 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Enviando…' : 'Enviar a mi asesor'}
          </button>
          {faltantes.length > 0 && (
            <p className="text-xs text-gray-400 text-center">
              Si aún te faltan documentos, guardamos tu avance y avisamos a tu asesor. Cuando los tengas, vuelve con tu mismo enlace, cárgalos y pulsa «Enviar a mi asesor» otra vez.
            </p>
          )}
        </div>

        {/* ── Navegación ───────────────────────────────────────────── */}
        <div className="mt-7 pt-5 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPaso(p => Math.max(0, p - 1))}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-firma-green/50 hover:text-firma-green transition-colors ${paso === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft size={16} /> Regresar
            </button>
            {!esUltimo && (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={enviar}
                  disabled={sending || completedRequired === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-600 hover:border-firma-green hover:text-firma-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} />}
                  {sending ? 'Guardando…' : 'Guardar y cargar el resto después'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaso(p => Math.min(pasos.length - 1, p + 1))}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-charcoal text-white text-sm font-semibold hover:bg-firma-green transition-colors"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
          {!esUltimo && (
            <p className="text-[11px] text-gray-400 mt-3 sm:text-right">
              {completedRequired === 0
                ? 'Sube al menos un documento para poder guardar tu avance y continuar después.'
                : '¿No tienes todo a la mano? Guarda tu avance: avisamos a tu asesor y puedes volver con tu mismo enlace para cargar lo que falta.'}
            </p>
          )}
        </div>
      </div>
      </div>
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
