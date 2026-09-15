import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, UserPlus, X, PlusCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackLead } from '../lib/metaPixel';
import { trackEvent } from '../lib/analytics';
import { getStoredUtmParams } from '../lib/utmTracking';
import { EMAIL_REGEX, soloDigitos10 } from '../lib/validation';

// ─── N8N Webhook ──────────────────────────────────────────────────────────────
const N8N_WEBHOOK_URL_PROD = 'https://n8n1.apexdigital.com.mx/webhook/firma7-leads';
const N8N_WEBHOOK_URL_TEST = 'https://santiagor17.app.n8n.cloud/webhook-test/956ed48a-8870-4b82-b74b-579b22e8c073';
const N8N_WEBHOOK_URL = N8N_WEBHOOK_URL_PROD || N8N_WEBHOOK_URL_TEST;

const PORCENTAJE_MINIMO_ACCIONISTAS = 75;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Accionista {
  nombre: string;
  porcentaje: string;
  // Solo el representante legal necesita documentación en el siguiente paso —
  // el resto de accionistas solo aporta datos de contacto.
  esRepresentanteLegal: boolean;
  correo: string;
  telefono: string;
}

interface EquipoGarantia {
  marca: string;
  modelo: string;
  anio: string;
  valor: string;
}

interface FormData {
  nombreCompleto: string;
  numero: string;
  correo: string;
  rfc: string;
  cargo: string;
  ingresos: string;
  antiguedad: string;
  constitucion: string;
  accionistas: Accionista[];
  buroPF: string;
  buroPFDetalle: string;
  buroPMEmpresa: string;
  buroPMEmpresaDetalle: string;
  buroPMAccionista: string;
  buroPMAccionistaDetalle: string;
  giro: string;
  monto: string;
  destino: string;
  garantia: string;
  garantiaTipo: string;
  garantiaHipotecariaMonto: string;
  garantiaHipotecariaParentesco: string;
  garantiaHipotecariaUrl: string;
  garantiaMaquinaria: EquipoGarantia[];
  garantiaTransporte: EquipoGarantia;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
}

const ACCIONISTA_VACIO: Accionista = { nombre: '', porcentaje: '', esRepresentanteLegal: false, correo: '', telefono: '' };
const EQUIPO_VACIO: EquipoGarantia = { marca: '', modelo: '', anio: '', valor: '' };

const INITIAL: FormData = {
  nombreCompleto: '', numero: '', correo: '', rfc: '', cargo: '',
  ingresos: '', antiguedad: '', constitucion: '',
  accionistas: [{ ...ACCIONISTA_VACIO }],
  buroPF: '', buroPFDetalle: '',
  buroPMEmpresa: '', buroPMEmpresaDetalle: '',
  buroPMAccionista: '', buroPMAccionistaDetalle: '',
  giro: '', monto: '', destino: '', garantia: '',
  garantiaTipo: '',
  garantiaHipotecariaMonto: '', garantiaHipotecariaParentesco: '', garantiaHipotecariaUrl: '',
  garantiaMaquinaria: [{ ...EQUIPO_VACIO }],
  garantiaTransporte: { ...EQUIPO_VACIO },
  utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '',
};

// Datos frescos para una sesión nueva: arranca de INITIAL pero con la
// atribución de campaña capturada por captureUtmParams() en App.tsx.
function getInitialFormData(): FormData {
  return { ...INITIAL, ...getStoredUtmParams() };
}

// ─── Progreso guardado ─────────────────────────────────────────────────────────
const PROGRESS_STORAGE_KEY = 'firma7_profiling_progress';
const PROGRESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function loadSavedProgress(): { data: FormData; step: number } | null {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > PROGRESS_MAX_AGE_MS) return null;
    if (!parsed.data) return null;
    return { data: { ...INITIAL, ...parsed.data }, step: parsed.step ?? 0 };
  } catch {
    return null;
  }
}

function clearSavedProgress(): void {
  try { localStorage.removeItem(PROGRESS_STORAGE_KEY); } catch { /* noop */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isDescarte(data: FormData): boolean {
  if (data.ingresos === 'Menor a 150 mil pesos') return true;
  if (data.antiguedad === 'Menor a 6 meses') return true;
  if (data.constitucion === 'Persona Física con Actividad Empresarial' && data.buroPF === 'Malo') return true;
  if (data.constitucion === 'Persona Moral') {
    if (data.buroPMEmpresa === 'Malo') return true;
    if (data.buroPMAccionista === 'Malo') return true;
  }
  return false;
}

function buildWhatsAppMessage(data: FormData): string {
  const lines: string[] = [
    '📋 *NUEVA SOLICITUD DE CRÉDITO – FIRMA 7*', '',
    '🏢 *CONSTITUCIÓN*',
    `• ${data.constitucion}`, '',
    '👤 *DATOS DEL SOLICITANTE*',
    `• Nombre: ${data.nombreCompleto}`,
    `• Número: ${data.numero}`,
    `• Correo: ${data.correo}`,
    `• RFC: ${data.rfc}`,
    `• Cargo: ${data.cargo}`, '',
    '🏭 *GIRO DEL NEGOCIO*',
    `• ${data.giro}`, '',
    '💰 *INGRESOS MENSUALES DE LA EMPRESA*',
    `• ${data.ingresos}`, '',
    '📅 *ANTIGÜEDAD DE LA EMPRESA*',
    `• ${data.antiguedad}`, '',
  ];
  if (data.constitucion === 'Persona Moral') {
    lines.push('🧾 *CUADRO ACCIONARIO*');
    const unico = data.accionistas.length === 1;
    data.accionistas.forEach(a => {
      if (!a.nombre.trim()) return;
      const esRepLegal = unico || a.esRepresentanteLegal;
      const rol = esRepLegal ? ' (Representante legal)' : '';
      const contacto = !esRepLegal && (a.correo || a.telefono) ? ` — ${[a.correo, a.telefono].filter(Boolean).join(' / ')}` : '';
      lines.push(`• ${a.nombre} — ${a.porcentaje || '0'}%${rol}${contacto}`);
    });
    lines.push('');
  }
  if (data.constitucion === 'Persona Física con Actividad Empresarial') {
    lines.push('📊 *BURÓ DE CRÉDITO (Persona Física)*');
    lines.push(`• ${data.buroPF}`);
    if (data.buroPF === 'Regular' && data.buroPFDetalle) lines.push(`  Detalle: ${data.buroPFDetalle}`);
    lines.push('');
  }
  if (data.constitucion === 'Persona Moral') {
    lines.push('📊 *BURÓ DE CRÉDITO (Empresa)*');
    lines.push(`• ${data.buroPMEmpresa}`);
    if (data.buroPMEmpresa === 'Regular' && data.buroPMEmpresaDetalle) lines.push(`  Detalle: ${data.buroPMEmpresaDetalle}`);
    lines.push('');
    lines.push('📊 *BURÓ DE CRÉDITO (Principal Accionista)*');
    lines.push(`• ${data.buroPMAccionista}`);
    if (data.buroPMAccionista === 'Regular' && data.buroPMAccionistaDetalle) lines.push(`  Detalle: ${data.buroPMAccionistaDetalle}`);
    lines.push('');
  }
  lines.push('💵 *MONTO DE CRÉDITO SOLICITADO*');
  lines.push(`• $${Number(data.monto.replace(/\D/g, '')).toLocaleString('es-MX')} MXN`);
  lines.push('');
  lines.push('🎯 *DESTINO DEL CRÉDITO*');
  lines.push(`• ${data.destino}`);
  lines.push('');
  lines.push('🏠 *GARANTÍA*');
  lines.push(`• ${data.garantia}`);
  if (data.garantia === 'Sí' && data.garantiaTipo) {
    lines.push(`  Tipo: ${data.garantiaTipo}`);
    if (data.garantiaTipo === 'Hipotecaria') {
      lines.push(`  Monto aproximado: ${data.garantiaHipotecariaMonto}`);
      lines.push(`  Propietario: ${data.garantiaHipotecariaParentesco}`);
      lines.push(`  Ubicación: ${data.garantiaHipotecariaUrl}`);
    }
    if (data.garantiaTipo === 'Maquinaria') {
      data.garantiaMaquinaria.forEach((eq, i) => {
        if (eq.marca.trim()) lines.push(`  Equipo ${i + 1}: ${eq.marca} ${eq.modelo} (${eq.anio}) — $${eq.valor}`);
      });
    }
    if (data.garantiaTipo === 'Equipo de transporte') {
      lines.push(`  Equipo: ${data.garantiaTransporte.marca} ${data.garantiaTransporte.modelo} (${data.garantiaTransporte.anio}) — $${data.garantiaTransporte.valor}`);
    }
  }
  return lines.join('\n');
}

// ─── Integrations ─────────────────────────────────────────────────────────────
function sendToN8N(data: FormData, calificado: boolean, evento?: string): void {
  const payload = {
    ...data,
    calificado,
    evento: evento ?? (calificado ? 'lead_calificado' : 'lead_descartado'),
    timestamp: new Date().toISOString(),
  };
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Se usa un RPC (security definer) en vez de insert().select().single() directo:
// PostgREST necesita permiso de SELECT en RLS para devolver la fila insertada, y
// leads no lo tiene (exponer SELECT dejaría leer todos los leads desde el navegador).
async function sendToSupabase(data: FormData, calificado: boolean, evento?: string): Promise<string | null> {
  const eventoFinal = evento ?? (calificado ? 'lead_calificado' : 'lead_descartado');
  try {
    const { data: id, error } = await supabase.rpc('submit_lead', {
      p: { ...data, calificado, evento: eventoFinal },
    });
    if (error) return null;
    return (id as string) ?? null;
  } catch {
    return null;
  }
}

// La sincronización a GHL ocurre en Supabase (trigger sync_lead_to_ghl sobre
// la tabla leads), no aquí — así se evita exponer credenciales en el navegador.
function sendToAll(data: FormData, calificado: boolean, evento?: string): void {
  sendToN8N(data, calificado, evento);
  sendToSupabase(data, calificado, evento);
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#006d4e', '#00a86b', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
    const pieces: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; angle: number; spin: number; opacity: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.05;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (pieces.some(p => p.opacity > 0)) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepDot: React.FC<{ active: boolean; completed: boolean; label: string }> = ({ active, completed, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
      completed ? 'bg-firma-green scale-110' : active ? 'bg-firma-green ring-4 ring-firma-green/20' : 'bg-gray-300'
    }`} />
    <span className={`text-[9px] font-medium tracking-wide hidden sm:block ${active ? 'text-firma-green' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

// ─── Radio Option ─────────────────────────────────────────────────────────────
const RadioOption: React.FC<{
  value: string; selected: boolean; onChange: (v: string) => void;
  children: React.ReactNode; isDescarte?: boolean;
}> = ({ value, selected, onChange, children, isDescarte }) => (
  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
    ${selected
      ? isDescarte ? 'border-red-400 bg-red-50' : 'border-firma-green bg-firma-green/5'
      : 'border-gray-200 hover:border-firma-green/40 hover:bg-gray-50'
    }`}>
    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
      selected
        ? isDescarte ? 'border-red-400 bg-red-400' : 'border-firma-green bg-firma-green'
        : 'border-gray-400'
    }`}>
      {selected && <div className="w-2 h-2 rounded-full bg-white m-auto mt-0.5" />}
    </div>
    <input type="radio" value={value} checked={selected} onChange={() => onChange(value)} className="sr-only" />
    <span className={`text-sm font-medium leading-snug ${
      selected
        ? isDescarte ? 'text-red-700' : 'text-firma-green'
        : 'text-charcoal group-hover:text-charcoal'
    }`}>
      {children}
    </span>
  </label>
);

// ─── Buro Section ─────────────────────────────────────────────────────────────
const BuroSection: React.FC<{
  title: string; value: string; detalle: string;
  onChangeBuro: (v: string) => void; onChangeDetalle: (v: string) => void;
}> = ({ title, value, detalle, onChangeBuro, onChangeDetalle }) => {
  const opciones = ['Excelente', 'Bueno', 'Regular', 'Malo'];
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-charcoal">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opciones.map(op => (
          <RadioOption key={op} value={op} selected={value === op} onChange={onChangeBuro} isDescarte={op === 'Malo'}>
            {op}
          </RadioOption>
        ))}
      </div>
      {value === 'Regular' && (
        <div className="mt-3 animate-fadeIn">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
            ¿Cuánto debe y con quién?
          </label>
          <textarea
            value={detalle}
            onChange={e => onChangeDetalle(e.target.value)}
            rows={3}
            placeholder="Ej: $50,000 MXN con Banco XYZ por un crédito personal…"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green resize-none transition"
          />
        </div>
      )}
    </div>
  );
};

// ─── Campos de un equipo (maquinaria / transporte) ─────────────────────────────
const EquipoFields: React.FC<{
  equipo: EquipoGarantia;
  onChange: (field: keyof EquipoGarantia, v: string) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}> = ({ equipo, onChange, errors, errorPrefix }) => {
  const cls = (field: string) =>
    `w-full border ${errors[`${errorPrefix}_${field}`] ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition`;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <input placeholder="Marca" value={equipo.marca} onChange={e => onChange('marca', e.target.value)} className={cls('marca')} />
        {errors[`${errorPrefix}_marca`] && <p className="field-error">{errors[`${errorPrefix}_marca`]}</p>}
      </div>
      <div>
        <input placeholder="Modelo" value={equipo.modelo} onChange={e => onChange('modelo', e.target.value)} className={cls('modelo')} />
        {errors[`${errorPrefix}_modelo`] && <p className="field-error">{errors[`${errorPrefix}_modelo`]}</p>}
      </div>
      <div>
        <input placeholder="Año" inputMode="numeric" value={equipo.anio} onChange={e => onChange('anio', e.target.value.replace(/\D/g, '').slice(0, 4))} className={cls('anio')} />
        {errors[`${errorPrefix}_anio`] && <p className="field-error">{errors[`${errorPrefix}_anio`]}</p>}
      </div>
      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
          <input
            placeholder="Valor aproximado"
            inputMode="numeric"
            value={equipo.valor}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onChange('valor', raw ? Number(raw).toLocaleString('es-MX') : '');
            }}
            className={`${cls('valor')} pl-8`}
          />
        </div>
        {errors[`${errorPrefix}_valor`] && <p className="field-error">{errors[`${errorPrefix}_valor`]}</p>}
      </div>
    </div>
  );
};

// ─── Seguimiento de leads incompletos ──────────────────────────────────────────
// Si el lead llena sus datos de contacto pero no termina el formulario en este
// tiempo, se notifica como "no completó" (no como descarte) con lo que haya capturado.
const FOLLOWUP_DELAY_MS = 10 * 60 * 1000;

// ─── Main Component ───────────────────────────────────────────────────────────
export const ProfilingForm: React.FC = () => {
  const navigate = useNavigate();
  const [savedProgress] = useState(() => loadSavedProgress());
  const [data, setData] = useState<FormData>(() => savedProgress?.data ?? getInitialFormData());
  const [step, setStep] = useState(() => savedProgress?.step ?? 0);
  const [showRestoredBanner, setShowRestoredBanner] = useState(() => savedProgress !== null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Un solo evento por montaje del formulario — el denominador del embudo de
  // abandono en GA4 (cuántos abren el perfilador vs. cuántos completan cada paso).
  useEffect(() => {
    trackEvent('profiling_started', { resumed: savedProgress !== null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda el progreso en cada cambio, para poder retomarlo si el lead cierra
  // o recarga la página antes de terminar.
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ data, step, savedAt: Date.now() }));
    } catch { /* noop */ }
  }, [data, step]);

  const startOver = () => {
    clearSavedProgress();
    setData(getInitialFormData());
    setStep(0);
    setErrors({});
    setShowRestoredBanner(false);
  };

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const resolvedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const followupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFollowupTimer = () => {
    if (followupTimeoutRef.current) {
      clearTimeout(followupTimeoutRef.current);
      followupTimeoutRef.current = null;
    }
  };

  const scheduleFollowupTimer = () => {
    followupTimeoutRef.current = setTimeout(() => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      sendToAll(dataRef.current, false, 'lead_incompleto');
    }, FOLLOWUP_DELAY_MS);
  };

  useEffect(() => () => clearFollowupTimer(), []);

  const set = (field: keyof FormData, value: any) =>
    setData(prev => ({ ...prev, [field]: value }));

  // ─── Pasos dinámicos ───────────────────────────────────────────────────────
  // La constitución se elige primero porque decide qué pasos aplican después
  // (el de "Accionistas" solo existe para Persona Moral).
  const esMoral = data.constitucion === 'Persona Moral';
  const STEP_KEYS = useMemo(() => [
    'constitucion', 'contacto', 'ingresos', 'antiguedad',
    ...(esMoral ? ['accionistas'] : []),
    'buro', 'empresa', 'giro', 'monto', 'destino', 'garantia',
  ], [esMoral]);
  const STEP_LABELS: Record<string, string> = {
    constitucion: 'Constitución', contacto: 'Contacto', ingresos: 'Ingresos', antiguedad: 'Antigüedad',
    accionistas: 'Accionistas', buro: 'Buró', empresa: 'Empresa', giro: 'Giro', monto: 'Monto',
    destino: 'Destino', garantia: 'Garantía',
  };
  const STEP_TITLES: Record<string, string> = {
    constitucion: 'Constitución', contacto: 'Datos de Contacto', ingresos: 'Ingresos Mensuales',
    antiguedad: 'Antigüedad de la Empresa', accionistas: 'Cuadro Accionario',
    buro: esMoral ? 'Buró de Crédito (Empresa y Accionista)' : 'Buró de Crédito',
    empresa: 'Datos de la Empresa', giro: 'Giro del Negocio', monto: 'Monto de Crédito',
    destino: 'Destino del Crédito', garantia: 'Garantía',
  };
  const currentKey = STEP_KEYS[step];

  // ─── Accionistas ───────────────────────────────────────────────────────────
  const setAccionista = (i: number, field: keyof Accionista, value: string) =>
    setData(prev => ({ ...prev, accionistas: prev.accionistas.map((a, idx) => idx === i ? { ...a, [field]: value } : a) }));
  const agregarAccionista = () => setData(prev => ({ ...prev, accionistas: [...prev.accionistas, { ...ACCIONISTA_VACIO }] }));
  const quitarAccionista = (i: number) => setData(prev => ({ ...prev, accionistas: prev.accionistas.filter((_, idx) => idx !== i) }));
  const marcarRepresentanteLegal = (i: number) =>
    setData(prev => ({ ...prev, accionistas: prev.accionistas.map((a, idx) => ({ ...a, esRepresentanteLegal: idx === i })) }));
  const totalPorcentajeAccionistas = data.accionistas.reduce((sum, a) => sum + (parseFloat(a.porcentaje) || 0), 0);
  const porcentajeCumplido = totalPorcentajeAccionistas >= PORCENTAJE_MINIMO_ACCIONISTAS;

  // ─── Garantía: maquinaria (varios equipos) ─────────────────────────────────
  const setMaquinaria = (i: number, field: keyof EquipoGarantia, value: string) =>
    setData(prev => ({ ...prev, garantiaMaquinaria: prev.garantiaMaquinaria.map((eq, idx) => idx === i ? { ...eq, [field]: value } : eq) }));
  const agregarMaquinaria = () => setData(prev => ({ ...prev, garantiaMaquinaria: [...prev.garantiaMaquinaria, { ...EQUIPO_VACIO }] }));
  const quitarMaquinaria = (i: number) => setData(prev => ({ ...prev, garantiaMaquinaria: prev.garantiaMaquinaria.filter((_, idx) => idx !== i) }));
  const setTransporte = (field: keyof EquipoGarantia, value: string) =>
    setData(prev => ({ ...prev, garantiaTransporte: { ...prev.garantiaTransporte, [field]: value } }));

  // ─── Validate ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (currentKey === 'constitucion' && !data.constitucion) e.constitucion = 'Selecciona una opción';
    if (currentKey === 'contacto') {
      if (!data.nombreCompleto.trim()) e.nombreCompleto = 'Requerido';
      if (!data.numero.trim()) e.numero = 'Requerido';
      if (!data.correo.trim() || !/\S+@\S+\.\S+/.test(data.correo)) e.correo = 'Correo inválido';
    }
    if (currentKey === 'ingresos' && !data.ingresos) e.ingresos = 'Selecciona una opción';
    if (currentKey === 'antiguedad' && !data.antiguedad) e.antiguedad = 'Selecciona una opción';
    if (currentKey === 'accionistas') {
      const unico = data.accionistas.length === 1;
      data.accionistas.forEach((a, i) => {
        if (!a.nombre.trim()) e[`accionista_nombre_${i}`] = 'Requerido';
        if (!a.porcentaje || parseFloat(a.porcentaje) <= 0) e[`accionista_porcentaje_${i}`] = 'Requerido';
        // El representante legal sube su documentación en el siguiente paso; los
        // demás accionistas solo necesitan datos de contacto aquí.
        if (!unico && !a.esRepresentanteLegal) {
          if (!a.correo.trim() || !EMAIL_REGEX.test(a.correo.trim())) e[`accionista_correo_${i}`] = 'Correo inválido';
          if (a.telefono.length !== 10) e[`accionista_telefono_${i}`] = 'Debe tener 10 dígitos';
        }
      });
      if (!unico && !data.accionistas.some(a => a.esRepresentanteLegal)) {
        e.accionistas_representante = 'Marca quién es el representante legal';
      }
    }
    if (currentKey === 'buro') {
      if (data.constitucion === 'Persona Física con Actividad Empresarial') {
        if (!data.buroPF) e.buroPF = 'Selecciona una opción';
        if (data.buroPF === 'Regular' && !data.buroPFDetalle.trim()) e.buroPFDetalle = 'Por favor detalla el monto y acreedor';
      }
      if (data.constitucion === 'Persona Moral') {
        if (!data.buroPMEmpresa) e.buroPMEmpresa = 'Selecciona una opción';
        if (data.buroPMEmpresa === 'Regular' && !data.buroPMEmpresaDetalle.trim()) e.buroPMEmpresaDetalle = 'Por favor detalla el monto y acreedor';
        if (!data.buroPMAccionista) e.buroPMAccionista = 'Selecciona una opción';
        if (data.buroPMAccionista === 'Regular' && !data.buroPMAccionistaDetalle.trim()) e.buroPMAccionistaDetalle = 'Por favor detalla el monto y acreedor';
      }
    }
    if (currentKey === 'empresa') {
      if (!data.rfc.trim()) e.rfc = 'Requerido';
      if (!data.cargo.trim()) e.cargo = 'Requerido';
    }
    if (currentKey === 'giro' && !data.giro.trim()) e.giro = 'Por favor describe a qué se dedica tu empresa';
    if (currentKey === 'monto') {
      if (!data.monto.trim()) e.monto = 'Requerido';
      else if (!/^\d[\d,]*$/.test(data.monto.replace(/\s/g, ''))) e.monto = 'Solo números';
    }
    if (currentKey === 'destino' && !data.destino.trim()) e.destino = 'Por favor describe el destino del crédito';
    if (currentKey === 'garantia') {
      if (!data.garantia) e.garantia = 'Selecciona una opción';
      if (data.garantia === 'Sí') {
        if (!data.garantiaTipo) e.garantiaTipo = 'Selecciona el tipo de garantía';
        else if (data.garantiaTipo === 'Hipotecaria') {
          if (!data.garantiaHipotecariaMonto.trim()) e.garantiaHipotecariaMonto = 'Requerido';
          if (!data.garantiaHipotecariaParentesco.trim()) e.garantiaHipotecariaParentesco = 'Requerido';
          if (!data.garantiaHipotecariaUrl.trim()) e.garantiaHipotecariaUrl = 'Requerido';
        } else if (data.garantiaTipo === 'Maquinaria') {
          data.garantiaMaquinaria.forEach((eq, i) => {
            if (!eq.marca.trim()) e[`maquinaria_${i}_marca`] = 'Requerido';
            if (!eq.modelo.trim()) e[`maquinaria_${i}_modelo`] = 'Requerido';
            if (!eq.anio.trim()) e[`maquinaria_${i}_anio`] = 'Requerido';
            if (!eq.valor.trim()) e[`maquinaria_${i}_valor`] = 'Requerido';
          });
        } else if (data.garantiaTipo === 'Equipo de transporte') {
          if (!data.garantiaTransporte.marca.trim()) e.transporte_marca = 'Requerido';
          if (!data.garantiaTransporte.modelo.trim()) e.transporte_modelo = 'Requerido';
          if (!data.garantiaTransporte.anio.trim()) e.transporte_anio = 'Requerido';
          if (!data.garantiaTransporte.valor.trim()) e.transporte_valor = 'Requerido';
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const next = () => {
    if (!validate()) return;
    trackEvent('profiling_step_completed', { step_key: currentKey, step_number: step + 1, step_total: STEP_KEYS.length });
    if (currentKey === 'contacto' && !timerStartedRef.current) {
      // Ya tenemos datos de contacto: arrancamos la cuenta regresiva de 10 min.
      // Si el lead no termina el formulario en ese lapso, se notifica como
      // "no completó" — no se envía ningún correo todavía.
      timerStartedRef.current = true;
      scheduleFollowupTimer();
    }
    if (isDescarte({ ...data })) {
      resolvedRef.current = true;
      clearFollowupTimer();
      clearSavedProgress();
      sendToAll(data, false, 'lead_descartado');
      trackEvent('profiling_descarte', { step_key: currentKey });
      navigate('/espera');
      return;
    }
    setStep(s => s + 1);
  };

  const prev = () => { setErrors({}); setStep(s => Math.max(0, s - 1)); };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!validate()) return;
    resolvedRef.current = true;
    clearFollowupTimer();
    clearSavedProgress();
    sendToN8N(data, true);
    trackLead();
    trackEvent('profiling_completed');
    const leadId = await sendToSupabase(data, true);
    const tipo = data.constitucion === 'Persona Moral' ? 'moral' : 'fisica';
    const params = new URLSearchParams({ tipo, nombre: data.nombreCompleto.split(' ')[0] });
    if (leadId) params.set('leadId', leadId);
    navigate(`/aprobado?${params.toString()}`);
  };

  const inputClass = (field: string) =>
    `w-full border ${errors[field] ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-firma-green/40 focus:border-firma-green transition`;

  // ─── Buro step ─────────────────────────────────────────────────────────────
  const renderBuroStep = () => {
    if (data.constitucion === 'Persona Física con Actividad Empresarial') {
      return (
        <div className="space-y-6">
          <BuroSection
            title="¿Cómo se encuentra en buró de crédito?"
            value={data.buroPF} detalle={data.buroPFDetalle}
            onChangeBuro={v => { set('buroPF', v); setErrors({}); }}
            onChangeDetalle={v => set('buroPFDetalle', v)}
          />
          {errors.buroPF && <p className="field-error">{errors.buroPF}</p>}
          {errors.buroPFDetalle && <p className="field-error">{errors.buroPFDetalle}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <BuroSection
          title="¿Cómo se encuentra en buró de crédito la empresa?"
          value={data.buroPMEmpresa} detalle={data.buroPMEmpresaDetalle}
          onChangeBuro={v => { set('buroPMEmpresa', v); setErrors({}); }}
          onChangeDetalle={v => set('buroPMEmpresaDetalle', v)}
        />
        {errors.buroPMEmpresa && <p className="field-error">{errors.buroPMEmpresa}</p>}
        {errors.buroPMEmpresaDetalle && <p className="field-error">{errors.buroPMEmpresaDetalle}</p>}
        <div className="border-t border-gray-100 pt-6">
          <BuroSection
            title="¿Cómo se encuentra en buró de crédito el principal accionista?"
            value={data.buroPMAccionista} detalle={data.buroPMAccionistaDetalle}
            onChangeBuro={v => { set('buroPMAccionista', v); setErrors({}); }}
            onChangeDetalle={v => set('buroPMAccionistaDetalle', v)}
          />
          {errors.buroPMAccionista && <p className="field-error">{errors.buroPMAccionista}</p>}
          {errors.buroPMAccionistaDetalle && <p className="field-error">{errors.buroPMAccionistaDetalle}</p>}
        </div>
      </div>
    );
  };

  // ─── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentKey) {
      case 'constitucion':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">¿Cómo está constituida tu empresa?</p>
            {['Persona Física con Actividad Empresarial', 'Persona Moral'].map(op => (
              <RadioOption key={op} value={op} selected={data.constitucion === op}
                onChange={v => {
                  set('constitucion', v);
                  set('buroPF', ''); set('buroPFDetalle', '');
                  set('buroPMEmpresa', ''); set('buroPMEmpresaDetalle', '');
                  set('buroPMAccionista', ''); set('buroPMAccionistaDetalle', '');
                  setErrors({});
                }}>
                {op}
              </RadioOption>
            ))}
            {errors.constitucion && <p className="field-error">{errors.constitucion}</p>}
          </div>
        );

      case 'contacto':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Solo toma 2 minutos. Empieza con tus datos de contacto.</p>
            <div>
              <label className="field-label">Nombre completo</label>
              <input id="f-nombre" className={inputClass('nombreCompleto')} placeholder="Juan García Pérez" value={data.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)} />
              {errors.nombreCompleto && <p className="field-error">{errors.nombreCompleto}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Número de teléfono / WhatsApp</label>
                <input id="f-numero" type="tel" className={inputClass('numero')} placeholder="55 1234 5678" value={data.numero} onChange={e => set('numero', e.target.value)} />
                {errors.numero && <p className="field-error">{errors.numero}</p>}
              </div>
              <div>
                <label className="field-label">Correo electrónico</label>
                <input id="f-correo" type="email" className={inputClass('correo')} placeholder="correo@empresa.com" value={data.correo} onChange={e => set('correo', e.target.value)} />
                {errors.correo && <p className="field-error">{errors.correo}</p>}
              </div>
            </div>
          </div>
        );

      case 'ingresos':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Selecciona el rango de ingresos mensuales de tu empresa.</p>
            {[
              { value: 'Menor a 150 mil pesos', d: true },
              { value: 'Entre 150 mil y 300 mil pesos', d: false },
              { value: 'Entre 300 mil y 500 mil pesos', d: false },
              { value: 'Más de 500 mil pesos', d: false },
            ].map(op => (
              <RadioOption key={op.value} value={op.value} selected={data.ingresos === op.value}
                onChange={v => { set('ingresos', v); setErrors({}); }} isDescarte={op.d}>
                {op.value}
              </RadioOption>
            ))}
            {errors.ingresos && <p className="field-error">{errors.ingresos}</p>}
          </div>
        );

      case 'antiguedad':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">¿Cuánto tiempo lleva operando tu empresa?</p>
            {[
              { value: 'Menor a 6 meses', d: true },
              { value: 'Entre 6 meses y 1 año', d: false },
              { value: 'Entre 1 año y 2 años', d: false },
              { value: 'Más de 2 años', d: false },
            ].map(op => (
              <RadioOption key={op.value} value={op.value} selected={data.antiguedad === op.value}
                onChange={v => { set('antiguedad', v); setErrors({}); }} isDescarte={op.d}>
                {op.value}
              </RadioOption>
            ))}
            {errors.antiguedad && <p className="field-error">{errors.antiguedad}</p>}
          </div>
        );

      case 'accionistas':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Indica a los accionistas de la empresa y qué porcentaje de acciones tiene cada uno.
            </p>
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
              porcentajeCumplido ? 'bg-firma-green/5 text-firma-green' : 'bg-amber-50 text-amber-700'
            }`}>
              <span>
                Cuadro accionario capturado: <strong>{totalPorcentajeAccionistas}%</strong>
                {!porcentajeCumplido && ` — necesitas al menos ${PORCENTAJE_MINIMO_ACCIONISTAS}%`}
              </span>
            </div>
            {errors.accionistas_representante && <p className="field-error">{errors.accionistas_representante}</p>}
            <div className="space-y-3">
              {data.accionistas.map((a, i) => {
                const unico = data.accionistas.length === 1;
                const esRepLegalEfectivo = unico || a.esRepresentanteLegal;
                return (
                  <div key={i} className="border-2 border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
                        <div>
                          <input
                            placeholder="Nombre del accionista"
                            value={a.nombre}
                            onChange={e => setAccionista(i, 'nombre', e.target.value)}
                            className={inputClass(`accionista_nombre_${i}`)}
                          />
                          {errors[`accionista_nombre_${i}`] && <p className="field-error">{errors[`accionista_nombre_${i}`]}</p>}
                        </div>
                        <div className="relative">
                          <input
                            placeholder="Porcentaje"
                            inputMode="decimal"
                            value={a.porcentaje}
                            onChange={e => {
                              const limpio = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                              const num = parseFloat(limpio);
                              setAccionista(i, 'porcentaje', !isNaN(num) && num > 100 ? '100' : limpio);
                            }}
                            className={`${inputClass(`accionista_porcentaje_${i}`)} pr-7`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                          {errors[`accionista_porcentaje_${i}`] && <p className="field-error">{errors[`accionista_porcentaje_${i}`]}</p>}
                        </div>
                      </div>
                      {!unico && (
                        <button type="button" onClick={() => quitarAccionista(i)} className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex-shrink-0" aria-label="Quitar accionista">
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {unico ? (
                      <p className="text-xs text-gray-400">Se toma como representante legal — subirá su documentación más adelante.</p>
                    ) : a.esRepresentanteLegal ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-firma-green bg-firma-green/10 rounded-full px-3 py-1">
                        <ShieldCheck size={13} /> Representante legal
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => marcarRepresentanteLegal(i)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-firma-green transition-colors"
                      >
                        <ShieldCheck size={13} /> Marcar como representante legal
                      </button>
                    )}

                    {!esRepLegalEfectivo && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <input
                            type="email"
                            placeholder="Correo"
                            value={a.correo}
                            onChange={e => setAccionista(i, 'correo', e.target.value)}
                            className={inputClass(`accionista_correo_${i}`)}
                          />
                          {errors[`accionista_correo_${i}`] && <p className="field-error">{errors[`accionista_correo_${i}`]}</p>}
                        </div>
                        <div>
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Teléfono (10 dígitos)"
                            value={a.telefono}
                            onChange={e => setAccionista(i, 'telefono', soloDigitos10(e.target.value))}
                            className={inputClass(`accionista_telefono_${i}`)}
                          />
                          {errors[`accionista_telefono_${i}`] && <p className="field-error">{errors[`accionista_telefono_${i}`]}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={agregarAccionista}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:border-firma-green/50 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
            >
              <UserPlus size={16} />
              Agregar accionista
            </button>
          </div>
        );

      case 'buro':
        return renderBuroStep();

      case 'empresa':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">¡Vas muy bien! Necesitamos los datos formales de tu empresa.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">RFC de la empresa</label>
                <input id="f-rfc" className={inputClass('rfc')} placeholder="XAXX010101000" value={data.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} maxLength={13} />
                {errors.rfc && <p className="field-error">{errors.rfc}</p>}
              </div>
              <div>
                <label className="field-label">Tu cargo en la empresa</label>
                <input id="f-cargo" className={inputClass('cargo')} placeholder="Director, Gerente, etc." value={data.cargo} onChange={e => set('cargo', e.target.value)} />
                {errors.cargo && <p className="field-error">{errors.cargo}</p>}
              </div>
            </div>
          </div>
        );

      case 'giro':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Cuéntanos sobre tu empresa: ¿a qué se dedica, qué productos o servicios ofrece y quiénes son sus clientes?
            </p>
            <div>
              <label className="field-label">Descripción del negocio</label>
              <textarea
                id="f-giro"
                value={data.giro}
                rows={5}
                onChange={e => { set('giro', e.target.value); setErrors({}); }}
                placeholder="Ej: Empresa de construcción enfocada en obra civil para el sector público. Contamos con 15 empleados y operamos principalmente en CDMX y Estado de México…"
                className={`${inputClass('giro')} resize-none`}
              />
              {errors.giro && <p className="field-error">{errors.giro}</p>}
            </div>
            <p className="text-xs text-gray-400">
              Esta información nos ayuda a conectarte con las instituciones financieras más adecuadas para tu industria.
            </p>
          </div>
        );

      case 'monto':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa el monto de crédito que deseas solicitar (solo números).</p>
            <div>
              <label className="field-label">Monto solicitado (MXN)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                <input
                  id="f-monto" type="text" inputMode="numeric"
                  className={`${inputClass('monto')} pl-8`} placeholder="500,000"
                  value={data.monto}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    set('monto', raw ? Number(raw).toLocaleString('es-MX') : '');
                    setErrors({});
                  }}
                />
              </div>
              {errors.monto && <p className="field-error">{errors.monto}</p>}
            </div>
          </div>
        );

      case 'destino':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">¿Para qué se va a utilizar el crédito? Brinda una breve explicación.</p>
            <div>
              <label className="field-label">Destino del crédito</label>
              <textarea
                id="f-destino" value={data.destino} rows={5}
                onChange={e => { set('destino', e.target.value); setErrors({}); }}
                placeholder="Ej: Capital de trabajo para inventario, expansión de sucursales, compra de maquinaria…"
                className={`${inputClass('destino')} resize-none`}
              />
              {errors.destino && <p className="field-error">{errors.destino}</p>}
            </div>
          </div>
        );

      case 'garantia':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">En caso de requerirse, ¿cuenta con garantía?</p>
            <div className="space-y-3">
              <RadioOption value="Sí" selected={data.garantia === 'Sí'} onChange={v => { set('garantia', v); setErrors({}); }}>
                Sí
              </RadioOption>
              <RadioOption value="No" selected={data.garantia === 'No'} onChange={v => {
                set('garantia', v); set('garantiaTipo', ''); setErrors({});
              }}>
                No
              </RadioOption>
            </div>
            {errors.garantia && <p className="field-error">{errors.garantia}</p>}

            {data.garantia === 'Sí' && (
              <div className="mt-4 pt-5 border-t border-gray-100 space-y-4 animate-fadeIn">
                <div>
                  <label className="field-label">Tipo de garantía</label>
                  <select
                    value={data.garantiaTipo}
                    onChange={e => { set('garantiaTipo', e.target.value); setErrors({}); }}
                    className={inputClass('garantiaTipo')}
                  >
                    <option value="">Selecciona…</option>
                    <option value="Hipotecaria">Hipotecaria</option>
                    <option value="Maquinaria">Maquinaria</option>
                    <option value="Equipo de transporte">Equipo de transporte</option>
                  </select>
                  {errors.garantiaTipo && <p className="field-error">{errors.garantiaTipo}</p>}
                </div>

                {data.garantiaTipo === 'Hipotecaria' && (
                  <div className="space-y-3">
                    <div>
                      <label className="field-label">Monto aproximado de la propiedad (MXN)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
                        <input
                          inputMode="numeric"
                          value={data.garantiaHipotecariaMonto}
                          onChange={e => {
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            set('garantiaHipotecariaMonto', raw ? Number(raw).toLocaleString('es-MX') : '');
                          }}
                          className={`${inputClass('garantiaHipotecariaMonto')} pl-8`}
                        />
                      </div>
                      {errors.garantiaHipotecariaMonto && <p className="field-error">{errors.garantiaHipotecariaMonto}</p>}
                    </div>
                    <div>
                      <label className="field-label">¿Es tuya la propiedad? Si no, ¿qué parentesco tienes con el dueño?</label>
                      <input
                        placeholder="Ej: Es mía / Es de mi padre / Es de mi esposa…"
                        value={data.garantiaHipotecariaParentesco}
                        onChange={e => set('garantiaHipotecariaParentesco', e.target.value)}
                        className={inputClass('garantiaHipotecariaParentesco')}
                      />
                      {errors.garantiaHipotecariaParentesco && <p className="field-error">{errors.garantiaHipotecariaParentesco}</p>}
                    </div>
                    <div>
                      <label className="field-label">URL de la ubicación de la propiedad (Google Maps)</label>
                      <input
                        placeholder="https://maps.google.com/…"
                        value={data.garantiaHipotecariaUrl}
                        onChange={e => set('garantiaHipotecariaUrl', e.target.value)}
                        className={inputClass('garantiaHipotecariaUrl')}
                      />
                      {errors.garantiaHipotecariaUrl && <p className="field-error">{errors.garantiaHipotecariaUrl}</p>}
                    </div>
                  </div>
                )}

                {data.garantiaTipo === 'Maquinaria' && (
                  <div className="space-y-4">
                    {data.garantiaMaquinaria.map((eq, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="field-label !mb-0">Equipo {i + 1}</label>
                          {data.garantiaMaquinaria.length > 1 && (
                            <button type="button" onClick={() => quitarMaquinaria(i)} className="text-gray-400 hover:text-red-500 text-xs font-semibold flex items-center gap-1">
                              <X size={13} /> Quitar
                            </button>
                          )}
                        </div>
                        <EquipoFields
                          equipo={eq}
                          onChange={(field, v) => setMaquinaria(i, field, v)}
                          errors={errors}
                          errorPrefix={`maquinaria_${i}`}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={agregarMaquinaria}
                      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:border-firma-green/50 hover:text-firma-green hover:bg-firma-green/5 transition-colors"
                    >
                      <PlusCircle size={16} />
                      Agregar otro equipo
                    </button>
                  </div>
                )}

                {data.garantiaTipo === 'Equipo de transporte' && (
                  <EquipoFields
                    equipo={data.garantiaTransporte}
                    onChange={(field, v) => setTransporte(field, v)}
                    errors={errors}
                    errorPrefix="transporte"
                  />
                )}
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  // ─── Main form ─────────────────────────────────────────────────────────────
  const isLastStep = step === STEP_KEYS.length - 1;
  const progress = (step / (STEP_KEYS.length - 1)) * 100;

  return (
    <section id="profiling" className="py-24 bg-concrete relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-firma-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-charcoal/5 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
            Pre-Calificación
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-charcoal mb-6">
            <span className="italic text-firma-green">Perfilate</span> en minutos
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light">
            Completa el formulario para recibir un análisis detallado por parte de nuestros socios directores.
          </p>

          {/* Trust badges */}
          <div className="mt-8 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Acceso a más de 20 instituciones financieras
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['Axionex', 'Xepelin', 'Konfío', 'Fondeadora', 'Hey Banco', 'Covalto', 'Finsus', 'Finkargo'].map(name => (
                <span
                  key={name}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 shadow-sm"
                >
                  {name}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-firma-green/5 border border-firma-green/20 rounded-lg text-xs font-semibold text-firma-green">
                +12 más
              </span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 rounded-[2rem] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-firma-green/20 via-firma-green to-firma-green/20" />

          {/* Progress */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-firma-green uppercase tracking-widest">
                Paso {step + 1} de {STEP_KEYS.length}
              </span>
              <span className="text-xs text-gray-400">{Math.round(progress)}% completado</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-firma-green/70 to-firma-green rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Aviso de progreso restaurado */}
          {showRestoredBanner && (
            <div className="mx-8 mt-1 mb-2 flex flex-wrap items-center justify-between gap-2 bg-firma-green/5 border border-firma-green/20 rounded-xl px-4 py-2.5">
              <span className="text-xs text-firma-green font-medium">
                Retomamos tu progreso anterior.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestoredBanner(false)}
                  className="text-xs font-semibold text-firma-green hover:underline"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Empezar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-start justify-between px-8 py-3">
            {STEP_KEYS.map((key, i) => (
              <StepDot key={key} label={STEP_LABELS[key]} active={i === step} completed={i < step} />
            ))}
          </div>

          {/* Content */}
          <div className="px-8 pb-4 pt-2">
            <h3 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-firma-green/10 flex items-center justify-center text-firma-green text-sm font-bold flex-shrink-0">
                {step + 1}
              </span>
              {STEP_TITLES[currentKey]}
            </h3>
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between gap-4">
            <button
              onClick={prev}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-600
                hover:border-firma-green hover:text-firma-green hover:bg-firma-green/5
                active:scale-95 transition-all duration-200
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
            >
              ← Anterior
            </button>

            {isLastStep ? (
              <button
                id="form-submit-btn"
                onClick={submit}
                className="flex items-center gap-2 px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold
                  hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30
                  active:translate-y-0 active:shadow-md transition-all duration-200 shadow-md"
              >
                <Eye size={16} />
                Ver resultado
              </button>
            ) : (
              <button
                id="form-next-btn"
                onClick={next}
                className="px-8 py-3 bg-firma-green text-white rounded-full text-sm font-semibold
                  hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-firma-green/30
                  active:translate-y-0 active:shadow-md transition-all duration-200 shadow-md"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-gray-400 font-light tracking-wide italic">
          Tu información está protegida por nuestros protocolos de seguridad bancaria y confidencialidad.
        </p>
      </div>

      <style>{`
        .field-label {
          display: block; font-size: 0.7rem; font-weight: 600; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem;
        }
        .field-error { font-size: 0.7rem; color: #f87171; margin-top: 0.25rem; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </section>
  );
};
